import { Button } from "@/components/ui/button";
import { Leaf, LogOut, MessageCircle, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Header() {
  const [location] = useLocation();
  const token = localStorage.getItem("authToken");
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-primary rounded-lg shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display text-gradient">
            EcoSnap_AI
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/history"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            History
          </Link>

          <Link
            href="/chat"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </Link>

          {token && (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {userName || "Profile"}
                </span>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </>
          )}

          {!token && location !== "/login" && location !== "/register" && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
