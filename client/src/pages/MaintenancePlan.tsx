import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wrench, Building2, ChevronRight, Zap, CheckCircle2,
  AlertTriangle, XCircle, Calendar, DollarSign, TrendingUp
} from "lucide-react";

type TrafficLight = "green" | "orange" | "red";

const TRAFFIC_CONFIG = {
  green: {
    label: "Good — Monitor",
    description: "Can go another year. Monitor at next inspection.",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    icon: CheckCircle2,
  },
  orange: {
    label: "Address Soon",
    description: "Better to fix before it becomes a bigger problem.",
    color: "var(--yellow-warm)",
    bg: "rgba(255,184,0,0.08)",
    border: "rgba(255,184,0,0.3)",
    icon: AlertTriangle,
  },
  red: {
    label: "Act Now",
    description: "Needs addressing immediately — liability, safety, or cost escalation risk.",
    color: "var(--pink)",
    bg: "rgba(255,45,135,0.08)",
    border: "rgba(255,45,135,0.2)",
    icon: XCircle,
  },
};

const COST_BRACKETS = [
  { value: "under_500", label: "Under $500" },
  { value: "500_2000", label: "$500–$2,000" },
  { value: "2000_10000", label: "$2,000–$10,000" },
  { value: "over_10000", label: "$10,000+" },
];

export default function MaintenancePlan() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const propertiesQuery = trpc.properties.list.useQuery();
  const planQuery = trpc.agent.getMaintenancePlan.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const generateMutation = trpc.agent.generateMaintenancePlan.useMutation({
    onSuccess: () => {
      planQuery.refetch();
      setIsGenerating(false);
      toast.success("12-month maintenance plan generated");
    },
    onError: () => {
      setIsGenerating(false);
      toast.error("Failed to generate plan");
    },
  });

  const handleGenerate = () => {
    if (!selectedPropertyId) return;
    setIsGenerating(true);
    const prop = (propertiesQuery.data as any[])?.find((p: any) => p.id === selectedPropertyId);
    generateMutation.mutate({ propertyId: selectedPropertyId, propertyAddress: prop?.address || "Unknown" });
  };

  const planItems = (planQuery.data as any[]) || [];
  const redItems = planItems.filter((i: any) => i.priority === "red" || i.trafficLight === "red");
  const orangeItems = planItems.filter((i: any) => i.priority === "orange" || i.trafficLight === "orange");
  const greenItems = planItems.filter((i: any) => i.priority === "green" || i.trafficLight === "green");

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <Wrench size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                MAINTENANCE PLAN
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                12-month proactive plan with traffic light priority system
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
              {isGenerating ? "Generating..." : "Generate Plan"}
            </Button>
          )}
        </div>
      </div>

      {/* Traffic light legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {(Object.entries(TRAFFIC_CONFIG) as [TrafficLight, typeof TRAFFIC_CONFIG.green][]).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div
              key={key}
              className="rounded-sm p-4 border"
              style={{ background: config.bg, borderColor: config.border }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} style={{ color: config.color }} />
                <span className="font-archivo text-sm font-bold" style={{ color: config.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.5 }}>{config.description}</p>
            </div>
          );
        })}
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
          {planQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading maintenance plan...</p>
            </div>
          ) : planItems.length === 0 ? (
            <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <Wrench size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
              <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No Plan Generated</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>
                Generate a 12-month proactive maintenance plan based on inspection history
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                <Zap size={12} className="mr-2" />
                {isGenerating ? "Generating..." : "Generate Plan Now"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Act Now", value: redItems.length, color: "var(--pink)" },
                  { label: "Address Soon", value: orangeItems.length, color: "var(--yellow-warm)" },
                  { label: "Monitor", value: greenItems.length, color: "#10b981" },
                  { label: "Total Items", value: planItems.length, color: "var(--black)" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-sm p-3 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                    <div className="font-anton text-2xl" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Items by priority */}
              {(["red", "orange", "green"] as TrafficLight[]).map(priority => {
                const items = priority === "red" ? redItems : priority === "orange" ? orangeItems : greenItems;
                if (items.length === 0) return null;
                const config = TRAFFIC_CONFIG[priority];
                const Icon = config.icon;
                return (
                  <div key={priority}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} style={{ color: config.color }} />
                      <h3 className="font-archivo text-sm font-bold" style={{ color: config.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {config.label} ({items.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-sm border"
                          style={{ background: "var(--white)", borderColor: "var(--border)", borderLeft: `3px solid ${config.color}` }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                                {item.itemName || item.title}
                              </div>
                              <p className="text-sm mb-2" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
                                {item.description || item.recommendation}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {item.estimatedCost && (
                                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                    <DollarSign size={11} />
                                    <span>{item.estimatedCost}</span>
                                  </div>
                                )}
                                {item.timeframe && (
                                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                                    <Calendar size={11} />
                                    <span>{item.timeframe}</span>
                                  </div>
                                )}
                                {item.room && (
                                  <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "var(--cream)", color: "var(--muted)", border: "1px solid var(--border)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                    {item.room}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge
                              className="font-archivo text-xs px-2 py-1 flex-shrink-0"
                              style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}`, letterSpacing: "0.08em", textTransform: "uppercase" }}
                            >
                              {priority === "red" ? "ACT NOW" : priority === "orange" ? "SOON" : "MONITOR"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
