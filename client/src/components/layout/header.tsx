import { Leaf } from "lucide-react";
import { Link } from "wouter";

export function Header() {
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
        
        <nav className="flex items-center gap-4">
          <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            History
          </Link>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
