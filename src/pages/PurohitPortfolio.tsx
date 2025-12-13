import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Edit2, Camera, Image, Award, Quote, Upload } from "lucide-react";
import { toast } from "sonner";

interface PortfolioItem {
  id: string;
  type: "photo" | "certification" | "testimonial";
  title: string;
  content_url: string | null;
  content_text: string | null;
}

interface PurohitProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function PurohitPortfolio() {
  const { purohitRecord, loading: authLoading, isPurohit, user } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profile, setProfile] = useState<PurohitProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [itemType, setItemType] = useState<"photo" | "certification" | "testimonial">("photo");
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isPurohit)) {
      navigate('/auth');
    }
  }, [user, authLoading, isPurohit, navigate]);

  useEffect(() => {
    if (purohitRecord?.id) {
      fetchPortfolio();
      fetchProfile();
    }
  }, [purohitRecord?.id]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('purohits')
      .select('id, full_name, avatar_url')
      .eq('id', purohitRecord!.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchPortfolio = async () => {
    const { data } = await supabase
      .from('purohit_portfolio_items')
      .select('*')
      .eq('purohit_id', purohitRecord!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPortfolio(data as PortfolioItem[]);
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${purohitRecord!.id}-${Date.now()}.${fileExt}`;
      const filePath = `purohits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('purohits')
        .update({ avatar_url: publicUrl })
        .eq('id', purohitRecord!.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success("Profile photo updated");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingItem(null);
    setItemType("photo");
    setTitle("");
    setContentText("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setItemType(item.type);
    setTitle(item.title);
    setContentText(item.content_text || "");
    setImagePreview(item.content_url);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);

    try {
      let contentUrl = editingItem?.content_url || null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${purohitRecord!.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        contentUrl = publicUrl;
      }

      if (editingItem) {
        const { error } = await supabase
          .from('purohit_portfolio_items')
          .update({
            type: itemType,
            title: title.trim(),
            content_text: contentText.trim() || null,
            content_url: contentUrl,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success("Portfolio item updated");
      } else {
        const { error } = await supabase
          .from('purohit_portfolio_items')
          .insert({
            purohit_id: purohitRecord!.id,
            type: itemType,
            title: title.trim(),
            content_text: contentText.trim() || null,
            content_url: contentUrl,
          });

        if (error) throw error;
        toast.success("Portfolio item added");
      }

      setDialogOpen(false);
      resetForm();
      fetchPortfolio();
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      toast.error("Failed to save portfolio item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purohit_portfolio_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Portfolio item removed");
      fetchPortfolio();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      toast.error("Failed to remove portfolio item");
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-5 w-5 text-emerald-600" />;
      case 'certification': return <Award className="h-5 w-5 text-amber-600" />;
      case 'testimonial': return <Quote className="h-5 w-5 text-violet-600" />;
      default: return <Image className="h-5 w-5" />;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/purohit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Profile Photo Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Upload a professional photo for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center">
                    <span className="text-primary-foreground font-display text-3xl font-bold">
                      {profile?.full_name?.charAt(0) || 'P'}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground mb-2">Click the camera icon to change photo</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {uploadingAvatar && <p className="text-sm text-primary">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Items */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">My Portfolio</h1>
            <p className="text-muted-foreground mt-1">
              Showcase your work, certifications, and testimonials
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-hero" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle>
                <DialogDescription>
                  Add photos, certifications, or testimonials to your portfolio
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Item Type</Label>
                  <Select value={itemType} onValueChange={(v) => setItemType(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">
                        <span className="flex items-center gap-2">
                          <Image className="h-4 w-4" /> Pooja Photo
                        </span>
                      </SelectItem>
                      <SelectItem value="certification">
                        <span className="flex items-center gap-2">
                          <Award className="h-4 w-4" /> Certification
                        </span>
                      </SelectItem>
                      <SelectItem value="testimonial">
                        <span className="flex items-center gap-2">
                          <Quote className="h-4 w-4" /> Testimonial
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder={itemType === 'photo' ? 'e.g. Griha Pravesh Ceremony' : itemType === 'certification' ? 'e.g. Vedic Studies Certificate' : 'e.g. Client Testimonial'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                    maxLength={100}
                  />
                </div>

                {(itemType === 'photo' || itemType === 'certification') && (
                  <div>
                    <Label>Upload Image</Label>
                    <div className="mt-1">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                        </button>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">
                    {itemType === 'testimonial' ? 'Testimonial Text *' : 'Description (optional)'}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={itemType === 'testimonial' ? 'Enter the testimonial...' : 'Brief description...'}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <Button 
                  className="w-full btn-hero" 
                  onClick={handleSave}
                  disabled={saving || !title.trim() || (itemType === 'testimonial' && !contentText.trim())}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {portfolio.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No portfolio items yet</h3>
              <p className="text-muted-foreground mb-4">
                Add photos of your work, certifications, and client testimonials
              </p>
              <Button className="btn-hero" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {portfolio.map((item) => (
              <Card key={item.id} className="hover:border-primary/30 transition-colors overflow-hidden">
                <div className="flex">
                  {item.content_url && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img 
                        src={item.content_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getItemIcon(item.type)}
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-xs text-muted-foreground capitalize mb-1">{item.type}</p>
                          {item.content_text && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.content_text}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}