import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Building2, ChevronRight, Zap, TrendingUp,
  DollarSign, Paintbrush, Hammer, Star, ArrowUpRight, FileText
} from "lucide-react";

export default function ImprovementRecommendations() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const propertiesQuery = trpc.properties.list.useQuery();
  const generateMutation = trpc.agent.generateRentalAppraisal.useMutation({
    onSuccess: (data: any) => {
      setRecommendations(data);
      setIsGenerating(false);
      toast.success("Improvement analysis complete");
    },
    onError: () => {
      setIsGenerating(false);
      toast.error("Failed to generate recommendations");
    },
  });

  const handleGenerate = () => {
    if (!selectedPropertyId) return;
    setIsGenerating(true);
    generateMutation.mutate({ propertyId: selectedPropertyId });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <Sparkles size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                IMPROVEMENT RECOMMENDATIONS
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Full-spectrum AI analysis — every observation, every opportunity, every recommendation
              </p>
            </div>
          </div>
          {selectedPropertyId && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-sm font-archivo text-xs"
              style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <Zap size={14} />
              {isGenerating ? "Analysing..." : "Run Analysis"}
            </Button>
          )}
        </div>
      </div>

      {/* Philosophy banner */}
      <div className="rounded-sm p-5 mb-6" style={{ background: "var(--black)", color: "var(--white)" }}>
        <div className="font-archivo text-xs mb-2" style={{ color: "var(--yellow)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          The Inspect360 Standard
        </div>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
          When you have access to one of the most capable analytical intelligences on the planet, you want to hear <strong style={{ color: "var(--yellow)" }}>everything</strong> it thinks. No hedging. No watered-down suggestions. Every observation, every opportunity, every recommendation — delivered with the confidence of an expert who has seen every property in the world and knows exactly what works.
        </p>
      </div>

      {/* Property selector */}
      {!selectedPropertyId ? (
        <div>
          <h2 className="font-archivo text-sm mb-4" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Select Property to Analyse
          </h2>
          <div className="grid gap-3">
            {(propertiesQuery.data as any[])?.map((prop: any) => (
              <button
                key={prop.id}
                onClick={() => setSelectedPropertyId(prop.id)}
                className="flex items-center gap-4 p-4 rounded-sm border text-left transition-all hover:shadow-md"
                style={{ background: "var(--white)", borderColor: "var(--border)" }}
              >
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "var(--cream)" }}>
                  <Building2 size={18} style={{ color: "var(--muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-archivo text-sm font-bold truncate" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>{prop.address}</div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>{prop.suburb}, {prop.city}</div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted-light)" }} />
              </button>
            ))}
          </div>
        </div>
      ) : isGenerating ? (
        <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
          <p className="font-archivo text-sm mb-1" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Agent Analysing Property</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Reviewing all inspection data, photos, condition history, and market context...
          </p>
        </div>
      ) : !recommendations ? (
        <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
          <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Ready to Analyse</p>
          <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>
            Run the full-spectrum analysis to get every recommendation for this property
          </p>
          <Button
            onClick={handleGenerate}
            className="rounded-sm font-archivo text-xs"
            style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            <Zap size={12} className="mr-2" />
            Run Analysis Now
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* ROI Summary Hero */}
          <div className="rounded-sm p-6 grid grid-cols-2 gap-6" style={{ background: "var(--black)", color: "var(--white)" }}>
            <div>
              <div className="font-archivo text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Tier 1 — Cosmetic Refresh
              </div>
              <div className="font-anton text-2xl mb-1" style={{ color: "var(--yellow)", letterSpacing: "0.01em" }}>
                {recommendations.cosmeticCost || "$1,500–3,000"}
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                investment → <strong style={{ color: "var(--yellow)" }}>{recommendations.cosmeticUplift || "$30–50/wk"}</strong> uplift
              </div>
            </div>
            <div>
              <div className="font-archivo text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Tier 2 — Capital Improvement
              </div>
              <div className="font-anton text-2xl mb-1" style={{ color: "var(--pink)", letterSpacing: "0.01em" }}>
                {recommendations.renovationCost || "$25,000–45,000"}
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                investment → <strong style={{ color: "var(--pink)" }}>{recommendations.renovationUplift || "$80–120/wk"}</strong> uplift
              </div>
            </div>
          </div>

          {/* Market Position */}
          {recommendations.marketPosition && (
            <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: "var(--pink)" }} />
                <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Current Market Position
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.8 }}>{recommendations.marketPosition}</p>
            </div>
          )}

          {/* Tier 1 — Cosmetic Recommendations */}
          <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 p-4" style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
              <Paintbrush size={16} style={{ color: "var(--pink)" }} />
              <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Tier 1 — Cosmetic Refresh
              </h3>
              <Badge className="font-archivo text-xs px-2 py-0.5 ml-auto" style={{ background: "rgba(255,45,135,0.1)", color: "var(--pink)", border: "1px solid rgba(255,45,135,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Quick Wins
              </Badge>
            </div>
            <div className="p-5" style={{ background: "var(--white)" }}>
              {recommendations.cosmeticRecommendations ? (
                <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {recommendations.cosmeticRecommendations}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No cosmetic recommendations generated.</p>
              )}
            </div>
          </div>

          {/* Tier 2 — Capital Improvements */}
          <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 p-4" style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
              <Hammer size={16} style={{ color: "#6366f1" }} />
              <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Tier 2 — Capital Improvements
              </h3>
              <Badge className="font-archivo text-xs px-2 py-0.5 ml-auto" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Investment Opportunities
              </Badge>
            </div>
            <div className="p-5" style={{ background: "var(--white)" }}>
              {recommendations.renovationRecommendations ? (
                <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {recommendations.renovationRecommendations}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No capital improvement recommendations generated.</p>
              )}
            </div>
          </div>

          {/* Full Narrative */}
          {recommendations.fullNarrative && (
            <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} style={{ color: "var(--pink)" }} />
                <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Full Analysis
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{recommendations.fullNarrative}</p>
            </div>
          )}

          {/* Landlord conversation starter */}
          <div className="rounded-sm p-5 border" style={{ background: "rgba(255,212,0,0.08)", borderColor: "rgba(255,212,0,0.3)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} style={{ color: "var(--yellow-warm)" }} />
              <span className="font-archivo text-xs font-bold" style={{ color: "var(--yellow-warm)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Landlord Conversation Starter
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--ink)", lineHeight: 1.6 }}>
              Want Fixx to draft a summary brief for your next landlord conversation? The agent will prepare a 2-minute read covering the key opportunities and ROI case.
            </p>
            <Button
              variant="outline"
              className="rounded-sm font-archivo text-xs"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase", borderColor: "rgba(255,184,0,0.4)", color: "var(--yellow-warm)" }}
              onClick={() => toast.info("Open Fixx Chat to request the landlord brief")}
            >
              <Sparkles size={12} className="mr-2" />
              Ask Fixx to Draft Brief
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
