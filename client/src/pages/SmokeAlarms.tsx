import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AlarmType = "photoelectric" | "ionisation" | "heat" | "combined" | "unknown";
type PowerSource = "long_life_battery" | "replaceable_battery" | "hard_wired" | "unknown";
type Level = "ground" | "first" | "second" | "third" | "basement" | "single_storey";

const ALARM_TYPE_LABELS: Record<AlarmType, string> = {
  photoelectric: "Photoelectric ✓",
  ionisation: "Ionisation ⚠",
  heat: "Heat detector",
  combined: "Combined (Photo + Heat)",
  unknown: "Unknown — confirm",
};

const POWER_SOURCE_LABELS: Record<PowerSource, string> = {
  long_life_battery: "Long-life battery (8yr+) ✓",
  replaceable_battery: "Replaceable battery ⚠",
  hard_wired: "Hard-wired to mains ✓",
  unknown: "Unknown — confirm",
};

const LEVEL_LABELS: Record<Level, string> = {
  single_storey: "Single-storey property",
  ground: "Ground floor",
  first: "First floor",
  second: "Second floor",
  third: "Third floor",
  basement: "Basement",
};

const defaultForm = {
  location: "",
  level: "ground" as Level,
  distanceFromBedroom: "",
  alarmType: "unknown" as AlarmType,
  powerSource: "unknown" as PowerSource,
  isWorking: true,
  isTested: false,
  isInterconnected: false,
  expiryDate: "",
  installDate: "",
  lastTestedDate: "",
  isPreRegulation: false,
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SmokeAlarms() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<any | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [expandedAlarm, setExpandedAlarm] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);

  const { data: properties } = trpc.properties.list.useQuery();
  const { data: alarms, refetch: refetchAlarms } = trpc.smokeAlarms.list.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const { data: compliance, refetch: refetchCompliance } = trpc.smokeAlarms.getCompliance.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const { data: rules } = trpc.smokeAlarms.getRules.useQuery();

  const createMutation = trpc.smokeAlarms.create.useMutation({
    onSuccess: () => {
      toast.success("Smoke alarm added");
      setShowAddDialog(false);
      setForm(defaultForm);
      refetchAlarms();
      refetchCompliance();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.smokeAlarms.update.useMutation({
    onSuccess: () => {
      toast.success("Smoke alarm updated");
      setEditingAlarm(null);
      setForm(defaultForm);
      refetchAlarms();
      refetchCompliance();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.smokeAlarms.delete.useMutation({
    onSuccess: () => {
      toast.success("Smoke alarm removed");
      refetchAlarms();
      refetchCompliance();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!selectedPropertyId || !form.location.trim()) return;
    if (editingAlarm) {
      updateMutation.mutate({ id: editingAlarm.id, ...form });
    } else {
      createMutation.mutate({ propertyId: selectedPropertyId, ...form });
    }
  };

  const handleEdit = (alarm: any) => {
    setEditingAlarm(alarm);
    setForm({
      location: alarm.location || "",
      level: alarm.level || "ground",
      distanceFromBedroom: alarm.distanceFromBedroom || "",
      alarmType: alarm.alarmType || "unknown",
      powerSource: alarm.powerSource || "unknown",
      isWorking: alarm.isWorking ?? true,
      isTested: alarm.isTested ?? false,
      isInterconnected: alarm.isInterconnected ?? false,
      expiryDate: alarm.expiryDate || "",
      installDate: alarm.installDate || "",
      lastTestedDate: alarm.lastTestedDate || "",
      isPreRegulation: alarm.isPreRegulation ?? false,
      notes: alarm.notes || "",
    });
    setShowAddDialog(true);
  };

  const complianceColor = compliance?.status === "compliant" ? "#10b981"
    : compliance?.status === "non_compliant" ? "var(--pink)"
    : "#f59e0b";

  const ComplianceIcon = compliance?.status === "compliant" ? ShieldCheck
    : compliance?.status === "non_compliant" ? ShieldAlert
    : HelpCircle;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: "rgba(255,45,135,0.1)" }}>
              <Flame size={16} style={{ color: "var(--pink)" }} />
            </div>
            <h1 className="font-archivo text-2xl font-black" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
              SMOKE ALARMS
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: "var(--muted)" }}>
            NZ compliance documentation — Residential Tenancies (Smoke Alarms and Insulation) Regulations 2016
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-2 rounded-sm font-archivo text-xs"
          style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          <BookOpen size={12} />
          NZ Rules
        </Button>
      </div>

      {/* NZ Rules panel */}
      {showRules && rules && (
        <div className="mb-6 rounded-sm border p-5" style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.2)" }}>
          <div className="font-archivo text-xs font-bold mb-3" style={{ color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            NZ Smoke Alarm Regulations — Quick Reference
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: "var(--ink)" }}>
            <div>
              <div className="font-bold mb-1 text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mandatory Requirements</div>
              {rules.mandatory.map((r, i) => <div key={i} className="flex gap-2 mb-1"><CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} /><span>{r}</span></div>)}
            </div>
            <div>
              <div className="font-bold mb-1 text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>New Alarm Requirements (post July 2016)</div>
              {rules.newAlarms.map((r, i) => <div key={i} className="flex gap-2 mb-1"><CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} /><span>{r}</span></div>)}
            </div>
            <div>
              <div className="font-bold mb-1 text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Landlord Responsibilities</div>
              {rules.landlordResponsibilities.map((r, i) => <div key={i} className="flex gap-2 mb-1"><Info size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#6366f1" }} /><span>{r}</span></div>)}
            </div>
            <div>
              <div className="font-bold mb-1 text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Penalties</div>
              <div className="flex gap-2 mb-1"><AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--pink)" }} /><span>Landlord non-compliance: <strong>{rules.penalties.landlord}</strong></span></div>
              <div className="flex gap-2 mb-1"><AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} /><span>Tenant non-compliance: <strong>{rules.penalties.tenant}</strong></span></div>
            </div>
          </div>
          <div className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            Source: <a href={rules.source} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>{rules.source}</a>
          </div>
        </div>
      )}

      {/* Property selector */}
      <div className="mb-6">
        <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Select Property</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(properties || []).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPropertyId(p.id)}
              className="text-left p-4 rounded-sm border transition-all"
              style={{
                background: selectedPropertyId === p.id ? "rgba(255,45,135,0.06)" : "var(--white)",
                borderColor: selectedPropertyId === p.id ? "var(--pink)" : "var(--border)",
              }}
            >
              <div className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{p.address}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{[p.suburb, p.city].filter(Boolean).join(", ")}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedPropertyId && (
        <>
          {/* Compliance status banner */}
          {compliance && (
            <div
              className="mb-6 rounded-sm p-4 flex items-start gap-4"
              style={{
                background: `${complianceColor}10`,
                border: `1px solid ${complianceColor}30`,
              }}
            >
              <ComplianceIcon size={24} style={{ color: complianceColor, flexShrink: 0 }} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="font-archivo font-bold text-sm" style={{ color: complianceColor, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {compliance.status === "compliant" ? "Compliant"
                      : compliance.status === "non_compliant" ? "Non-Compliant"
                      : "Needs Assessment"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {compliance.alarmCount} alarm{compliance.alarmCount !== 1 ? "s" : ""} documented
                    · {compliance.workingCount} working
                    · {compliance.photoelectricCount} photoelectric
                  </span>
                  {compliance.penaltyRisk && (
                    <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,45,135,0.1)", color: "var(--pink)", border: "1px solid rgba(255,45,135,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      ⚠ Penalty risk up to $7,200
                    </Badge>
                  )}
                </div>
                <p className="text-sm" style={{ color: "var(--ink)" }}>{compliance.summary}</p>
                {compliance.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {compliance.issues.map((issue, i) => (
                      <div key={i} className="flex gap-2 text-xs" style={{ color: "var(--ink)" }}>
                        {issue.severity === "critical" && <XCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--pink)" }} />}
                        {issue.severity === "warning" && <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />}
                        {issue.severity === "info" && <Info size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#6366f1" }} />}
                        <span><strong>{issue.rule}:</strong> {issue.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alarm list + add button */}
          <div className="flex items-center justify-between mb-4">
            <div className="font-archivo text-xs" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Documented Alarms ({alarms?.length ?? 0})
            </div>
            <Button
              onClick={() => { setEditingAlarm(null); setForm(defaultForm); setShowAddDialog(true); }}
              className="flex items-center gap-2 rounded-sm font-archivo text-xs"
              style={{ background: "var(--pink)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <Plus size={12} />
              Add Alarm
            </Button>
          </div>

          {(!alarms || alarms.length === 0) ? (
            <div className="rounded-sm border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--white)" }}>
              <Flame size={32} className="mx-auto mb-3" style={{ color: "var(--muted-light)" }} />
              <div className="font-archivo font-bold text-sm mb-1" style={{ color: "var(--ink)" }}>No smoke alarms documented</div>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Document each smoke alarm to generate a compliance assessment against NZ regulations.
              </p>
              <Button
                onClick={() => { setEditingAlarm(null); setForm(defaultForm); setShowAddDialog(true); }}
                className="rounded-sm font-archivo text-xs"
                style={{ background: "var(--pink)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                <Plus size={12} className="mr-2" /> Document First Alarm
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {(alarms || []).map((alarm) => {
                const isExpanded = expandedAlarm === alarm.id;
                const isCompliant = alarm.isWorking &&
                  (alarm.alarmType === "photoelectric" || alarm.isPreRegulation) &&
                  (alarm.powerSource === "long_life_battery" || alarm.powerSource === "hard_wired" || alarm.isPreRegulation);
                const statusColor = !alarm.isWorking ? "var(--pink)"
                  : isCompliant ? "#10b981"
                  : "#f59e0b";

                return (
                  <div key={alarm.id} className="rounded-sm border overflow-hidden" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => setExpandedAlarm(isExpanded ? null : alarm.id)}
                    >
                      <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: `${statusColor}15` }}>
                        <Flame size={16} style={{ color: statusColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{alarm.location}</span>
                          <Badge className="font-archivo text-xs px-2 py-0.5" style={{
                            background: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}>
                            {!alarm.isWorking ? "Not Working" : isCompliant ? "Compliant" : "Review Required"}
                          </Badge>
                          {alarm.isPreRegulation && (
                            <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              Pre-2016
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          {LEVEL_LABELS[alarm.level as Level] || alarm.level}
                          {alarm.distanceFromBedroom && ` · ${alarm.distanceFromBedroom} from bedroom`}
                          {" · "}{ALARM_TYPE_LABELS[alarm.alarmType as AlarmType] || alarm.alarmType}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(alarm); }}
                          className="p-1.5 rounded-sm hover:bg-gray-100"
                        >
                          <Edit3 size={13} style={{ color: "var(--muted)" }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("Remove this alarm?")) deleteMutation.mutate({ id: alarm.id }); }}
                          className="p-1.5 rounded-sm hover:bg-gray-100"
                        >
                          <Trash2 size={13} style={{ color: "var(--muted)" }} />
                        </button>
                        {isExpanded ? <ChevronUp size={14} style={{ color: "var(--muted-light)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted-light)" }} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t grid grid-cols-2 md:grid-cols-3 gap-3" style={{ borderColor: "var(--border)" }}>
                        {[
                          ["Type", ALARM_TYPE_LABELS[alarm.alarmType as AlarmType] || alarm.alarmType],
                          ["Power Source", POWER_SOURCE_LABELS[alarm.powerSource as PowerSource] || alarm.powerSource],
                          ["Working", alarm.isWorking ? "Yes ✓" : "No ✗"],
                          ["Tested", alarm.isTested ? "Yes ✓" : "Not confirmed"],
                          ["Interconnected", alarm.isInterconnected ? "Yes ✓" : "No"],
                          ["Expiry Date", alarm.expiryDate || "Not recorded"],
                          ["Install Date", alarm.installDate || "Not recorded"],
                          ["Last Tested", alarm.lastTestedDate || "Not recorded"],
                          ["Pre-2016 Alarm", alarm.isPreRegulation ? "Yes (existing exemption)" : "No"],
                        ].map(([label, value]) => (
                          <div key={label} className="mt-3">
                            <div className="text-xs mb-0.5" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                            <div className="text-sm" style={{ color: "var(--ink)" }}>{value}</div>
                          </div>
                        ))}
                        {alarm.notes && (
                          <div className="mt-3 col-span-2 md:col-span-3">
                            <div className="text-xs mb-0.5" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</div>
                            <div className="text-sm" style={{ color: "var(--ink)" }}>{alarm.notes}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setEditingAlarm(null); setForm(defaultForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-archivo font-black" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
              {editingAlarm ? "Edit Smoke Alarm" : "Document Smoke Alarm"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Location *</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Hallway outside master bedroom"
                className="mt-1 rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Level</Label>
                <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v as Level }))}>
                  <SelectTrigger className="mt-1 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Distance from Bedroom</Label>
                <Input
                  value={form.distanceFromBedroom}
                  onChange={e => setForm(f => ({ ...f, distanceFromBedroom: e.target.value }))}
                  placeholder="e.g. 2.1m, in room"
                  className="mt-1 rounded-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Alarm Type</Label>
                <Select value={form.alarmType} onValueChange={v => setForm(f => ({ ...f, alarmType: v as AlarmType }))}>
                  <SelectTrigger className="mt-1 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALARM_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Power Source</Label>
                <Select value={form.powerSource} onValueChange={v => setForm(f => ({ ...f, powerSource: v as PowerSource }))}>
                  <SelectTrigger className="mt-1 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POWER_SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Expiry Date</Label>
                <Input value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} placeholder="e.g. 2031-06" className="mt-1 rounded-sm" />
              </div>
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Install Date</Label>
                <Input value={form.installDate} onChange={e => setForm(f => ({ ...f, installDate: e.target.value }))} placeholder="e.g. 2023-04" className="mt-1 rounded-sm" />
              </div>
              <div>
                <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Last Tested</Label>
                <Input value={form.lastTestedDate} onChange={e => setForm(f => ({ ...f, lastTestedDate: e.target.value }))} placeholder="e.g. 2026-04" className="mt-1 rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Working", key: "isWorking" },
                { label: "Tested during inspection", key: "isTested" },
                { label: "Interconnected", key: "isInterconnected" },
                { label: "Pre-July 2016 alarm (existing exemption)", key: "isPreRegulation" },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</Label>
                  <Switch
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label className="font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional observations..."
                className="mt-1 rounded-sm resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !form.location.trim()}
                className="flex-1 rounded-sm font-archivo text-xs"
                style={{ background: "var(--pink)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {editingAlarm ? "Save Changes" : "Add Alarm"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowAddDialog(false); setEditingAlarm(null); setForm(defaultForm); }}
                className="rounded-sm font-archivo text-xs"
                style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
