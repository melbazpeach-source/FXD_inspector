import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PushToPanel from "@/components/PushToPanel";
import {
  FileText,
  ExternalLink,
  Columns2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  update_based_on_previous: "Update Based on Previous",
  new_full: "New Full",
  new_vacate: "New Vacate",
  new_inventory: "New Inventory",
  new_chattels: "New Chattels",
  new_routine: "New Routine",
  new_move_in: "New Move-In",
};

export default function Reports() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comparisonId, setComparisonId] = useState<number | null>(null);

  const { data: inspections, isLoading } = trpc.inspections.list.useQuery();
  const generateReport = trpc.reports.generate.useMutation({
    onSuccess: ({ url }) => {
      toast.success("Report generated!");
      window.open(url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  const completedInspections = inspections?.filter(
    (i) => i.inspection.status === "completed" || i.inspection.status === "report_sent"
  ) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Generate, view, and compare inspection reports
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : completedInspections.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display text-lg font-medium text-foreground mb-2">No completed inspections</h3>
          <p className="text-muted-foreground text-sm">
            Complete an inspection to generate a report.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedInspections.map(({ inspection, property }) => (
            <div key={inspection.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {INSPECTION_TYPE_LABELS[inspection.type] ?? inspection.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(inspection.createdAt).toLocaleDateString("en-NZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {property?.address ?? "Unknown property"}
                    </p>
                    {property?.suburb && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {property.suburb}, {property.city}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inspection.type === "update_based_on_previous" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setComparisonId(comparisonId === inspection.id ? null : inspection.id)
                        }
                        className="text-xs"
                      >
                        <Columns2 className="h-3.5 w-3.5 mr-1.5" />
                        Compare
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => generateReport.mutate({ inspectionId: inspection.id })}
                      disabled={generateReport.isPending}
                      className="bg-primary text-primary-foreground text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Generate
                    </Button>
                    <button
                      onClick={() => setExpandedId(expandedId === inspection.id ? null : inspection.id)}
                      className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      {expandedId === inspection.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Push To (compact) */}
              <div className="px-5 pb-3 border-t" style={{ borderColor: "var(--border)", paddingTop: 12 }}>
                <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Push To</div>
                <PushToPanel inspectionId={inspection.id} compact />
              </div>
              {/* Expanded AI descriptions */}
              {expandedId === inspection.id && (
                <InspectionAiSummary inspectionId={inspection.id} />
              )}

              {/* Paired comparison */}
              {comparisonId === inspection.id && (
                <PairedComparison inspectionId={inspection.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InspectionAiSummary({ inspectionId }: { inspectionId: number }) {
  const { data: aiDescs, isLoading } = trpc.media.getAiDescriptions.useQuery({ inspectionId });
  const generateAi = trpc.media.generateAiDescription.useMutation({
    onSuccess: () => toast.success("AI summary generated!"),
  });

  if (isLoading) return <div className="p-4 border-t border-border animate-pulse h-20 bg-muted/30" />;

  const overallAi = aiDescs?.find((d) => !d.roomId);

  return (
    <div className="border-t border-border p-5 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Summary
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateAi.mutate({ inspectionId })}
          disabled={generateAi.isPending}
          className="text-xs"
        >
          {overallAi ? "Regenerate" : "Generate AI Summary"}
        </Button>
      </div>

      {overallAi ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "decor", label: "Decor", color: "bg-violet-50 border-violet-200 text-violet-800" },
            { key: "condition", label: "Condition", color: "bg-blue-50 border-blue-200 text-blue-800" },
            { key: "pointsToNote", label: "Points to Note", color: "bg-amber-50 border-amber-200 text-amber-800" },
            { key: "recommendations", label: "Recommendations", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          ].map(({ key, label, color }) =>
            (overallAi as any)[key] ? (
              <div key={key} className={`rounded-lg border p-3 ${color}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5">{label}</h4>
                <p className="text-xs leading-relaxed">{(overallAi as any)[key]}</p>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Generate an AI summary to see decor, condition, points to note, and recommendations.
        </p>
      )}
    </div>
  );
}

function PairedComparison({ inspectionId }: { inspectionId: number }) {
  const { data: current } = trpc.inspections.get.useQuery({ id: inspectionId });
  const { data: previous } = trpc.inspections.getPrevious.useQuery(
    { propertyId: current?.inspection.propertyId ?? 0 },
    { enabled: !!current?.inspection.propertyId }
  );

  if (!current) return null;

  const prevInspection = previous && previous.id !== inspectionId ? previous : null;

  return (
    <div className="border-t border-border p-5 bg-muted/20">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Columns2 className="h-4 w-4 text-primary" />
        Paired Comparison
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Previous
            </span>
            {prevInspection && (
              <span className="text-xs text-muted-foreground">
                {new Date(prevInspection.createdAt).toLocaleDateString("en-NZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          {prevInspection ? (
            <div className="space-y-2">
              {prevInspection.rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{room.name}</span>
                  {room.conditionRating && room.conditionRating !== "na" && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        room.conditionRating === "excellent"
                          ? "bg-emerald-100 text-emerald-700"
                          : room.conditionRating === "good"
                          ? "bg-blue-100 text-blue-700"
                          : room.conditionRating === "fair"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {room.conditionRating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No previous inspection found</p>
          )}
        </div>

        {/* Current */}
        <div className="bg-card rounded-xl border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Current
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(current.inspection.createdAt).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="space-y-2">
            {current.rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{room.name}</span>
                {room.conditionRating && room.conditionRating !== "na" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      room.conditionRating === "excellent"
                        ? "bg-emerald-100 text-emerald-700"
                        : room.conditionRating === "good"
                        ? "bg-blue-100 text-blue-700"
                        : room.conditionRating === "fair"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {room.conditionRating}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
