import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Wrench, Building2, ChevronRight, Zap, CheckCircle2,
  AlertTriangle, XCircle, Calendar, DollarSign, ArrowLeft,
  MapPin, Check, ChevronDown
} from "lucide-react";

type TrafficLight = "green" | "orange" | "red";
type PlanStatus = "open" | "in_progress" | "completed" | "deferred";

const TRAFFIC_CONFIG: Record<TrafficLight, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  green:  { label: "Monitor",      color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  icon: CheckCircle2  },
  orange: { label: "Address Soon", color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)",  icon: AlertTriangle },
  red:    { label: "Act Now",      color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   icon: XCircle       },
};

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  in_progress: { label: "In Progress", color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  completed:   { label: "Done",        color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  deferred:    { label: "Deferred",    color: "#94a3b8", bg: "rgba(148,163,184,0.1)"},
};

const COST_LABELS: Record<string, string> = {
  under_500:    "Under $500",
  "500_2000":   "$500–$2,000",
  "2000_10000": "$2,000–$10,000",
  over_10000:   "$10,000+",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MaintenancePlan() {
  const [selPropId, setSelPropId] = useState<number | null>(null);
  const [detail, setDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterLight, setFilterLight] = useState<TrafficLight | "all">("all");

  const { data: props = [] } = trpc.properties.list.useQuery();
  const planQuery = trpc.agent.getMaintenancePlan.useQuery(
    { propertyId: selPropId! },
    { enabled: !!selPropId }
  );
  const updateMutation = trpc.agent.updateMaintenancePlanItem.useMutation({
    onSuccess: () => { planQuery.refetch(); toast.success("Updated"); },
    onError: () => toast.error("Failed to update"),
  });
  const generateMutation = trpc.agent.generateMaintenancePlan.useMutation({
    onSuccess: () => {
      planQuery.refetch();
      setIsGenerating(false);
      toast.success("12-month maintenance plan generated");
    },
    onError: () => { setIsGenerating(false); toast.error("Failed to generate plan"); },
  });

  const handleGenerate = () => {
    if (!selPropId) return;
    setIsGenerating(true);
    const prop = (props as any[]).find((p: any) => p.id === selPropId);
    generateMutation.mutate({ propertyId: selPropId, propertyAddress: prop?.address || "Unknown" });
  };

  const planItems: any[] = (planQuery.data as any[]) || [];
  const filtered = filterLight === "all" ? planItems : planItems.filter(i => i.trafficLight === filterLight);
  const redCount    = planItems.filter(i => i.trafficLight === "red").length;
  const orangeCount = planItems.filter(i => i.trafficLight === "orange").length;
  const greenCount  = planItems.filter(i => i.trafficLight === "green").length;
  const doneCount   = planItems.filter(i => i.status === "completed").length;

  const selProp = (props as any[]).find((p: any) => p.id === selPropId);

  // Group by month for timeline view
  const byMonth: Record<number, any[]> = {};
  filtered.forEach(item => {
    const m = item.dueByMonth ?? 0;
    (byMonth[m] = byMonth[m] ?? []).push(item);
  });
  const sortedMonths = Object.keys(byMonth).map(Number).sort((a, b) => a - b);

  return (
    <DashboardLayout title="Maintenance Plan">
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
        {/* Left panel */}
        <div className={`flex-col border-r flex-shrink-0 w-full lg:w-72 ${detail ? "hidden lg:flex" : "flex"}`}
          style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--cream)" }}>
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--black)" }}>
                <Wrench className="w-4 h-4" style={{ color: "var(--yellow)" }} />
              </div>
              <h1 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>MAINTENANCE</h1>
            </div>
            <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>12-month proactive plan</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {(props as any[]).map((p: any) => {
              const active = selPropId === p.id;
              return (
                <button key={p.id} onClick={() => { setSelPropId(p.id); setDetail(true); }}
                  className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                  style={{ background: active ? "var(--black)" : "white", border: `1.5px solid ${active ? "var(--black)" : "rgba(0,0,0,0.08)"}` }}>
                  <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: active ? "var(--yellow)" : "var(--pink)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-archivo text-sm font-semibold truncate" style={{ color: active ? "white" : "var(--black)" }}>{p.address}</p>
                    {p.suburb && <p className="font-archivo text-xs truncate" style={{ color: active ? "rgba(255,255,255,0.6)" : "var(--muted)" }}>{p.suburb}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: active ? "rgba(255,255,255,0.5)" : "var(--muted)" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className={`flex-1 overflow-y-auto ${detail ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`} style={{ background: "var(--cream)" }}>
          {!selPropId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Wrench className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(0,0,0,0.1)" }} />
                <p className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>Select a property</p>
                <p className="font-archivo text-xs mt-1" style={{ color: "var(--muted)" }}>Choose a property to view its maintenance plan</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
              <button onClick={() => setDetail(false)} className="lg:hidden flex items-center gap-2 mb-4 font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>
                <ArrowLeft className="w-4 h-4" /> All Properties
              </button>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-anton text-xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>{selProp?.address}</h2>
                  <p className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)" }}>12-month proactive maintenance plan</p>
                </div>
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="fxd-btn flex items-center gap-2 flex-shrink-0"
                  style={{ background: "var(--black)", color: "var(--yellow)", fontSize: 12, padding: "8px 14px" }}>
                  <Zap className="w-3.5 h-3.5" />
                  {isGenerating ? "Generating..." : planItems.length > 0 ? "Regenerate" : "Generate Plan"}
                </button>
              </div>

              {planQuery.isLoading ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
                  <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>Loading plan...</p>
                </div>
              ) : planItems.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1.5px dashed rgba(0,0,0,0.1)" }}>
                  <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,0,0,0.1)" }} />
                  <p className="font-archivo text-sm font-semibold mb-1" style={{ color: "var(--black)" }}>No plan yet</p>
                  <p className="font-archivo text-xs mb-5" style={{ color: "var(--muted)" }}>Generate a 12-month proactive maintenance plan based on inspection history and chattels</p>
                  <button onClick={handleGenerate} disabled={isGenerating}
                    className="fxd-btn fxd-btn-pink flex items-center gap-2 mx-auto">
                    <Zap className="w-4 h-4" /> {isGenerating ? "Generating..." : "Generate Plan Now"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { l: "Act Now",      v: redCount,    col: "#ef4444" },
                      { l: "Address Soon", v: orangeCount, col: "#d97706" },
                      { l: "Monitor",      v: greenCount,  col: "#10b981" },
                      { l: "Completed",    v: doneCount,   col: "var(--black)" },
                    ].map(s => (
                      <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.06)" }}>
                        <p className="font-anton text-2xl" style={{ color: s.col }}>{s.v}</p>
                        <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{s.l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Filter */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {(["all", "red", "orange", "green"] as const).map(f => (
                      <button key={f} onClick={() => setFilterLight(f)}
                        className="px-3 py-1.5 rounded-xl font-archivo text-xs font-semibold transition-all capitalize"
                        style={{
                          background: filterLight === f ? (f === "all" ? "var(--black)" : TRAFFIC_CONFIG[f]?.bg ?? "var(--black)") : "white",
                          color: filterLight === f ? (f === "all" ? "white" : TRAFFIC_CONFIG[f]?.color ?? "white") : "var(--muted)",
                          border: `1.5px solid ${filterLight === f ? (f === "all" ? "var(--black)" : TRAFFIC_CONFIG[f]?.border ?? "var(--black)") : "rgba(0,0,0,0.08)"}`,
                        }}>
                        {f === "all" ? "All Items" : TRAFFIC_CONFIG[f].label}
                      </button>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-6">
                    {sortedMonths.map(month => {
                      const monthItems = byMonth[month];
                      const monthLabel = month >= 1 && month <= 12 ? MONTH_NAMES[month - 1] : `Month ${month}`;
                      return (
                        <div key={month}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--black)" }}>
                              <Calendar className="w-4 h-4" style={{ color: "var(--yellow)" }} />
                            </div>
                            <h3 className="font-anton text-base" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>{monthLabel}</h3>
                            <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
                          </div>
                          <div className="space-y-2 ml-11">
                            {monthItems.map((item: any) => {
                              const tl: TrafficLight = item.trafficLight ?? "green";
                              const config = TRAFFIC_CONFIG[tl];
                              const Icon = config.icon;
                              const status: PlanStatus = item.status ?? "open";
                              const statusCfg = STATUS_CONFIG[status];
                              const isExpanded = expandedId === item.id;
                              return (
                                <div key={item.id} className="rounded-xl overflow-hidden"
                                  style={{ background: "white", border: `1.5px solid ${config.border}`, borderLeft: `4px solid ${config.color}` }}>
                                  <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                    className="w-full flex items-start gap-3 p-4 text-left">
                                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>{item.title}</p>
                                      {item.location && (
                                        <p className="font-archivo text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--muted)" }}>
                                          <MapPin className="w-3 h-3" /> {item.location}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="font-archivo text-xs px-2 py-0.5 rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                                      <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--muted)", transform: isExpanded ? "rotate(180deg)" : "none" }} />
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                      <p className="font-archivo text-sm mt-3 mb-3" style={{ color: "var(--muted)", lineHeight: 1.6 }}>{item.description}</p>
                                      {item.recommendedAction && (
                                        <div className="rounded-xl p-3 mb-3" style={{ background: "var(--cream)" }}>
                                          <p className="font-archivo text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>Recommended Action</p>
                                          <p className="font-archivo text-sm" style={{ color: "var(--black)" }}>{item.recommendedAction}</p>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                                        {item.estimatedCostBracket && (
                                          <div className="flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
                                            <span className="font-archivo text-xs" style={{ color: "var(--black)" }}>{COST_LABELS[item.estimatedCostBracket] ?? item.estimatedCostBracket}</span>
                                          </div>
                                        )}
                                        {item.urgencyTimeline && (
                                          <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--muted)" }} />
                                            <span className="font-archivo text-xs" style={{ color: "var(--black)" }}>{item.urgencyTimeline}</span>
                                          </div>
                                        )}
                                      </div>
                                      {/* Status buttons */}
                                      <div className="flex gap-2 flex-wrap">
                                        {(["open","in_progress","completed","deferred"] as PlanStatus[]).map(s => (
                                          <button key={s} onClick={() => updateMutation.mutate({ id: item.id, status: s })}
                                            className="px-3 py-1.5 rounded-xl font-archivo text-xs font-semibold transition-all flex items-center gap-1.5"
                                            style={{
                                              background: status === s ? STATUS_CONFIG[s].bg : "var(--cream)",
                                              color: status === s ? STATUS_CONFIG[s].color : "var(--muted)",
                                              border: `1.5px solid ${status === s ? STATUS_CONFIG[s].color + "40" : "rgba(0,0,0,0.08)"}`,
                                            }}>
                                            {status === s && <Check className="w-3 h-3" />}
                                            {STATUS_CONFIG[s].label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
