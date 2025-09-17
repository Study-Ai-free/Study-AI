import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Target, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Personalized study plans and intelligent content recommendations based on your learning style and progress."
  },
  {
    icon: BookOpen,
    title: "Smart Flashcards",
    description: "Generate flashcards automatically from your notes and materials using advanced AI processing."
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Detailed analytics and insights to track your learning journey and identify areas for improvement."
  },
  {
    icon: Zap,
    title: "Quick Quizzes",
    description: "Instant quizzes generated from any topic to test your knowledge and reinforce learning."
  }
];

export const StudyFeatures = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Supercharge Your <span className="accent-gradient bg-clip-text text-transparent">Learning</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Harness the power of AI to transform how you study, learn, and retain information.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-gradient shadow-card hover:shadow-glow transition-smooth border-0 group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};