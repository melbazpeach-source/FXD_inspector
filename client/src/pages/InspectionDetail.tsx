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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  MapPin,
  Plus,
  Sparkles,
  Wrench,
  AlertTriangle,
  Camera,
  Mic,
} from "lucide-react";
import PushToPanel from "@/components/PushToPanel";

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  update_based_on_previous: "Update Based on Previous",
  new_full: "New Full",
  new_vacate: "New Vacate",
  new_inventory: "New Inventory",
  new_chattels: "New Chattels",
  new_routine: "New Routine",
  new_move_in: "New Move-In",
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
  good: "text-blue-600 bg-blue-50 border-blue-200",
  fair: "text-amber-600 bg-amber-50 border-amber-200",
  poor: "text-red-600 bg-red-50 border-red-200",
  na: "text-gray-400 bg-gray-50 border-gray-200",
};

export default function InspectionDetail({ id }: { id: number }) {
  const [, setLocation] = useLocation();
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [completing, setCompleting] = useState(false);

  const { data, isLoading, refetch } = trpc.inspections.get.useQuery({ id });
  const { data: maintenance } = trpc.rooms.listMaintenance.useQuery({ inspectionId: id });
  const addRoom = trpc.rooms.create.useMutation({
    onSuccess: () => {
      refetch();
      setAddRoomOpen(false);
      setNewRoomName("");
      toast.success("Room added");
    },
  });
  const completeInspection = trpc.inspections.complete.useMutation({
    onSuccess: () => {
      toast.success("Inspection completed!");
      refetch();
    },
  });
  const generateReport = trpc.reports.generate.useMutation({
    onSuccess: ({ url }) => {
      toast.success("Report generated!");
      window.open(url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-muted-foreground">Inspection not found.</div>;

  const { inspection, property, rooms } = data;
  const completedRooms = rooms.filter((r) => r.isComplete).length;
  const progress = rooms.length > 0 ? Math.round((completedRooms / rooms.length) * 100) : 0;
  const maintenanceCount = maintenance?.length ?? 0;
  const urgentCount = maintenance?.filter((m) => m.priority === "urgent").length ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => setLocation("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {INSPECTION_TYPE_LABELS[inspection.type] ?? inspection.type}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  inspection.status === "completed"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : inspection.status === "in_progress"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {inspection.status?.replace("_", " ")}
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-1">
              {property?.address ?? "Inspection"}
            </h1>
            {property?.suburb && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {property.suburb}, {property.city}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {inspection.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompleting(true);
                  completeInspection.mutate({ id });
                  setCompleting(false);
                }}
                disabled={completeInspection.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => generateReport.mutate({ inspectionId: id })}
              disabled={generateReport.isPending}
              className="bg-primary text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generateReport.isPending ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedRooms} of {rooms.length} rooms complete
            </span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-display font-semibold text-foreground">{rooms.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Rooms</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-display font-semibold ${maintenanceCount > 0 ? "text-amber-600" : "text-foreground"}`}>
            {maintenanceCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Maintenance</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-display font-semibold ${urgentCount > 0 ? "text-red-600" : "text-foreground"}`}>
            {urgentCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Urgent</p>
        </div>
      </div>

      {/* Rooms list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Rooms</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddRoomOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setLocation(`/inspections/${id}/rooms/${room.id}`)}
              className="w-full bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                {/* Status icon */}
                <div className="shrink-0">
                  {room.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : room.hasIssues ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Room name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{room.name}</p>
                  {room.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{room.notes}</p>
                  )}
                </div>

                {/* Condition badge */}
                {room.conditionRating && room.conditionRating !== "na" && (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      CONDITION_COLORS[room.conditionRating]
                    }`}
                  >
                    {room.conditionRating.charAt(0).toUpperCase() + room.conditionRating.slice(1)}
                  </span>
                )}

                {/* Indicators */}
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <Camera className="h-3.5 w-3.5" />
                  <Sparkles className="h-3.5 w-3.5" />
                  <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance summary */}
      {maintenanceCount > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-4 w-4 text-amber-600" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Maintenance & Damage ({maintenanceCount})
            </h2>
          </div>
          <div className="space-y-2">
            {maintenance?.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.priority === "urgent"
                    ? "bg-red-50 border-red-200"
                    : item.priority === "high"
                    ? "bg-orange-50 border-orange-200"
                    : "bg-muted/50 border-border"
                }`}
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    item.priority === "urgent"
                      ? "bg-red-100 text-red-700"
                      : item.priority === "high"
                      ? "bg-orange-100 text-orange-700"
                      : item.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.priority}
                </span>
                <p className="text-sm text-foreground">{item.description}</p>
                {item.isDamage && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">
                    Damage
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Push To */}
      <div className="mb-6">
        <PushToPanel inspectionId={id} />
      </div>

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Room name (e.g. Master Bedroom)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newRoomName.trim()) {
                  addRoom.mutate({ inspectionId: id, name: newRoomName.trim() });
                }
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {["Living Room", "Kitchen", "Bathroom", "Garage", "Laundry", "Office", "Deck"].map(
                (name) => (
                  <button
                    key={name}
                    onClick={() => setNewRoomName(name)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors"
                  >
                    {name}
                  </button>
                )
              )}
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={() => {
                if (newRoomName.trim()) {
                  addRoom.mutate({ inspectionId: id, name: newRoomName.trim() });
                }
              }}
              disabled={!newRoomName.trim() || addRoom.isPending}
            >
              Add Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
