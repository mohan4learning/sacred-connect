import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, Check, X, MessageSquare, Star, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ResponseData {
  id: string;
  purohit_id: string;
  purohit_name: string;
  status: string;
  created_at: string;
  quote: string | null;
  message: string | null;
  messages: any[];
}

interface QuoteComparisonProps {
  responses: ResponseData[];
  onAccept?: (responseId: string) => void;
  onOpenBooking?: (response: ResponseData) => void;
  requestStatus: string;
}

export function QuoteComparison({ responses, onAccept, onOpenBooking, requestStatus }: QuoteComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show responses with quotes for comparison
  const quotedResponses = responses.filter(r => r.quote);

  if (quotedResponses.length < 2) {
    return null; // Need at least 2 quotes to compare
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : prev.length < 4 ? [...prev, id] : prev // Max 4 for comparison
    );
  };

  const selectedResponses = responses.filter(r => selectedIds.includes(r.id));

  const parseQuote = (quote: string | null): number => {
    if (!quote) return 0;
    const match = quote.match(/₹([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  const getLowestQuote = () => {
    const quotes = selectedResponses.map(r => parseQuote(r.quote));
    return Math.min(...quotes.filter(q => q > 0));
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Compare Quotes ({quotedResponses.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Compare Purohit Quotes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selection Section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Select up to 4 quotes to compare side by side:
            </p>
            <div className="flex flex-wrap gap-2">
              {quotedResponses.map((response) => (
                <label
                  key={response.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors",
                    selectedIds.includes(response.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.includes(response.id)}
                    onCheckedChange={() => toggleSelection(response.id)}
                    disabled={!selectedIds.includes(response.id) && selectedIds.length >= 4}
                  />
                  <span className="font-medium text-sm">{response.purohit_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {response.quote}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          {selectedResponses.length >= 2 && (
            <ScrollArea className="max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Attribute</TableHead>
                    {selectedResponses.map((response) => (
                      <TableHead key={response.id} className="text-center min-w-[150px]">
                        <div className="space-y-1">
                          <p className="font-semibold">{response.purohit_name}</p>
                          {response.status === 'accepted' && (
                            <Badge className="bg-emerald-500 text-xs">Accepted</Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Quote Row */}
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Quote
                      </div>
                    </TableCell>
                    {selectedResponses.map((response) => {
                      const quoteValue = parseQuote(response.quote);
                      const isLowest = quoteValue === getLowestQuote() && quoteValue > 0;
                      return (
                        <TableCell key={response.id} className="text-center">
                          <span className={cn(
                            "text-lg font-bold",
                            isLowest && "text-emerald-600"
                          )}>
                            {response.quote || 'N/A'}
                          </span>
                          {isLowest && (
                            <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-xs">
                              Lowest
                            </Badge>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Status Row */}
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    {selectedResponses.map((response) => (
                      <TableCell key={response.id} className="text-center">
                        <Badge variant={response.status === 'accepted' ? 'default' : 'secondary'}>
                          {response.status}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Response Date Row */}
                  <TableRow>
                    <TableCell className="font-medium">Responded</TableCell>
                    {selectedResponses.map((response) => (
                      <TableCell key={response.id} className="text-center text-sm text-muted-foreground">
                        {format(new Date(response.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Message Preview Row */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </div>
                    </TableCell>
                    {selectedResponses.map((response) => (
                      <TableCell key={response.id} className="text-sm">
                        <p className="line-clamp-3 text-muted-foreground">
                          {response.message || 'No message'}
                        </p>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Messages Count Row */}
                  <TableRow>
                    <TableCell className="font-medium">Discussion</TableCell>
                    {selectedResponses.map((response) => (
                      <TableCell key={response.id} className="text-center">
                        <span className="text-sm">
                          {response.messages.length} message{response.messages.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Actions Row */}
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-medium">Actions</TableCell>
                    {selectedResponses.map((response) => (
                      <TableCell key={response.id} className="text-center">
                        <div className="flex flex-col gap-2">
                          {requestStatus === 'open' && response.status === 'requested' && onAccept && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                onAccept(response.id);
                                setDialogOpen(false);
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                          )}
                          {response.status === 'accepted' && onOpenBooking && (
                            <Button 
                              size="sm"
                              className="btn-hero"
                              onClick={() => {
                                onOpenBooking(response);
                                setDialogOpen(false);
                              }}
                            >
                              Book Now
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            asChild
                          >
                            <Link to={`/consultations/${response.id}`}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Chat
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {selectedResponses.length < 2 && (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
              <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select at least 2 quotes to compare</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
