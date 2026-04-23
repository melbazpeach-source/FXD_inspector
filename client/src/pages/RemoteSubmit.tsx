import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Home,
  Loader2,
  Upload,
  X,
  Zap,
} from "lucide-react";

export default function RemoteSubmit() {
  const [, params] = useRoute("/submit/:token");
  const token = params?.token ?? "";

  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<
    { file: File; preview: string; roomLabel: string; caption: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: formData, isLoading, error } = trpc.reports.getRemoteForm.useQuery({ token });
  const submitMutation = trpc.reports.submitRemote.useMutation({
    onSuccess: () => setStep("success"),
    onError: (e) => toast.error(e.message),
  });

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Convert photos to base64
    const photoData = await Promise.all(
      photos.map(
        (p) =>
          new Promise<{
            imageData: string;
            mimeType: string;
            caption: string;
            roomLabel: string;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve({
                imageData: base64,
                mimeType: p.file.type,
                caption: p.caption,
                roomLabel: p.roomLabel,
              });
            };
            reader.readAsDataURL(p.file);
          })
      )
    );

    submitMutation.mutate({
      token,
      submitterName: name,
      submitterEmail: email || undefined,
      notes: notes || undefined,
      photos: photoData,
    });
  }

  function addPhoto(file: File) {
    const preview = URL.createObjectURL(file);
    setPhotos((prev) => [
      ...prev,
      { file, preview, roomLabel: "", caption: file.name },
    ]);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center bg-card rounded-2xl border border-border p-8">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-muted-foreground text-sm">
            This inspection submission link is no longer valid. Please contact your property manager for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center bg-card rounded-2xl border border-border p-8">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Submission Received!
          </h2>
          <p className="text-muted-foreground text-sm">
            Thank you, {name}. Your photos and notes have been submitted to your property manager for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-foreground">FXD Inspector</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Property info */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property Inspection</p>
              <p className="font-medium text-foreground">{formData.propertyAddress}</p>
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
          Submit Inspection Photos
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Please submit photos and notes for each room. Your property manager will review and include them in the inspection report.
        </p>

        {/* Your details */}
        <div className="space-y-3 mb-6">
          <h2 className="font-display text-sm font-semibold text-foreground">Your Details</h2>
          <Input
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email address (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <h2 className="font-display text-sm font-semibold text-foreground mb-2">General Notes</h2>
          <Textarea
            placeholder="Any general observations or concerns about the property..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Photos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-foreground">
              Photos ({photos.length})
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              <Camera className="h-3.5 w-3.5" />
              Add photos
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
              Array.from(e.target.files ?? []).forEach(addPhoto);
              e.target.value = "";
            }}
          />

          {photos.length > 0 ? (
            <div className="space-y-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-card rounded-xl border border-border p-3">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input
                      placeholder="Room (e.g. Living Room)"
                      value={photo.roomLabel}
                      onChange={(e) => {
                        setPhotos((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, roomLabel: e.target.value } : p
                          )
                        );
                      }}
                      className="text-xs h-8"
                    />
                    <Input
                      placeholder="Caption or description"
                      value={photo.caption}
                      onChange={(e) => {
                        setPhotos((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, caption: e.target.value } : p
                          )
                        );
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tap to add photos from each room</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          className="w-full bg-primary text-primary-foreground shadow-lg"
          size="lg"
          onClick={handleSubmit}
          disabled={!name.trim() || submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {submitMutation.isPending ? "Submitting..." : "Submit Inspection"}
        </Button>
      </div>
    </div>
  );
}
