import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Download, Mail, Building2, CheckCircle2, Loader2 } from "lucide-react";

type Destination = "palace" | "console" | "propertytree" | "rest" | "email" | "pdf";

interface PushToPanelProps {
  inspectionId: number;
  reportId?: number;
  compact?: boolean;
}

const DESTINATIONS: Array<{
  id: Destination;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = [
  { id: "palace",       label: "Palace",        sublabel: "Push to Palace PM",      icon: Building2,    color: "#6366f1", bgColor: "rgba(99,102,241,0.1)" },
  { id: "console",      label: "Console Cloud", sublabel: "Push to Console Cloud",   icon: Building2,    color: "#0ea5e9", bgColor: "rgba(14,165,233,0.1)" },
  { id: "propertytree", label: "PropertyTree",  sublabel: "Push to PropertyTree",    icon: Building2,    color: "#10b981", bgColor: "rgba(16,185,129,0.1)" },
  { id: "rest",         label: "REST Pro",      sublabel: "Push to REST Professional",icon: Building2,   color: "#f59e0b", bgColor: "rgba(245,158,11,0.1)" },
  { id: "email",        label: "Email",         sublabel: "Send report by email",    icon: Mail,         color: "var(--pink)", bgColor: "rgba(255,45,135,0.1)" },
  { id: "pdf",          label: "PDF",           sublabel: "Download as PDF",         icon: Download,     color: "var(--ink)", bgColor: "rgba(0,0,0,0.06)" },
];

export default function PushToPanel({ inspectionId, compact = false }: PushToPanelProps) {
  const [selected, setSelected] = useState<Destination | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [pushed, setPushed] = useState<Set<Destination>>(new Set());

  const pushMutation = trpc.inspections.pushTo.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      if (selected) setPushed(prev => { const next = new Set(Array.from(prev)); next.add(selected); return next; });
      if (selected !== "email") setSelected(null);
    },
    onError: () => toast.error("Push failed — please try again"),
  });

  function handlePush() {
    if (!selected) return;
    if (selected === "email" && !emailAddress) {
      toast.error("Enter an email address");
      return;
    }
    pushMutation.mutate({
      inspectionId,
      destination: selected,
      emailAddress: selected === "email" ? emailAddress : undefined,
    });
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {DESTINATIONS.map(dest => {
          const Icon = dest.icon;
          const done = pushed.has(dest.id);
          return (
            <button
              key={dest.id}
              onClick={() => setSelected(dest.id === selected ? null : dest.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-archivo text-xs transition-all"
              style={{
                background: selected === dest.id ? dest.color : done ? "rgba(34,197,94,0.1)" : dest.bgColor,
                color: selected === dest.id ? "var(--white)" : done ? "#16a34a" : dest.color,
                border: `1px solid ${selected === dest.id ? dest.color : "transparent"}`,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {done ? <CheckCircle2 size={11} /> : <Icon size={11} />}
              {dest.label}
            </button>
          );
        })}
        {selected && (
          <div className="w-full flex items-center gap-2 mt-1">
            {selected === "email" && (
              <Input
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                className="rounded-sm h-8 text-xs flex-1"
                style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
              />
            )}
            <Button
              onClick={handlePush}
              disabled={pushMutation.isPending}
              className="rounded-sm font-archivo text-xs h-8 flex items-center gap-1.5"
              style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {pushMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              {pushMutation.isPending ? "Pushing..." : `Push to ${DESTINATIONS.find(d => d.id === selected)?.label}`}
            </Button>
            <button
              onClick={() => setSelected(null)}
              className="font-archivo text-xs"
              style={{ color: "var(--muted)", letterSpacing: "0.06em" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ background: "var(--black)", borderColor: "rgba(255,255,255,0.08)" }}>
        <Send size={16} style={{ color: "var(--yellow)" }} />
        <div>
          <div className="font-archivo text-sm font-bold" style={{ color: "var(--white)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Push To</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Send inspection data to your PM platform or contacts</div>
        </div>
      </div>

      <div className="p-5" style={{ background: "var(--white)" }}>
        <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
          {DESTINATIONS.map(dest => {
            const Icon = dest.icon;
            const done = pushed.has(dest.id);
            const active = selected === dest.id;
            return (
              <button
                key={dest.id}
                onClick={() => setSelected(active ? null : dest.id)}
                className="flex items-center gap-2.5 p-3 rounded-sm border text-left transition-all"
                style={{
                  background: active ? dest.color : done ? "rgba(34,197,94,0.06)" : "var(--cream)",
                  borderColor: active ? dest.color : done ? "#16a34a" : "var(--border)",
                  color: active ? "var(--white)" : done ? "#16a34a" : dest.color,
                }}
              >
                <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: active ? "rgba(255,255,255,0.15)" : dest.bgColor }}>
                  {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <div className="min-w-0">
                  <div className="font-archivo text-xs font-bold truncate" style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}>{dest.label}</div>
                  <div className="text-xs truncate" style={{ color: active ? "rgba(255,255,255,0.7)" : done ? "#16a34a" : "var(--muted-light)", fontSize: 10 }}>{done ? "Sent ✓" : dest.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="rounded-sm p-4 border" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
            <div className="font-archivo text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Push to {DESTINATIONS.find(d => d.id === selected)?.label}
            </div>
            {selected === "email" && (
              <div className="mb-3">
                <Input
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  placeholder="Recipient email address"
                  type="email"
                  className="rounded-sm"
                  style={{ background: "var(--white)", border: "1px solid var(--border)" }}
                />
              </div>
            )}
            {selected === "pdf" && (
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                A formatted PDF report will be generated and downloaded to your device.
              </p>
            )}
            {!["email", "pdf"].includes(selected) && (
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                Inspection data will be pushed to your {DESTINATIONS.find(d => d.id === selected)?.label} account. Ensure your integration is configured in Settings → Integrations.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handlePush}
                disabled={pushMutation.isPending}
                className="rounded-sm font-archivo text-xs flex items-center gap-2"
                style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {pushMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {pushMutation.isPending ? "Pushing..." : selected === "pdf" ? "Download PDF" : selected === "email" ? "Send Email" : "Push Now"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
                className="rounded-sm font-archivo text-xs"
                style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
