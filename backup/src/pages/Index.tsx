import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { StudyFeatures } from "@/components/StudyFeatures";
import { CallToAction } from "@/components/CallToAction";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <StudyFeatures />
      <CallToAction />
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              © 2024 StudyAI. Built with ❤️ for learners everywhere.
            </p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-accent transition-smooth">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-smooth">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-smooth">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;