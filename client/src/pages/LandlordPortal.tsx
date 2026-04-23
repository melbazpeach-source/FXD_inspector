import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2, CheckCircle2, AlertTriangle, Clock, XCircle,
  ChevronRight, Bell, FileText, Wrench, TrendingUp, Shield,
  Sparkles, ThumbsUp, ThumbsDown, MessageSquare, Send,
  Home, Mail, Phone, User, Eye, Edit3, CheckCheck,
  PlusCircle, ArrowRight, Lock,
} from "lucide-react";

type PmStatus = "draft" | "pm_review" | "pm_approved" | "sent";
type ApprovalStatus = "pending" | "approved" | "deferred" | "discuss";
type NotificationType =
  | "inspection_complete"
  | "maintenance_approval"
  | "rent_appraisal"
  | "hh_compliance"
  | "maintenance_plan"
  | "renovate_recommendations";

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: typeof Bell; color: string; description: string }> = {
  inspection_complete: { label: "Inspection Summary", icon: CheckCircle2, color: "#22c55e", description: "Full inspection findings, condition ratings, and photos" },
  maintenance_approval: { label: "Maintenance Approval", icon: Wrench, color: "#f59e0b", description: "Maintenance items requiring owner sign-off and budget approval" },
  rent_appraisal: { label: "Rent Appraisal", icon: TrendingUp, color: "#3b82f6", description: "Market analysis and recommended rent adjustment" },
  hh_compliance: { label: "Healthy Homes Certificate", icon: Shield, color: "#8b5cf6", description: "Compliance confirmation across all 5 HH standards" },
  maintenance_plan: { label: "12-Month Maintenance Plan", icon: Wrench, color: "#06b6d4", description: "Forward-looking maintenance schedule with cost estimates" },
  renovate_recommendations: { label: "Renovate & Redecorate", icon: Sparkles, color: "#ec4899", description: "AI-generated improvement recommendations with ROI estimates" },
};

const PM_STATUS_CONFIG: Record<PmStatus, { label: string; color: string; bg: string; icon: typeof Bell }> = {
  draft: { label: "Draft", color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: Edit3 },
  pm_review: { label: "In PM Review", color: "#b45309", bg: "rgba(234,179,8,0.12)", icon: Eye },
  pm_approved: { label: "PM Approved", color: "#166534", bg: "rgba(34,197,94,0.12)", icon: CheckCircle2 },
  sent: { label: "Sent to Owner", color: "#1e40af", bg: "rgba(59,130,246,0.1)", icon: Send },
};

const APPROVAL_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Awaiting Owner", color: "#92400e", bg: "rgba(234,179,8,0.12)" },
  approved: { label: "Owner Approved", color: "#166534", bg: "rgba(34,197,94,0.12)" },
  deferred: { label: "Owner Deferred", color: "#374151", bg: "rgba(107,114,128,0.1)" },
  discuss: { label: "Owner Wants Discussion", color: "#1e40af", bg: "rgba(59,130,246,0.1)" },
};

function TrafficLight({ status }: { status: "green" | "amber" | "red" | "grey" }) {
  const colors = { green: "#22c55e", amber: "#f59e0b", red: "#ef4444", grey: "#9ca3af" };
  const labels = { green: "All Good", amber: "Attention", red: "Action Required", grey: "No Data" };
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: colors[status], boxShadow: `0 0 6px ${colors[status]}80` }} />
      <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{labels[status]}</span>
    </div>
  );
}

type Notification = {
  id: number;
  title: string;
  type: string;
  pmStatus: PmStatus;
  approvalStatus?: string | null;
  estimatedCost?: string | null;
  summary?: string | null;
  pmNote?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
};

