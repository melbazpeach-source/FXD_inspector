import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Link2,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Send,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  ExternalLink,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Awaiting Submission", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" /> },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  reviewed: { label: "Reviewed", color: "bg-purple-100 text-purple-700", icon: <Eye className="h-3 w-3" /> },
  imported: { label: "Imported", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function RemoteInspection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: properties } = trpc.properties.list.useQuery();
  const { data: submissions, refetch } = trpc.reports.listRemoteSubmissions.useQuery({});

  const createLink = trpc.reports.createRemoteLink.useMutation({
    onSuccess: (d) => {
      refetch();
      setShowGenerateForm(false);
      toast.success("Remote link created!");
      // Auto-copy the link
      const url = `${window.location.origin}/submit/${d.token}`;
      navigator.clipboard.writeText(url).catch(() => {});
    },
    onError: (e) => toast.error(e.message),
  });

  const reviewMutation = trpc.reports.reviewRemoteSubmission.useMutation({
    onSuccess: () => { refetch(); toast.success("Submission updated"); },
    onError: () => toast.error("Failed to update"),
  });

  function copyLink(token: string) {
    const url = `${window.location.origin}/submit/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Link copied to clipboard");
    });
  }

  const pendingCount = submissions?.filter((s) => s.status === "pending").length ?? 0;
  const submittedCount = submissions?.filter((s) => s.status === "submitted").length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Remote Inspections</h1>
            <p className="text-muted-foreground mt-1">
              Generate shareable links for tenants to submit photos and notes remotely.
            </p>
          </div>
          <Button onClick={() => setShowGenerateForm(!showGenerateForm)}>
            <Plus className="h-4 w-4 mr-2" /> Generate Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Links", value: submissions?.length ?? 0, color: "text-foreground" },
            { label: "Awaiting Submission", value: pendingCount, color: "text-yellow-600" },
            { label: "Ready to Review", value: submittedCount, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Generate Link Form */}
        {showGenerateForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-4">Generate Remote Inspection Link</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Property</label>
                <select
                  className="w-full text-sm p-2 border border-border rounded-lg bg-background text-foreground"
                  value={selectedPropertyId ?? ""}
                  onChange={(e) => setSelectedPropertyId(Number(e.target.value) || null)}
                >
                  <option value="">Select a property…</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>{p.address}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Link expires in (days)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-32"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (!selectedPropertyId) { toast.error("Please select a property"); return; }
                    createLink.mutate({ propertyId: selectedPropertyId, expiresInDays: expiryDays });
                  }}
                  disabled={createLink.isPending || !selectedPropertyId}
                >
                  {createLink.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Create Link
                </Button>
                <Button variant="outline" onClick={() => setShowGenerateForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-3">
          {!submissions ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No remote links yet</p>
              <p className="text-sm mt-1">Click "Generate Link" to create your first remote inspection link.</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const isExpanded = expandedId === sub.id;
              const statusCfg = STATUS_CONFIG[sub.status ?? "pending"] || STATUS_CONFIG.pending;
              const isExpired = sub.expiresAt && new Date() > new Date(sub.expiresAt);
              return (
                <div key={sub.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          Property #{sub.propertyId}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Expired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {sub.submitterName && (
                          <span className="text-xs text-muted-foreground">By: {sub.submitterName}</span>
                        )}
                        {sub.submittedAt && (
                          <span className="text-xs text-muted-foreground">
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString("en-NZ")}
                          </span>
                        )}
                        {!sub.submittedAt && sub.expiresAt && (
                          <span className="text-xs text-muted-foreground">
                            Expires: {new Date(sub.expiresAt).toLocaleDateString("en-NZ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={(e) => { e.stopPropagation(); copyLink(sub.token); }}
                        >
                          {copiedToken === sub.token ? (
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedToken === sub.token ? "Copied!" : "Copy Link"}
                        </Button>
                      )}
                      {sub.status === "pending" && (
                        <a
                          href={`/submit/${sub.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" /> Preview
                          </Button>
                        </a>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                      {/* Submission link */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Submission Link</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 truncate text-foreground">
                            {window.location.origin}/submit/{sub.token}
                          </code>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => copyLink(sub.token)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Notes */}
                      {sub.notes && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Tenant Notes</label>
                          <p className="text-sm text-foreground bg-background border border-border rounded p-2">{sub.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {sub.status === "submitted" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ submissionId: sub.id, action: "approve" })}
                            disabled={reviewMutation.isPending}
                          >
                            <Download className="h-3 w-3 mr-1" /> Import into Inspection
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({ submissionId: sub.id, action: "reject" })}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Dismiss
                          </Button>
                        </div>
                      )}
                      {sub.status === "imported" && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4" /> Imported into inspection
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {submissions && submissions.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
