import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Plus,
  ChevronRight,
  Calendar,
  MapPin,
} from "lucide-react";

// STATUS_CONFIG is built inside the component so labels can use t()

// TYPE_LABELS is built inside the component so labels can use t()

export default function InspectionsList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: inspections, isLoading } = trpc.inspections.list.useQuery({});

  const grouped = inspections
    ? inspections.reduce((acc: Record<string, typeof inspections>, item) => {
        const status = item.inspection.status ?? "draft";
        if (!acc[status]) acc[status] = [];
        acc[status].push(item);
        return acc;
      }, {})
    : {};

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    completed: { label: t("inspections.filterCompleted"), color: "#22c55e", icon: <CheckCircle2 size={14} /> },
    report_sent: { label: t("common.sent"), color: "#6366f1", icon: <FileText size={14} /> },
    in_progress: { label: t("inspections.filterInProgress"), color: "#f59e0b", icon: <Clock size={14} /> },
    draft: { label: t("common.draft"), color: "#94a3b8", icon: <AlertCircle size={14} /> },
  };

  const TYPE_LABELS: Record<string, string> = {
    new_routine: t("inspections.routine"),
    new_move_in: t("inspections.moveIn"),
    new_vacate: t("inspections.vacate"),
    new_full: "Full",
    new_inventory: "Inventory",
    new_chattels: "Chattels",
    update_based_on_previous: "Update",
  };

  const statusOrder = ["in_progress", "draft", "completed", "report_sent"];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-anton text-3xl md:text-4xl uppercase tracking-tight"
            style={{ color: "var(--black)", lineHeight: 1 }}
          >
            {t("inspections.title")}
          </h1>
          <p className="font-archivo text-sm mt-1" style={{ color: "var(--muted)" }}>
            {isLoading ? t("common.loading") : `${inspections?.length ?? 0} ${t("inspections.allInspections").toLowerCase()}`}
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard")}
          className="font-archivo font-bold text-xs uppercase tracking-widest"
          style={{ background: "var(--pink)", color: "#fff", border: "none" }}
        >
          <Plus size={14} className="mr-1" /> {t("dashboard.newInspection")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--card)" }} />
          ))}
        </div>
      ) : !inspections?.length ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
        >
          <ClipboardList size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="font-anton text-xl uppercase" style={{ color: "var(--black)" }}>{t("inspections.noInspections")}</p>
          <p className="font-archivo text-sm mt-1 mb-4" style={{ color: "var(--muted)" }}>
            Start from the Dashboard to schedule your first inspection.
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            style={{ background: "var(--pink)", color: "#fff", border: "none" }}
          >
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const items = grouped[status];
            if (!items?.length) return null;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
            return (
              <div key={status}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span
                    className="font-archivo font-bold text-xs uppercase tracking-widest"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="font-archivo text-xs px-2 py-0.5 rounded-full"
                    style={{ background: cfg.color + "22", color: cfg.color }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map(({ inspection, property }) => (
                    <button
                      key={inspection.id}
                      onClick={() => setLocation(`/inspections/${inspection.id}`)}
                      className="w-full text-left rounded-xl p-4 transition-all active:scale-[0.98]"
                      style={{
                        background: "var(--card)",
                        border: "1.5px solid var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--pink)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Property address */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin size={12} style={{ color: "var(--pink)", flexShrink: 0 }} />
                            <span
                              className="font-archivo font-bold text-sm truncate"
                              style={{ color: "var(--black)" }}
                            >
                              {property?.address ?? "Unknown property"}
                            </span>
                          </div>
                          {property?.suburb && (
                            <p className="font-archivo text-xs mb-2" style={{ color: "var(--muted)" }}>
                              {property.suburb}{property.city ? `, ${property.city}` : ""}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className="font-archivo text-xs font-bold uppercase tracking-wide"
                              style={{
                                background: "var(--black)",
                                color: "var(--cream)",
                                border: "none",
                              }}
                            >
                              {TYPE_LABELS[inspection.type] ?? inspection.type}
                            </Badge>
                            {inspection.overallCondition && (
                              <Badge
                                className="font-archivo text-xs uppercase tracking-wide"
                                style={{
                                  background:
                                    inspection.overallCondition === "excellent" ? "#22c55e22" :
                                    inspection.overallCondition === "good" ? "#3b82f622" :
                                    inspection.overallCondition === "fair" ? "#f59e0b22" : "#ef444422",
                                  color:
                                    inspection.overallCondition === "excellent" ? "#16a34a" :
                                    inspection.overallCondition === "good" ? "#2563eb" :
                                    inspection.overallCondition === "fair" ? "#d97706" : "#dc2626",
                                  border: "none",
                                }}
                              >
                                {inspection.overallCondition}
                              </Badge>
                            )}
                            {inspection.completedAt && (
                              <span className="flex items-center gap-1 font-archivo text-xs" style={{ color: "var(--muted)" }}>
                                <Calendar size={11} />
                                {new Date(inspection.completedAt).toLocaleDateString("en-NZ", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={18} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
