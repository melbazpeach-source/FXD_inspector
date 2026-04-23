import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  TrendingUp, Building2, ChevronRight, Zap, DollarSign,
  BarChart2, MapPin, Star, ArrowUpRight, FileText
} from "lucide-react";

export default function RentalAppraisal() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const propertiesQuery = trpc.properties.list.useQuery();
  const appraisalQuery = trpc.agent.getAppraisals.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const generateMutation = trpc.agent.generateRentalAppraisal.useMutation({
    onSuccess: () => {
      appraisalQuery.refetch();
      setIsGenerating(false);
      toast.success("Rental appraisal generated");
    },
    onError: () => {
      setIsGenerating(false);
      toast.error("Failed to generate appraisal");
    },
  });

  const handleGenerate = () => {
    if (!selectedPropertyId) return;
    setIsGenerating(true);
    const prop = (propertiesQuery.data as any[])?.find((p: any) => p.id === selectedPropertyId);
    generateMutation.mutate({
      propertyId: selectedPropertyId,
    });
  };

  const appraisals = (appraisalQuery.data as any[]) || [];
  const appraisal = appraisals[0] as any;

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <TrendingUp size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                RENTAL APPRAISAL
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                AI-powered market analysis, comparable properties, and rent recommendation
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
              {isGenerating ? "Generating..." : "Generate Appraisal"}
            </Button>
          )}
        </div>
      </div>

      {/* Property selector */}
      {!selectedPropertyId ? (
        <div>
          <h2 className="font-archivo text-sm mb-4" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Select Property
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
      ) : (
        <div>
          {appraisalQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading appraisal...</p>
            </div>
          ) : !appraisal ? (
            <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <TrendingUp size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
              <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No Appraisal Generated</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>
                Generate a market-based rental appraisal using inspection data and NZ market stats
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                <Zap size={12} className="mr-2" />
                {isGenerating ? "Generating..." : "Generate Now"}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Rent recommendation hero */}
              <div className="rounded-sm p-6" style={{ background: "var(--black)", color: "var(--white)" }}>
                <div className="font-archivo text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Recommended Weekly Rent
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className="font-anton text-5xl" style={{ color: "var(--yellow)", letterSpacing: "0.01em" }}>
                    {appraisal.recommendedRentMin && appraisal.recommendedRentMax
                      ? `$${appraisal.recommendedRentMin}–$${appraisal.recommendedRentMax}`
                      : appraisal.recommendedRent
                        ? `$${appraisal.recommendedRent}`
                        : "—"}
                  </div>
                  <div className="font-archivo text-sm mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>/ week</div>
                </div>
                {appraisal.currentRent && (
                  <div className="flex items-center gap-2">
                    <span className="font-archivo text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Current: ${appraisal.currentRent}/wk
                    </span>
                    {appraisal.recommendedRentMin && appraisal.currentRent < appraisal.recommendedRentMin && (
                      <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,212,0,0.2)", color: "var(--yellow)", border: "1px solid rgba(255,212,0,0.3)", letterSpacing: "0.08em" }}>
                        <ArrowUpRight size={10} className="mr-1" />
                        Uplift Available
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Market position */}
              {appraisal.marketPosition && (
                <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={16} style={{ color: "var(--pink)" }} />
                    <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Market Position
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7 }}>{appraisal.marketPosition}</p>
                </div>
              )}

              {/* Suburb stats */}
              {(appraisal.suburbMedian || appraisal.suburbRange) && (
                <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} style={{ color: "var(--pink)" }} />
                    <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Suburb Data
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {appraisal.suburbMedian && (
                      <div>
                        <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Median Rent</div>
                        <div className="font-anton text-xl" style={{ color: "var(--ink)" }}>${appraisal.suburbMedian}/wk</div>
                      </div>
                    )}
                    {appraisal.suburbRange && (
                      <div>
                        <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Market Range</div>
                        <div className="font-anton text-xl" style={{ color: "var(--ink)" }}>{appraisal.suburbRange}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Condition impact */}
              {appraisal.conditionImpact && (
                <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} style={{ color: "var(--pink)" }} />
                    <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Condition Assessment
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7 }}>{appraisal.conditionImpact}</p>
                </div>
              )}

              {/* Full narrative */}
              {appraisal.fullNarrative && (
                <div className="rounded-sm p-5 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} style={{ color: "var(--pink)" }} />
                    <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Full Appraisal
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{appraisal.fullNarrative}</p>
                </div>
              )}

              {/* Generated date */}
              {appraisal.generatedAt && (
                <p className="text-xs text-center" style={{ color: "var(--muted-light)" }}>
                  Generated {new Date(appraisal.generatedAt).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
