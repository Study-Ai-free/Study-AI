import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg hero-gradient flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">StudyAI</span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground hover:text-accent transition-smooth">Features</a>
            <a href="#about" className="text-foreground hover:text-accent transition-smooth">About</a>
            <a href="#pricing" className="text-foreground hover:text-accent transition-smooth">Pricing</a>
            <a href="#contact" className="text-foreground hover:text-accent transition-smooth">Contact</a>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost">Sign In</Button>
            <Button variant="accent">Get Started</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};