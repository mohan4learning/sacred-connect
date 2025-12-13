import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
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
  const { session, logout, isClient, isPurohit } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine home link based on role
  const homeLink = isPurohit ? "/purohit" : isClient ? "/client" : "/";

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
          {/* Public links when not logged in */}
          {!session && (
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
          <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{session.profileName}</span>
                  <Menu className="h-4 w-4 sm:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link to={isClient ? "/client" : isPurohit ? "/purohit" : "/"}>
                  <div className="px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
                    <p className="text-sm font-medium">{session.profileName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
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
                <DropdownMenuItem asChild>
                  <Link to="/bookings">Bookings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/consultations">Consultations</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Switch Role / Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="btn-hero">
              <Link to="/start">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
