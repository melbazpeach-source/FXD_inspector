import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const INSPECTION_TYPES = [
  {
    id: "update_based_on_previous",
    label: "Update Based on Previous",
    desc: "Pull up the last inspection and add updated photos, condition, and maintenance notes.",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    id: "new_full",
    label: "New Full",
    desc: "Complete full inspection of the entire property from scratch.",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    badge: "bg-purple-100 text-purple-700",
  },
  {
    id: "new_vacate",
    label: "New Vacate",
    desc: "End-of-tenancy inspection documenting condition at vacate.",
    color: "bg-red-50 border-red-200 hover:border-red-400",
    badge: "bg-red-100 text-red-700",
  },
  {
    id: "new_inventory",
    label: "New Inventory",
    desc: "Detailed inventory of all items and fixtures within the property.",
    color: "bg-green-50 border-green-200 hover:border-green-400",
    badge: "bg-green-100 text-green-700",
  },
  {
    id: "new_chattels",
    label: "New Chattels",
    desc: "Record and condition-check all chattels included in the tenancy.",
    color: "bg-teal-50 border-teal-200 hover:border-teal-400",
    badge: "bg-teal-100 text-teal-700",
  },
  {
    id: "new_routine",
    label: "New Routine",
    desc: "Standard routine inspection — typically every 3–4 months.",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    id: "new_move_in",
    label: "New Move-In",
    desc: "Comprehensive move-in inspection for new tenants.",
    color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
    badge: "bg-indigo-100 text-indigo-700",
  },
] as const;

type InspectionTypeId = (typeof INSPECTION_TYPES)[number]["id"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed" | "overdue">("all");

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({});
  const createInspection = trpc.inspections.create.useMutation({
    onSuccess: ({ inspectionId }) => {
      setTypeDialogOpen(false);
      setSelectedAppointment(null);
      toast.success("Inspection started!");
      setLocation(`/inspections/${inspectionId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const syncMutation = trpc.appointments.syncFromPlatform.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.count} appointments`);
      refetch();
    },
  });

  const now = new Date();
  const allAppts = appointments ?? [];
  const scheduled = allAppts.filter((a) => a.appointment.status === "scheduled");
  const completed = allAppts.filter((a) => a.appointment.status === "completed");
  const overdue = scheduled.filter((a) => new Date(a.appointment.scheduledAt) < now);

  const filtered =
    filter === "all"
      ? allAppts
      : filter === "scheduled"
      ? scheduled.filter((a) => new Date(a.appointment.scheduledAt) >= now)
      : filter === "completed"
      ? completed
      : overdue;

  function handleStartInspection(appt: any) {
    setSelectedAppointment(appt);
    setTypeDialogOpen(true);
  }

  function handleSelectType(type: InspectionTypeId) {
    if (!selectedAppointment) return;
    createInspection.mutate({
      propertyId: selectedAppointment.appointment.propertyId,
      appointmentId: selectedAppointment.appointment.id,
      type,
    });
  }

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const platformColor: Record<string, string> = {
    palace: "bg-violet-100 text-violet-700",
    console: "bg-sky-100 text-sky-700",
    propertytree: "bg-emerald-100 text-emerald-700",
    rest: "bg-orange-100 text-orange-700",
    test: "bg-gray-100 text-gray-600",
    manual: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString("en-NZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate({ platform: "test" })}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => setLocation("/properties")}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Scheduled",
            value: scheduled.filter((a) => new Date(a.appointment.scheduledAt) >= now).length,
            icon: CalendarClock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Overdue",
            value: overdue.length,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Completed",
            value: completed.length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total",
            value: allAppts.length,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-display font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "scheduled", "overdue", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointment tiles */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display text-lg font-medium text-foreground mb-2">No appointments yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Sync from your property management platform or create a manual appointment.
          </p>
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate({ platform: "test" })}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Load test appointments
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ appointment, property }) => {
            const scheduledDate = new Date(appointment.scheduledAt);
            const isOverdue = scheduledDate < now && appointment.status === "scheduled";
            return (
              <div
                key={appointment.id}
                className={`bg-card rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer group ${
                  isOverdue ? "border-red-200 bg-red-50/30" : "border-border"
                }`}
                onClick={() => handleStartInspection({ appointment, property })}
              >
                {/* Platform badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      platformColor[appointment.platformSource ?? "manual"]
                    }`}
                  >
                    {(appointment.platformSource ?? "manual").charAt(0).toUpperCase() +
                      (appointment.platformSource ?? "manual").slice(1)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isOverdue ? "bg-red-100 text-red-700" : statusColor[appointment.status ?? "scheduled"]
                    }`}
                  >
                    {isOverdue ? "Overdue" : appointment.status?.replace("_", " ")}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="font-medium text-foreground text-sm leading-snug">
                    {property?.address ?? "Unknown property"}
                  </p>
                </div>

                {/* Date/time */}
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-4">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {scheduledDate.toLocaleDateString("en-NZ", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {scheduledDate.toLocaleTimeString("en-NZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground truncate max-w-[60%]">
                      {appointment.notes}
                    </p>
                  )}
                  <div className="ml-auto flex items-center gap-1 text-primary text-xs font-medium group-hover:gap-2 transition-all">
                    <Sparkles className="h-3.5 w-3.5" />
                    Start inspection
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspection type selector dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Select Inspection Type</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.property?.address && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedAppointment.property.address}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {INSPECTION_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelectType(type.id)}
                disabled={createInspection.isPending}
                className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${type.color} disabled:opacity-50`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type.badge}`}>
                    {type.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
