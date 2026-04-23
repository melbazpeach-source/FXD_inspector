import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  CalendarCheck,
  Camera,
  FileText,
  Mic,
  Sparkles,
  Zap,
  ArrowRight,
  Globe,
  Shield,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg text-foreground">FXD Inspector</span>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent-foreground text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Next-generation property inspections for New Zealand
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground leading-tight mb-6">
            Property Inspections,{" "}
            <span className="text-accent">Reimagined</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            FXD Inspector combines AI-powered descriptions, 360° photography, voice-to-text, and
            seamless integrations with Palace, Console, and PropertyTree — all in one elegant platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg px-8"
            >
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center text-foreground mb-12">
            Everything you need for professional inspections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarCheck,
                title: "Smart Scheduling",
                desc: "Sync appointments from Palace, Console, PropertyTree, and REST APIs. Appointment tiles launch inspections instantly.",
              },
              {
                icon: Camera,
                title: "360° Photography",
                desc: "Capture immersive 360° photos with Pannellum viewer. Standard and panoramic modes for every room.",
              },
              {
                icon: Sparkles,
                title: "AI Descriptions",
                desc: "AI agent generates detailed decor, condition, points to note, and recommendations from your photos and notes.",
              },
              {
                icon: Mic,
                title: "Voice to Text",
                desc: "Dictate condition notes hands-free in the field. Whisper-powered transcription in real time.",
              },
              {
                icon: FileText,
                title: "Paired Comparison",
                desc: "Side-by-side view of previous vs current inspection. Instantly spot condition changes and maintenance deltas.",
              },
              {
                icon: Globe,
                title: "Remote Inspections",
                desc: "Send tenants a secure link to submit photos and notes. Import directly into your inspection report.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspection types */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-4">
            Seven inspection types, one platform
          </h2>
          <p className="text-muted-foreground mb-10">
            From routine check-ins to full vacate inspections — every type is supported.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Update Based on Previous",
              "New Full",
              "New Vacate",
              "New Inventory",
              "New Chattels",
              "New Routine",
              "New Move-In",
            ].map((type) => (
              <span
                key={type}
                className="px-4 py-2 rounded-full bg-primary/8 border border-primary/20 text-primary text-sm font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="h-12 w-12 mx-auto mb-6 text-accent" />
          <h2 className="font-display text-3xl font-semibold mb-4">
            Built for NZ property professionals
          </h2>
          <p className="text-primary-foreground/80 mb-8 leading-relaxed">
            Designed specifically for the New Zealand property management market.
            Integrates with the tools you already use.
          </p>
          <Button
            size="lg"
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg px-8"
          >
            Start your first inspection <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} FXD Inspector — Professional Property Inspection Platform</p>
      </footer>
    </div>
  );
}
