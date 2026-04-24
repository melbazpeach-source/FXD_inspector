import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Building2, ChevronRight, Zap, TrendingUp,
  DollarSign, Paintbrush, Hammer, Star, ArrowUpRight,
  CheckCircle2, Clock, AlertTriangle, Loader2, Plus, Trash2,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  kitchen: Hammer,
  bathroom: Sparkles,
  flooring: Building2,
  exterior: Building2,
  interior: Paintbrush,
  landscaping: Star,
  roofing: Building2,
  other: Zap,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  kitchen:     { bg: "rgba(245,158,11,0.12)",  text: "#d97706" },
  bathroom:    { bg: "rgba(14,165,233,0.12)",   text: "#0284c7" },
  flooring:    { bg: "rgba(99,102,241,0.12)",   text: "#4f46e5" },
  exterior:    { bg: "rgba(16,185,129,0.12)",   text: "#059669" },
  interior:    { bg: "rgba(255,45,135,0.12)",   text: "var(--pink)" },
  landscaping: { bg: "rgba(34,197,94,0.12)",    text: "#16a34a" },
  roofing:     { bg: "rgba(239,68,68,0.12)",    text: "#dc2626" },
  other:       { bg: "rgba(0,0,0,0.06)",        text: "var(--muted)" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent",  color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  high:   { label: "High",    color: "#d97706", bg: "rgba(245,158,11,0.1)" },
  medium: { label: "Medium",  color: "#0284c7", bg: "rgba(14,165,233,0.1)" },
  low:    { label: "Low",     color: "#16a34a", bg: "rgba(34,197,94,0.1)" },
};

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  recommended: { label: "Recommended", icon: Sparkles,     color: "var(--pink)" },
  approved:    { label: "Approved",    icon: CheckCircle2, color: "#16a34a" },
  in_progress: { label: "In Progress", icon: Clock,        color: "#d97706" },
  completed:   { label: "Completed",   icon: CheckCircle2, color: "#0284c7" },
  deferred:    { label: "Deferred",    icon: AlertTriangle, color: "var(--muted)" },
};

