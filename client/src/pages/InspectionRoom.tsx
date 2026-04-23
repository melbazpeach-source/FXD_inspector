import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Mic,
  MicOff,
  Sparkles,
  Trash2,
  Wrench,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  Eye,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Streamdown } from "streamdown";

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "good", label: "Good", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "fair", label: "Fair", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "poor", label: "Poor", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "na", label: "N/A", color: "bg-gray-100 text-gray-500 border-gray-300" },
];

export default function InspectionRoom({
  inspectionId,
  roomId,
}: {
  inspectionId: number;
  roomId: number;
}) {
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [maintenanceDesc, setMaintenanceDesc] = useState("");
  const [maintenancePriority, setMaintenancePriority] = useState<"urgent" | "high" | "medium" | "low">("medium");
  const [isDamage, setIsDamage] = useState(false);
  const [view360Open, setView360Open] = useState(false);
  const [selected360Url, setSelected360Url] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file360InputRef = useRef<HTMLInputElement>(null);

  const { data: room, isLoading, refetch } = trpc.rooms.get.useQuery({ id: roomId });
  const { data: photos, refetch: refetchPhotos } = trpc.media.listPhotos.useQuery({
    inspectionId,
    roomId,
  });
  const { data: aiDescs, refetch: refetchAi } = trpc.media.getAiDescriptions.useQuery({
    inspectionId,
    roomId,
  });

  const updateRoom = trpc.rooms.update.useMutation({
    onSuccess: () => refetch(),
  });
  const uploadPhoto = trpc.media.uploadPhoto.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo uploaded");
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePhoto = trpc.media.deletePhoto.useMutation({
    onSuccess: () => refetchPhotos(),
  });
  const transcribeVoice = trpc.media.transcribeVoice.useMutation({
    onSuccess: (data) => {
      setNotes((prev) => (prev ? prev + " " + data.text : data.text));
      toast.success("Voice transcribed!");
    },
    onError: (e) => toast.error("Transcription failed: " + e.message),
  });
  const generateAi = trpc.media.generateAiDescription.useMutation({
    onSuccess: (data) => {
      setAiResult(data);
      refetchAi();
      toast.success("AI description generated!");
    },
    onError: (e) => toast.error(e.message),
  });
  const addMaintenance = trpc.rooms.addMaintenance.useMutation({
    onSuccess: () => {
      setAddMaintenanceOpen(false);
      setMaintenanceDesc("");
      toast.success("Maintenance item added");
    },
  });

  // Save notes on blur
  function saveNotes() {
    if (notes !== room?.notes) {
      updateRoom.mutate({ id: roomId, notes });
    }
  }

  // Photo upload handler
  async function handlePhotoUpload(file: File, photoType: "standard" | "360" = "standard") {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPhoto.mutate({
        inspectionId,
        roomId,
        photoType,
        imageData: base64,
        mimeType: file.type,
        caption: file.name ?? undefined,
      });
    };
    reader.readAsDataURL(file);
  }

  // Voice recording
  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          transcribeVoice.mutate({
            audioData: base64,
            mimeType: "audio/webm",
            inspectionId,
            context: `Room: ${room?.name}`,
          });
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.info("Recording... tap again to stop");
    } catch {
      toast.error("Microphone access denied");
    }
  }

  // Mark room complete
  function markComplete() {
    updateRoom.mutate({
      id: roomId,
      isComplete: true,
      notes: notes || room?.notes || undefined,
    });
    toast.success("Room marked complete");
    setLocation(`/inspections/${inspectionId}`);
  }

  // Initialise notes from room data
  if (room && notes === "" && room.notes) {
    setNotes(room.notes);
  }

  const existingAi = aiDescs?.[0] ?? aiResult;
  const standardPhotos = photos?.filter((p) => p.photoType !== "360") ?? [];
  const photos360 = photos?.filter((p) => p.photoType === "360") ?? [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
    );
  }

  if (!room) return <div className="p-6 text-muted-foreground">Room not found.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24">
      {/* Back */}
      <button
        onClick={() => setLocation(`/inspections/${inspectionId}`)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inspection
      </button>

      {/* Room header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{room.name}</h1>
          {room.isComplete && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm mt-1">
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </div>
          )}
        </div>
        <Button
          onClick={markComplete}
          disabled={updateRoom.isPending}
          className="bg-primary text-primary-foreground"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark Complete
        </Button>
      </div>

      {/* Condition Rating */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3">Condition Rating</h2>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateRoom.mutate({ id: roomId, conditionRating: opt.value as any })}
              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                room.conditionRating === opt.value
                  ? opt.color + " border-current shadow-sm scale-105"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes + Voice */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-foreground">Condition Notes</h2>
          <button
            onClick={toggleRecording}
            disabled={transcribeVoice.isPending}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isRecording
                ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                : transcribeVoice.isPending
                ? "bg-muted text-muted-foreground border-border"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
            }`}
          >
            {transcribeVoice.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-3.5 w-3.5" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            {isRecording ? "Stop recording" : transcribeVoice.isPending ? "Transcribing..." : "Voice note"}
          </button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Describe the condition of this room... or use voice note above."
          className="min-h-[100px] resize-none text-sm"
        />
      </div>

      {/* Standard Photos */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Photos ({standardPhotos.length})
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border hover:border-primary/40 hover:text-primary transition-all"
          >
            {uploadPhoto.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            Add photo
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files ?? []).forEach((f) => handlePhotoUpload(f, "standard"));
            e.target.value = "";
          }}
        />
        {standardPhotos.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {standardPhotos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={photo.url}
                  alt={photo.caption ?? "Photo"}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto.mutate({ id: photo.id })}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
          >
            <Camera className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tap to add photos</p>
          </div>
        )}
      </div>

      {/* 360° Photos */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">360° Photos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Panoramic / equirectangular images</p>
          </div>
          <button
            onClick={() => file360InputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Add 360°
          </button>
        </div>
        <input
          ref={file360InputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files ?? []).forEach((f) => handlePhotoUpload(f, "360"));
            e.target.value = "";
          }}
        />
        {photos360.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos360.map((photo) => (
              <div key={photo.id} className="relative group aspect-video rounded-lg overflow-hidden border border-primary/20 bg-muted">
                <img src={photo.url} alt="360° photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button
                    onClick={() => { setSelected360Url(photo.url); setView360Open(true); }}
                    className="h-8 w-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePhoto.mutate({ id: photo.id })}
                    className="h-8 w-8 rounded-full bg-red-500/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1">
                  <span className="text-xs bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded font-medium">360°</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => file360InputRef.current?.click()}
            className="border-2 border-dashed border-primary/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
          >
            <RotateCcw className="h-7 w-7 text-primary/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Add 360° panoramic photos</p>
          </div>
        )}
      </div>

      {/* AI Description */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">AI Description</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Decor · Condition · Points to Note · Recommendations</p>
          </div>
          <Button
            size="sm"
            onClick={() => generateAi.mutate({ inspectionId, roomId, additionalContext: notes })}
            disabled={generateAi.isPending}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {generateAi.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-2" />
            )}
            {generateAi.isPending ? "Generating..." : existingAi ? "Regenerate" : "Generate"}
          </Button>
        </div>

        {existingAi ? (
          <div className="space-y-4">
            {[
              { key: "decor", label: "Decor", color: "text-violet-700 bg-violet-50 border-violet-200" },
              { key: "condition", label: "Condition", color: "text-blue-700 bg-blue-50 border-blue-200" },
              { key: "pointsToNote", label: "Points to Note", color: "text-amber-700 bg-amber-50 border-amber-200" },
              { key: "recommendations", label: "Recommendations", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            ].map(({ key, label, color }) =>
              existingAi[key] ? (
                <div key={key} className={`rounded-lg border p-4 ${color}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2">{label}</h3>
                  <p className="text-sm leading-relaxed">{existingAi[key]}</p>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-accent/20 rounded-xl p-6 text-center">
            <Sparkles className="h-7 w-7 text-accent/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Generate AI descriptions for decor, condition, points to note, and recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Maintenance */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-foreground">Maintenance & Damage</h2>
          <button
            onClick={() => setAddMaintenanceOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border hover:border-primary/40 hover:text-primary transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>
        <div
          onClick={() => setAddMaintenanceOpen(true)}
          className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 transition-colors"
        >
          <Wrench className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Log maintenance items or damage</p>
        </div>
      </div>

      {/* 360 Viewer Dialog */}
      <Dialog open={view360Open} onOpenChange={setView360Open}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-display">360° Photo Viewer</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selected360Url && <PannellumViewer imageUrl={selected360Url} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={addMaintenanceOpen} onOpenChange={setAddMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Maintenance Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="Describe the maintenance issue or damage..."
              value={maintenanceDesc}
              onChange={(e) => setMaintenanceDesc(e.target.value)}
              className="min-h-[80px]"
            />
            <Select
              value={maintenancePriority}
              onValueChange={(v) => setMaintenancePriority(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDamage}
                onChange={(e) => setIsDamage(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">This is damage (not just maintenance)</span>
            </label>
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={() => {
                if (maintenanceDesc.trim()) {
                  addMaintenance.mutate({
                    inspectionId,
                    roomId,
                    description: maintenanceDesc.trim(),
                    priority: maintenancePriority,
                    isDamage,
                  });
                }
              }}
              disabled={!maintenanceDesc.trim() || addMaintenance.isPending}
            >
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pannellum 360° viewer component
function PannellumViewer({ imageUrl }: { imageUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const initViewer = useCallback(() => {
    if (!containerRef.current || viewerRef.current) return;
    // Dynamically load Pannellum
    if (typeof window !== "undefined" && (window as any).pannellum) {
      viewerRef.current = (window as any).pannellum.viewer(containerRef.current, {
        type: "equirectangular",
        panorama: imageUrl,
        autoLoad: true,
        showControls: true,
        compass: false,
        hotSpotDebug: false,
        mouseZoom: true,
      });
    }
  }, [imageUrl]);

  // Load Pannellum CSS + JS dynamically
  const loadPannellum = useCallback(() => {
    if ((window as any).pannellum) {
      initViewer();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.onload = initViewer;
    document.head.appendChild(script);
  }, [initViewer]);

  // Use a ref callback to trigger loading
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      (containerRef as any).current = el;
      if (el) loadPannellum();
    },
    [loadPannellum]
  );

  return (
    <div
      ref={setRef}
      style={{ width: "100%", height: "400px", borderRadius: "0.75rem", overflow: "hidden" }}
    />
  );
}