export default function LandlordPortal() {
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "sent" | "properties">("queue");
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [pmNote, setPmNote] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [creatingType, setCreatingType] = useState<NotificationType | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftCost, setDraftCost] = useState("");

  const utils = trpc.useUtils();

  const { data: owners = [] } = trpc.owners.list.useQuery();
  const { data: allInspections = [] } = trpc.inspections.list.useQuery();
  const { data: ownerDetail, refetch: refetchDetail } = trpc.owners.get.useQuery(
    { id: selectedOwner! },
    { enabled: !!selectedOwner }
  );

  const createNotification = trpc.owners.createNotification.useMutation({
    onSuccess: () => { refetchDetail(); setCreatingType(null); setDraftTitle(""); setDraftSummary(""); setDraftCost(""); toast.success("Draft created — review it in the PM Queue"); },
    onError: (e) => toast.error(e.message),
  });

  const pmApprove = trpc.owners.pmApprove.useMutation({
    onSuccess: () => { refetchDetail(); setReviewingId(null); setPmNote(""); toast.success("Report approved — ready to send to owner"); },
    onError: (e) => toast.error(e.message),
  });

  const sendToOwner = trpc.owners.sendToOwner.useMutation({
    onSuccess: () => { refetchDetail(); toast.success("Report sent to owner"); },
    onError: (e) => toast.error(e.message),
  });

  const updateApproval = trpc.owners.updateApproval.useMutation({
    onSuccess: () => { refetchDetail(); toast.success("Owner decision recorded"); },
    onError: (e) => toast.error(e.message),
  });

  const activeOwner = owners.find(o => o.id === selectedOwner);
  const allNotifications: Notification[] = ownerDetail?.notifications ?? [];

  const queueItems = allNotifications.filter(n => n.pmStatus !== "sent");
  const sentItems = allNotifications.filter(n => n.pmStatus === "sent");
  const pendingApprovals = sentItems.filter(n => n.type === "maintenance_approval" && n.approvalStatus === "pending");

  function getPropertyStatus(propertyId: number): "green" | "amber" | "red" | "grey" {
    const inspections = (allInspections as { propertyId?: number; status?: string }[]).filter(i => i.propertyId === propertyId);
    if (inspections.length === 0) return "grey";
    const latest = inspections[inspections.length - 1];
    return latest.status === "completed" ? "green" : latest.status === "in_progress" ? "amber" : "grey";
  }

  function handleCreateDraft() {
    if (!creatingType || !selectedOwner || !activeOwner) return;
    const primaryProp = activeOwner.properties[0];
    if (!primaryProp) { toast.error("No properties linked to this owner"); return; }
    const defaultTitle = `${TYPE_CONFIG[creatingType].label} — ${primaryProp.address}`;
    createNotification.mutate({
      ownerId: selectedOwner,
      propertyId: primaryProp.propertyId,
      type: creatingType,
      title: draftTitle || defaultTitle,
      summary: draftSummary || TYPE_CONFIG[creatingType].description,
      estimatedCost: draftCost || undefined,
    });
  }

  return (
    <DashboardLayout title="Landlord Portal">
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 0px)" }}>
        {/* Left — owner list */}
        <div className="flex flex-col border-r flex-shrink-0"
          style={{ width: 280, borderColor: "rgba(0,0,0,0.08)", background: "var(--cream)" }}>
          <div className="px-5 pt-6 pb-4 flex-shrink-0">
            <h1 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>
              LANDLORD PORTAL
            </h1>
            <p className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)", letterSpacing: "0.04em" }}>
              PM-controlled · {owners.length} owner{owners.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {owners.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Home size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
                <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>
                  No owners yet. Add them in the Owners section.
                </p>
              </div>
            ) : owners.map(owner => {
              const isActive = selectedOwner === owner.id;
              return (
                <button key={owner.id} onClick={() => { setSelectedOwner(isActive ? null : owner.id); setActiveTab("queue"); }}
                  className="w-full text-left rounded-sm mb-1 px-3 py-3 transition-all duration-100"
                  style={{ background: isActive ? "var(--black)" : "transparent", border: isActive ? "none" : "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? "var(--pink)" : "rgba(0,0,0,0.06)" }}>
                      <User size={14} style={{ color: isActive ? "white" : "var(--black)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-archivo font-semibold text-sm truncate"
                        style={{ color: isActive ? "white" : "var(--black)" }}>{owner.name}</div>
                      <div className="font-archivo text-xs mt-0.5"
                        style={{ color: isActive ? "rgba(255,255,255,0.5)" : "var(--muted)" }}>
                        {owner.properties.length} propert{owner.properties.length !== 1 ? "ies" : "y"}
                      </div>
                    </div>
                    <ChevronRight size={12} style={{ color: isActive ? "rgba(255,255,255,0.4)" : "var(--muted)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — main content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedOwner ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Lock size={48} className="mx-auto mb-4" style={{ color: "rgba(0,0,0,0.1)" }} />
                <p className="font-archivo text-sm mb-1" style={{ color: "var(--black)" }}>Select a landlord to manage their portal</p>
                <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>All reports require PM approval before reaching the owner</p>
              </div>
            </div>
          ) : activeOwner && (
            <div className="p-6 max-w-4xl">
              {/* Owner header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>
                    {activeOwner.name.toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {activeOwner.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} style={{ color: "var(--muted)" }} />
                        <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{activeOwner.email}</span>
                      </div>
                    )}
                    {activeOwner.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} style={{ color: "var(--muted)" }} />
                        <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{activeOwner.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="font-archivo text-xs px-1.5 py-0.5 rounded-sm"
                        style={{ background: "rgba(0,0,0,0.06)", color: "var(--black)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Preferred: {activeOwner.preferredContact || "email"}
                      </span>
                    </div>
                  </div>
                </div>
                {pendingApprovals.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-sm"
                    style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)" }}>
                    <AlertTriangle size={14} style={{ color: "#b45309" }} />
                    <span className="font-archivo text-sm font-semibold" style={{ color: "#92400e" }}>
                      {pendingApprovals.length} maintenance approval{pendingApprovals.length !== 1 ? "s" : ""} pending
                    </span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-0 mb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                {([
                  { key: "queue", label: `PM Queue (${queueItems.length})` },
                  { key: "sent", label: `Sent to Owner (${sentItems.length})` },
                  { key: "properties", label: `Properties (${activeOwner.properties.length})` },
                ] as { key: "queue" | "sent" | "properties"; label: string }[]).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="font-archivo text-xs px-4 py-2.5 transition-colors"
                    style={{
                      borderBottom: activeTab === tab.key ? "2px solid var(--pink)" : "2px solid transparent",
                      color: activeTab === tab.key ? "var(--pink)" : "var(--muted)",
                      letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: -1,
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── PM Queue tab ── */}
              {activeTab === "queue" && (
                <div>
                  {/* Workflow explainer */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-sm"
                    style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-1.5 font-archivo text-xs" style={{ color: "var(--muted)" }}>
                      <Edit3 size={11} /> Draft
                      <ArrowRight size={10} />
                      <Eye size={11} /> PM Review
                      <ArrowRight size={10} />
                      <CheckCircle2 size={11} /> PM Approved
                      <ArrowRight size={10} />
                      <Send size={11} /> Sent to Owner
                    </div>
                    <span className="font-archivo text-xs ml-auto" style={{ color: "var(--pink)", fontWeight: 600 }}>
                      Nothing reaches the owner without your approval
                    </span>
                  </div>

                  {/* Create new draft */}
                  {creatingType ? (
                    <div className="rounded-sm p-4 mb-4"
                      style={{ background: "white", border: "2px solid var(--pink)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        {(() => { const Icon = TYPE_CONFIG[creatingType].icon; return <Icon size={14} style={{ color: TYPE_CONFIG[creatingType].color }} />; })()}
                        <span className="font-archivo font-semibold text-sm" style={{ color: "var(--black)" }}>
                          New Draft: {TYPE_CONFIG[creatingType].label}
                        </span>
                        <button onClick={() => setCreatingType(null)} className="ml-auto font-archivo text-xs" style={{ color: "var(--muted)" }}>Cancel</button>
                      </div>
                      <input
                        value={draftTitle}
                        onChange={e => setDraftTitle(e.target.value)}
                        placeholder={`${TYPE_CONFIG[creatingType].label} — ${activeOwner.properties[0]?.address || "property"}`}
                        className="w-full px-3 py-2 rounded-sm font-archivo text-sm mb-2"
                        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--black)" }}
                      />
                      <textarea
                        value={draftSummary}
                        onChange={e => setDraftSummary(e.target.value)}
                        placeholder="Summary for the owner…"
                        rows={3}
                        className="w-full px-3 py-2 rounded-sm font-archivo text-sm mb-2 resize-none"
                        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--black)" }}
                      />
                      {creatingType === "maintenance_approval" && (
                        <input
                          value={draftCost}
                          onChange={e => setDraftCost(e.target.value)}
                          placeholder="Estimated cost (e.g. $180–$280)"
                          className="w-full px-3 py-2 rounded-sm font-archivo text-sm mb-2"
                          style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--black)" }}
                        />
                      )}
                      <button
                        onClick={handleCreateDraft}
                        disabled={createNotification.isPending}
                        className="fxd-btn fxd-btn-pink text-xs"
                      >
                        <PlusCircle size={12} />
                        {createNotification.isPending ? "Creating…" : "Create Draft"}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="font-archivo text-xs mb-2" style={{ color: "var(--muted)" }}>Create a new draft report:</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(TYPE_CONFIG) as [NotificationType, typeof TYPE_CONFIG[NotificationType]][]).map(([type, config]) => {
                          const Icon = config.icon;
                          return (
                            <button key={type} onClick={() => setCreatingType(type)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-archivo text-xs transition-all"
                              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--black)" }}>
                              <Icon size={11} style={{ color: config.color }} />
                              {config.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Queue items */}
                  {queueItems.length === 0 ? (
                    <div className="text-center py-10 rounded-sm"
                      style={{ background: "white", border: "1px dashed rgba(0,0,0,0.1)" }}>
                      <CheckCheck size={28} className="mx-auto mb-3" style={{ color: "rgba(0,0,0,0.12)" }} />
                      <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>Queue is clear — all reports have been sent</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {queueItems.map((n: Notification) => {
                        const config = TYPE_CONFIG[n.type as NotificationType];
                        const Icon = config?.icon ?? Bell;
                        const pmConfig = PM_STATUS_CONFIG[n.pmStatus];
                        const PmIcon = pmConfig.icon;
                        const isReviewing = reviewingId === n.id;

                        return (
                          <div key={n.id} className="rounded-sm overflow-hidden"
                            style={{ background: "white", border: `1px solid ${n.pmStatus === "pm_approved" ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.06)"}` }}>
                            <div className="px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <Icon size={14} style={{ color: config?.color ?? "var(--muted)", flexShrink: 0, marginTop: 2 }} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-archivo font-semibold text-sm" style={{ color: "var(--black)" }}>{n.title}</div>
                                    {n.estimatedCost && (
                                      <div className="font-archivo text-xs mt-0.5" style={{ color: "#b45309" }}>Est. cost: {n.estimatedCost}</div>
                                    )}
                                  </div>
                                </div>
                                <span className="flex items-center gap-1 font-archivo text-xs px-2 py-1 rounded-sm flex-shrink-0"
                                  style={{ background: pmConfig.bg, color: pmConfig.color, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                  <PmIcon size={9} />
                                  {pmConfig.label}
                                </span>
                              </div>

                              {n.summary && (
                                <p className="font-archivo text-xs mb-3 ml-5" style={{ color: "var(--muted)", lineHeight: 1.5 }}>{n.summary}</p>
                              )}

                              {/* PM review panel */}
                              {isReviewing && (
                                <div className="ml-5 mb-3 p-3 rounded-sm" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                                  <p className="font-archivo text-xs font-semibold mb-2" style={{ color: "var(--black)" }}>Add a PM note (optional):</p>
                                  <textarea
                                    value={pmNote}
                                    onChange={e => setPmNote(e.target.value)}
                                    placeholder="Internal note for your records…"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm resize-none mb-2"
                                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", color: "var(--black)" }}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => pmApprove.mutate({ notificationId: n.id, pmNote })}
                                      disabled={pmApprove.isPending}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-archivo text-xs font-semibold"
                                      style={{ background: "var(--pink)", color: "white" }}>
                                      <CheckCircle2 size={11} />
                                      {pmApprove.isPending ? "Approving…" : "Approve & Mark Ready"}
                                    </button>
                                    <button onClick={() => { setReviewingId(null); setPmNote(""); }}
                                      className="px-3 py-1.5 rounded-sm font-archivo text-xs"
                                      style={{ background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 ml-5">
                                {n.pmStatus === "draft" && !isReviewing && (
                                  <button onClick={() => { setReviewingId(n.id); setPmNote(""); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-archivo text-xs font-semibold"
                                    style={{ background: "rgba(0,0,0,0.06)", color: "var(--black)" }}>
                                    <Eye size={11} />
                                    Review & Approve
                                  </button>
                                )}
                                {n.pmStatus === "pm_approved" && (
                                  <button
                                    onClick={() => sendToOwner.mutate({ notificationId: n.id })}
                                    disabled={sendToOwner.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-archivo text-xs font-semibold"
                                    style={{ background: "var(--pink)", color: "white" }}>
                                    <Send size={11} />
                                    {sendToOwner.isPending ? "Sending…" : `Send to ${activeOwner.name.split(" ")[0]}`}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Sent to Owner tab ── */}
              {activeTab === "sent" && (
                <div>
                  {/* Pending maintenance approvals */}
                  {pendingApprovals.length > 0 && (
                    <div className="rounded-sm p-4 mb-4"
                      style={{ background: "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.2)" }}>
                      <h3 className="font-archivo font-semibold text-xs uppercase tracking-widest mb-3" style={{ color: "#92400e" }}>
                        Awaiting Owner Decision ({pendingApprovals.length})
                      </h3>
                      {pendingApprovals.map((n: Notification) => (
                        <div key={n.id} className="rounded-sm p-3 mb-2"
                          style={{ background: "white", border: "1px solid rgba(234,179,8,0.2)" }}>
                          <div className="font-archivo font-semibold text-sm mb-1" style={{ color: "var(--black)" }}>{n.title}</div>
                          {n.estimatedCost && <div className="font-archivo text-xs mb-2" style={{ color: "#b45309" }}>Est. cost: {n.estimatedCost}</div>}
                          <div className="flex gap-2">
                            {(["approved", "deferred", "discuss"] as const).map(status => (
                              <button key={status}
                                onClick={() => updateApproval.mutate({ notificationId: n.id, approvalStatus: status })}
                                disabled={updateApproval.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm font-archivo text-xs font-semibold"
                                style={{
                                  background: status === "approved" ? "rgba(34,197,94,0.12)" : status === "deferred" ? "rgba(107,114,128,0.1)" : "rgba(59,130,246,0.1)",
                                  color: status === "approved" ? "#166534" : status === "deferred" ? "#374151" : "#1e40af",
                                }}>
                                {status === "approved" ? <ThumbsUp size={10} /> : status === "deferred" ? <Clock size={10} /> : <MessageSquare size={10} />}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sentItems.length === 0 ? (
                    <div className="text-center py-10 rounded-sm"
                      style={{ background: "white", border: "1px dashed rgba(0,0,0,0.1)" }}>
                      <Send size={28} className="mx-auto mb-3" style={{ color: "rgba(0,0,0,0.12)" }} />
                      <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>No reports sent yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentItems.map((n: Notification) => {
                        const config = TYPE_CONFIG[n.type as NotificationType];
                        const Icon = config?.icon ?? Bell;
                        const approval = APPROVAL_CONFIG[(n.approvalStatus as ApprovalStatus) ?? "pending"];
                        return (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 rounded-sm"
                            style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <Icon size={13} style={{ color: config?.color ?? "var(--muted)", flexShrink: 0, marginTop: 2 }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-archivo font-semibold text-sm truncate" style={{ color: "var(--black)" }}>{n.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                                  Sent {n.sentAt ? new Date(n.sentAt).toLocaleDateString("en-NZ") : "—"}
                                </span>
                                {n.type === "maintenance_approval" && (
                                  <span className="font-archivo text-xs px-1.5 py-0.5 rounded-sm"
                                    style={{ background: approval.bg, color: approval.color, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                    {approval.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Properties tab ── */}
              {activeTab === "properties" && (
                <div>
                  {activeOwner.properties.length === 0 ? (
                    <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>No properties linked.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {activeOwner.properties.map((p: {
                        propertyId: number; address: string; suburb?: string | null; city?: string | null; isPrimary?: boolean | null;
                      }) => {
                        const status = getPropertyStatus(p.propertyId);
                        const propInspections = (allInspections as { propertyId?: number; status?: string; createdAt?: Date }[])
                          .filter(i => i.propertyId === p.propertyId);
                        const lastInspection = propInspections[propInspections.length - 1];
                        return (
                          <div key={p.propertyId} className="rounded-sm p-4"
                            style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2">
                                <Building2 size={14} style={{ color: "var(--pink)", flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <div className="font-archivo font-semibold text-sm" style={{ color: "var(--black)" }}>{p.address}</div>
                                  {(p.suburb || p.city) && (
                                    <div className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                                      {[p.suburb, p.city].filter(Boolean).join(", ")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {p.isPrimary && (
                                <span className="font-archivo text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                                  style={{ background: "var(--yellow)", color: "var(--black)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <TrafficLight status={status} />
                              <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                                {lastInspection ? `Last: ${new Date(lastInspection.createdAt!).toLocaleDateString("en-NZ")}` : "No inspections yet"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