export default function ImprovementRecommendations() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const propertiesQuery = trpc.properties.list.useQuery();
  const improvementsQuery = trpc.improvements.list.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );

  const updateStatus = trpc.improvements.updateStatus.useMutation({
    onSuccess: () => improvementsQuery.refetch(),
    onError: () => toast.error("Failed to update status"),
  });
  const deleteItem = trpc.improvements.delete.useMutation({
    onSuccess: () => {
      improvementsQuery.refetch();
      toast.success("Removed");
    },
  });

  const generateMutation = trpc.agent.generateRentalAppraisal.useMutation({
    onSuccess: (data: any) => {
      setAiResult(data);
      setIsGenerating(false);
      toast.success("AI analysis complete");
    },
    onError: () => {
      setIsGenerating(false);
      toast.error("Failed to generate AI analysis");
    },
  });

  const items = improvementsQuery.data ?? [];

  // Group by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalCostMin = items.reduce((s, i) => s + (i.estimatedCostMin ?? 0), 0);
  const totalCostMax = items.reduce((s, i) => s + (i.estimatedCostMax ?? 0), 0);
  const totalUplift  = items.reduce((s, i) => s + (i.potentialRentUplift ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <Sparkles size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                IMPROVEMENTS
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Reno, redec, and capital improvement recommendations
              </p>
            </div>
          </div>
          {selectedPropertyId && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedPropertyId(null)}
                className="rounded-sm font-archivo text-xs"
                style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Change Property
              </Button>
              <Button
                onClick={() => { setIsGenerating(true); generateMutation.mutate({ propertyId: selectedPropertyId }); }}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {isGenerating ? "Analysing..." : "Run AI Analysis"}
              </Button>
            </div>
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
        <div className="space-y-5">
          {/* Loading */}
          {improvementsQuery.isLoading && (
            <div className="text-center py-12">
              <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: "var(--pink)" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading improvements...</p>
            </div>
          )}

          {/* Empty state */}
          {!improvementsQuery.isLoading && items.length === 0 && !aiResult && (
            <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <Sparkles size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
              <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No Recommendations Yet</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>
                Run the AI analysis to generate improvement recommendations for this property.
              </p>
              <Button
                onClick={() => { setIsGenerating(true); generateMutation.mutate({ propertyId: selectedPropertyId }); }}
                disabled={isGenerating}
                className="rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                <Zap size={12} className="mr-2" />
                Run Analysis Now
              </Button>
            </div>
          )}

          {/* Summary hero */}
          {items.length > 0 && (
            <div className="rounded-sm p-6 grid grid-cols-3 gap-6" style={{ background: "var(--black)", color: "var(--white)" }}>
              <div>
                <div className="font-archivo text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Items</div>
                <div className="font-anton text-3xl" style={{ color: "var(--yellow)", letterSpacing: "0.01em" }}>{items.length}</div>
              </div>
              <div>
                <div className="font-archivo text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Est. Investment</div>
                <div className="font-anton text-2xl" style={{ color: "var(--pink)", letterSpacing: "0.01em" }}>
                  {totalCostMin > 0 ? `$${totalCostMin.toLocaleString()}–$${totalCostMax.toLocaleString()}` : "—"}
                </div>
              </div>
              <div>
                <div className="font-archivo text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Potential Rent Uplift</div>
                <div className="font-anton text-2xl" style={{ color: "var(--yellow)", letterSpacing: "0.01em" }}>
                  {totalUplift > 0 ? `+$${totalUplift}/wk` : "—"}
                </div>
              </div>
            </div>
          )}

          {/* Grouped improvements */}
          {Object.entries(grouped).map(([category, catItems]) => {
            const Icon = CATEGORY_ICONS[category] ?? Zap;
            const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
            return (
              <div key={category} className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: colors.bg }}>
                    <Icon size={14} style={{ color: colors.text }} />
                  </div>
                  <h3 className="font-archivo text-xs font-bold flex-1" style={{ color: "var(--ink)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  {catItems.map(item => {
                    const priority = PRIORITY_LABELS[item.priority ?? "medium"];
                    const status = STATUS_LABELS[item.status ?? "recommended"];
                    const StatusIcon = status.icon;
                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{item.title}</span>
                              <span className="font-archivo text-xs px-2 py-0.5 rounded-sm" style={{ background: priority.bg, color: priority.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {priority.label}
                              </span>
                              <span className="flex items-center gap-1 font-archivo text-xs" style={{ color: status.color }}>
                                <StatusIcon size={10} />
                                {status.label}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm mb-2" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              {(item.estimatedCostMin || item.estimatedCostMax) && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                  <DollarSign size={11} />
                                  {item.estimatedCostMin && item.estimatedCostMax
                                    ? `$${item.estimatedCostMin.toLocaleString()}–$${item.estimatedCostMax.toLocaleString()}`
                                    : item.estimatedCostMax
                                    ? `Up to $${item.estimatedCostMax.toLocaleString()}`
                                    : `From $${item.estimatedCostMin?.toLocaleString()}`}
                                </span>
                              )}
                              {item.potentialRentUplift && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                                  <ArrowUpRight size={11} />
                                  +${item.potentialRentUplift}/wk rent uplift
                                </span>
                              )}
                              {item.roiMonths && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                  <TrendingUp size={11} />
                                  ROI in ~{item.roiMonths} months
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Status cycle */}
                            <select
                              value={item.status ?? "recommended"}
                              onChange={e => updateStatus.mutate({ id: item.id, status: e.target.value as any })}
                              className="font-archivo text-xs rounded-sm px-2 py-1 border"
                              style={{ background: "var(--cream)", borderColor: "var(--border)", color: "var(--muted)", letterSpacing: "0.04em" }}
                            >
                              {Object.entries(STATUS_LABELS).map(([val, s]) => (
                                <option key={val} value={val}>{s.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => deleteItem.mutate({ id: item.id })}
                              className="p-1.5 rounded-sm transition-colors"
                              style={{ color: "var(--muted-light)" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-light)")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* AI analysis result (if generated) */}
          {aiResult && (
            <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: "var(--black)", borderColor: "rgba(255,255,255,0.08)" }}>
                <Sparkles size={14} style={{ color: "var(--yellow)" }} />
                <h3 className="font-archivo text-xs font-bold" style={{ color: "var(--white)", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI Full Analysis</h3>
              </div>
              <div className="p-5 space-y-4" style={{ background: "var(--white)" }}>
                {aiResult.marketPosition && (
                  <div>
                    <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Market Position</div>
                    <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7 }}>{aiResult.marketPosition}</p>
                  </div>
                )}
                {aiResult.cosmeticRecommendations && (
                  <div>
                    <div className="font-archivo text-xs mb-1" style={{ color: "var(--pink)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cosmetic Refresh</div>
                    <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult.cosmeticRecommendations}</p>
                  </div>
                )}
                {aiResult.renovationRecommendations && (
                  <div>
                    <div className="font-archivo text-xs mb-1" style={{ color: "#6366f1", letterSpacing: "0.08em", textTransform: "uppercase" }}>Capital Improvements</div>
                    <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiResult.renovationRecommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Landlord conversation starter */}
          {items.length > 0 && (
            <div className="rounded-sm p-5 border" style={{ background: "rgba(255,212,0,0.08)", borderColor: "rgba(255,212,0,0.3)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} style={{ color: "var(--yellow-warm)" }} />
                <span className="font-archivo text-xs font-bold" style={{ color: "var(--yellow-warm)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Landlord Conversation Starter
                </span>
              </div>
              <p className="text-sm mb-3" style={{ color: "var(--ink)", lineHeight: 1.6 }}>
                Ask Fixx to draft a 2-minute landlord brief covering the key opportunities and ROI case for this property.
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
          )}
        </div>
      )}
    </div>
  );
}
