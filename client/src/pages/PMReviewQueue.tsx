import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Edit2, Clock, AlertTriangle,
  FileText, Mail, Wrench, ChevronDown, ChevronUp, Zap
} from "lucide-react";

const ITEM_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  maintenance_request: { label: "Maintenance Request", color: "var(--pink)", icon: Wrench },
  tenant_letter: { label: "Tenant Letter", color: "#6366f1", icon: Mail },
  pdf_report: { label: "PDF Report", color: "#10b981", icon: FileText },
  inspection_summary: { label: "Inspection Summary", color: "var(--yellow-warm)", icon: FileText },
};

export default function PMReviewQueue() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<Record<number, string>>({});

  const queueQuery = trpc.agent.getPmQueue.useQuery();
  const updateMutation = trpc.agent.updatePmQueueItem.useMutation({
    onSuccess: () => {
      queueQuery.refetch();
      toast.success("Item updated");
    },
    onError: () => toast.error("Failed to update item"),
  });

  const queueItems = (queueQuery.data as any[]) || [];
  const pendingItems = queueItems.filter((i: any) => i.status === "pending");
  const approvedItems = queueItems.filter((i: any) => i.status === "approved");
  const rejectedItems = queueItems.filter((i: any) => i.status === "rejected");

  const handleApprove = (item: any) => {
    updateMutation.mutate({
      id: item.id,
      status: "approved",
      tenantLetterDraft: editingContent[item.id] || undefined,
    });
  };

  const handleReject = (item: any) => {
    updateMutation.mutate({
      id: item.id,
      status: "rejected",
    });
  };

  const handleApproveAll = () => {
    pendingItems.forEach((item: any) => {
      updateMutation.mutate({ id: item.id, status: "approved" });
    });
  };

  const renderQueueItem = (item: any, showActions: boolean) => {
    const isExpanded = expandedItem === item.id;
    const hasLetter = !!item.tenantLetterDraft;
    const hasMaintenance = item.maintenanceRequestCount > 0;
    const fullAddress = [item.propertyAddress, item.propertySuburb, item.propertyCity].filter(Boolean).join(", ");

    return (
      <div
        key={item.id}
        className="rounded-sm border overflow-hidden"
        style={{ background: "var(--white)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center gap-4 p-4 cursor-pointer"
          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
        >
          <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.1)" }}>
            <FileText size={16} style={{ color: "#6366f1" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                {fullAddress || "Property"}
              </span>
              {hasLetter && (
                <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <Mail size={9} className="mr-1" /> Tenant Letter
                </Badge>
              )}
              {hasMaintenance && (
                <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,45,135,0.1)", color: "var(--pink)", border: "1px solid rgba(255,45,135,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <Wrench size={9} className="mr-1" /> {item.maintenanceRequestCount} Maintenance
                </Badge>
              )}
            </div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Inspection #{item.inspectionId} · {new Date(item.createdAt).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.status === "pending" && (
              <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,184,0,0.1)", color: "var(--yellow-warm)", border: "1px solid rgba(255,184,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <Clock size={10} className="mr-1" />
                Pending
              </Badge>
            )}
            {item.status === "approved" && (
              <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <CheckCircle2 size={10} className="mr-1" />
                Approved
              </Badge>
            )}
            {item.status === "rejected" && (
              <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,45,135,0.1)", color: "var(--pink)", border: "1px solid rgba(255,45,135,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <XCircle size={10} className="mr-1" />
                Rejected
              </Badge>
            )}
            {isExpanded ? <ChevronUp size={14} style={{ color: "var(--muted-light)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted-light)" }} />}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
            {/* Agent notes */}
            {item.agentNotes && (
              <div className="mt-4">
                <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Fixx Agent Summary
                </div>
                <div
                  className="rounded-sm p-4 text-sm"
                  style={{ background: "rgba(99,102,241,0.06)", color: "var(--ink)", lineHeight: 1.7, borderLeft: "3px solid #6366f1" }}
                >
                  {item.agentNotes}
                </div>
              </div>
            )}

            {/* Tenant letter draft */}
            {item.tenantLetterDraft && (
              <div className="mt-4">
                <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  AI-Drafted Tenant Letter
                </div>
                <div
                  className="rounded-sm p-4 text-sm"
                  style={{ background: "var(--cream)", color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}
                >
                  {item.tenantLetterDraft}
                </div>
              </div>
            )}

            {/* PM Notes input */}
            {showActions && (
              <div className="mt-4">
                <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Your Notes (Optional)
                </div>
                <Textarea
                  value={editingContent[item.id] || ""}
                  onChange={e => setEditingContent(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Add notes or edits before approving..."
                  className="rounded-sm resize-none text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleApprove(item)}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                  style={{ background: "#10b981", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  <CheckCircle2 size={12} />
                  Approve & Send
                </Button>
                <Button
                  onClick={() => handleReject(item)}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                  style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pink)", borderColor: "rgba(255,45,135,0.3)" }}
                >
                  <XCircle size={12} />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <CheckCircle2 size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                PM REVIEW QUEUE
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                AI-drafted items awaiting your review and approval
              </p>
            </div>
          </div>
          {pendingItems.length > 0 && (
            <Button
              onClick={handleApproveAll}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-sm font-archivo text-xs"
              style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <Zap size={14} />
              Approve All ({pendingItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-sm p-4 mb-6 flex items-start gap-3" style={{ background: "var(--black)", color: "var(--white)" }}>
        <Zap size={16} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--yellow)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            How the Agent Queue Works
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            After each inspection is marked complete, the agent automatically drafts maintenance requests, tenant letters, and the PDF report. Everything lands here for your review. Approve to send, edit before approving, or reject. You stay in control — the agent does the heavy lifting.
          </p>
        </div>
      </div>

      {queueQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading review queue...</p>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
          <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Queue is Clear</p>
          <p className="text-sm" style={{ color: "var(--muted-light)" }}>
            No items awaiting review. Complete an inspection to see the agent's drafts here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pendingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "var(--yellow-warm)" }} />
                <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--yellow-warm)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Awaiting Review ({pendingItems.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pendingItems.map((item: any) => renderQueueItem(item, true))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approvedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} style={{ color: "#10b981" }} />
                <h3 className="font-archivo text-sm font-bold" style={{ color: "#10b981", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Approved ({approvedItems.length})
                </h3>
              </div>
              <div className="space-y-2">
                {approvedItems.map((item: any) => renderQueueItem(item, false))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejectedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} style={{ color: "var(--pink)" }} />
                <h3 className="font-archivo text-sm font-bold" style={{ color: "var(--pink)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Rejected ({rejectedItems.length})
                </h3>
              </div>
              <div className="space-y-2">
                {rejectedItems.map((item: any) => renderQueueItem(item, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
