import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, User, LogOut, Menu, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const isClient = profile?.role === 'client';
  const isPurohit = profile?.role === 'purohit';
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Determine home link based on role
  const homeLink = isAdmin ? "/admin" : isPurohit ? "/purohit" : isClient ? "/client" : "/";
  
  // Get display name
  const displayName = profile?.full_name || user?.email || 'User';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={homeLink} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-primary-foreground font-display text-sm font-bold">प</span>
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            PurohitConnect
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {/* Client-only links */}
          {isClient && (
            <>
              <Link to="/purohits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Find Purohits
              </Link>
              <Link to="/request" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Request Pooja
              </Link>
              <Link to="/client/requests" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Requests
              </Link>
            </>
          )}
          {/* Purohit-only links */}
          {isPurohit && (
            <>
              <Link to="/purohit" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/purohit/calendar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Calendar
              </Link>
              <Link to="/purohit/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Services
              </Link>
              <Link to="/purohit/locations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Locations
              </Link>
            </>
          )}
          {/* Admin links */}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
          {/* Public links when not logged in */}
          {!user && (
            <>
              <Link to="/purohits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Find Purohits
              </Link>
              <Link to="/request" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Request Pooja
              </Link>
            </>
          )}
          <Link to="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Help
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{displayName}</span>
                  <Menu className="h-4 w-4 sm:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link to={homeLink}>
                  <div className="px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                  </div>
                </Link>
                <DropdownMenuSeparator />
                {isClient && (
                  <DropdownMenuItem asChild>
                    <Link to="/client">My Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {isPurohit && (
                  <DropdownMenuItem asChild>
                    <Link to="/purohit">My Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/bookings">Bookings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/consultations">Consultations</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="btn-hero">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
