content = r'''import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2, Mail, Phone, Plus, Pencil, Trash2, User, Users,
  ChevronRight, X, Check, Briefcase, Home, Bell, ArrowLeft,
  Upload, RefreshCw, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";

type EntityType = "individual" | "company" | "trust" | "partnership";
type PreferredContact = "email" | "phone" | "sms" | "portal";
type ReportFrequency = "after_each_inspection" | "monthly" | "quarterly";
type CrmPlatform = "palace" | "console" | "propertytree" | "rest" | "standalone";

const ENTITY_LABELS: Record<EntityType, string> = {
  individual: "Individual",
  company: "Company",
  trust: "Trust",
  partnership: "Partnership",
};
const ENTITY_ICONS: Record<EntityType, typeof User> = {
  individual: User,
  company: Briefcase,
  trust: Briefcase,
  partnership: Users,
};
const CONTACT_LABELS: Record<PreferredContact, string> = {
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  portal: "Portal",
};
const FREQ_LABELS: Record<ReportFrequency, string> = {
  after_each_inspection: "After each inspection",
  monthly: "Monthly digest",
  quarterly: "Quarterly summary",
};
const CRM_OPTIONS: { value: CrmPlatform; label: string; color: string }[] = [
  { value: "palace", label: "Palace", color: "#6366f1" },
  { value: "console", label: "Console Cloud", color: "#0ea5e9" },
  { value: "propertytree", label: "PropertyTree", color: "#10b981" },
  { value: "rest", label: "REST Professional", color: "#f59e0b" },
  { value: "standalone", label: "Standalone (no CRM)", color: "#6b7280" },
];

interface OwnerFormData {
  name: string;
  entityType: EntityType;
  companyName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  mailingAddress: string;
  preferredContact: PreferredContact;
  reportFrequency: ReportFrequency;
  notes: string;
  propertyIds: number[];
}
const EMPTY_FORM: OwnerFormData = {
  name: "",
  entityType: "individual",
  companyName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  mailingAddress: "",
  preferredContact: "email",
  reportFrequency: "after_each_inspection",
  notes: "",
  propertyIds: [],
};

export default function Owners() {
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OwnerFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushingPlatform, setPushingPlatform] = useState<CrmPlatform | null>(null);

  const { data: owners = [], refetch } = trpc.owners.list.useQuery();
  const { data: allProperties = [] } = trpc.properties.list.useQuery();
  const { data: selectedOwnerData, refetch: refetchOwner } = trpc.owners.get.useQuery(
    { id: selectedOwner! },
    { enabled: !!selectedOwner }
  );
  const utils = trpc.useUtils();

  const createMutation = trpc.owners.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm(EMPTY_FORM); toast.success("Owner added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.owners.update.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); toast.success("Owner updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.owners.delete.useMutation({
    onSuccess: () => { refetch(); setDeleteConfirm(null); if (selectedOwner === deleteConfirm) setSelectedOwner(null); toast.success("Owner removed"); },
    onError: (e) => toast.error(e.message),
  });
  const linkPropMutation = trpc.owners.linkProperty.useMutation({
    onSuccess: () => { refetch(); if (selectedOwner) utils.owners.get.invalidate({ id: selectedOwner }); },
  });
  const unlinkPropMutation = trpc.owners.unlinkProperty.useMutation({
    onSuccess: () => { refetch(); if (selectedOwner) utils.owners.get.invalidate({ id: selectedOwner }); },
  });
  const pushToCrmMutation = trpc.owners.pushToCrm.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Pushed successfully");
      setShowPushModal(false);
      setPushingPlatform(null);
      refetch();
      if (selectedOwner) refetchOwner();
    },
    onError: (e) => {
      toast.error(e.message);
      setPushingPlatform(null);
      if (selectedOwner) refetchOwner();
    },
  });

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (owner: typeof owners[0]) => {
    setEditingId(owner.id);
    setForm({
      name: owner.name,
      entityType: (owner.entityType as EntityType) || "individual",
      companyName: owner.companyName || "",
      email: owner.email || "",
      phone: owner.phone || "",
      alternatePhone: owner.alternatePhone || "",
      mailingAddress: owner.mailingAddress || "",
      preferredContact: (owner.preferredContact as PreferredContact) || "email",
      reportFrequency: (owner.reportFrequency as ReportFrequency) || "after_each_inspection",
      notes: owner.notes || "",
      propertyIds: owner.properties?.map((p: { propertyId: number }) => p.propertyId) || [],
    });
    setShowForm(true);
  };
  const handleSubmit = () => {
    const payload = { ...form, email: form.email || undefined };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };
  const handlePush = (platform: CrmPlatform) => {
    if (!selectedOwner) return;
    setPushingPlatform(platform);
    pushToCrmMutation.mutate({ ownerId: selectedOwner, platform });
  };

  const activeOwner = selectedOwner ? owners.find(o => o.id === selectedOwner) : null;
  const isDetailView = !!selectedOwner;

  const pushStatusIcon = (status: string | null | undefined) => {
    if (status === "synced") return <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />;
    if (status === "error") return <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />;
    if (status === "pending") return <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />;
    return null;
  };

  return (
    <DashboardLayout title="Owners">
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 0px)" }}>

        {/* Left panel — hidden on mobile when detail is open */}
        <div
          className={`flex-col border-r flex-shrink-0 ${isDetailView ? "hidden lg:flex" : "flex w-full"}`}
          style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--cream)" }}
        >
          <div className="lg:w-80 w-full flex flex-col h-full">
            <div className="px-5 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h1 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>OWNERS</h1>
                <p className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)", letterSpacing: "0.04em" }}>
                  {owners.length} landlord{owners.length !== 1 ? "s" : ""} registered
                </p>
              </div>
              <button onClick={openCreate} className="fxd-btn fxd-btn-pink" style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus className="w-4 h-4" /> ADD
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
              {owners.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <User className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted)" }} />
                  <p className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>No owners yet</p>
                  <p className="font-archivo text-xs mt-1" style={{ color: "var(--muted)" }}>Add your first landlord to get started</p>
                </div>
              ) : (
                owners.map((owner) => {
                  const Icon = ENTITY_ICONS[owner.entityType as EntityType] || User;
                  const isActive = selectedOwner === owner.id;
                  return (
                    <button key={owner.id} onClick={() => setSelectedOwner(owner.id)}
                      className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                      style={{ background: isActive ? "var(--black)" : "white", border: `1.5px solid ${isActive ? "var(--black)" : "rgba(0,0,0,0.08)"}` }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isActive ? "var(--pink)" : "var(--cream)" }}>
                        <Icon className="w-4 h-4" style={{ color: isActive ? "white" : "var(--black)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-archivo text-sm font-semibold truncate" style={{ color: isActive ? "white" : "var(--black)" }}>{owner.name}</p>
                        <p className="font-archivo text-xs truncate" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "var(--muted)" }}>
                          {ENTITY_LABELS[owner.entityType as EntityType] || "Individual"} · {owner.properties?.length || 0} {owner.properties?.length === 1 ? "property" : "properties"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pushStatusIcon((owner as any).pushStatus)}
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? "rgba(255,255,255,0.5)" : "var(--muted)" }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right panel — full screen on mobile when detail is open */}
        <div className={`flex-1 overflow-y-auto ${isDetailView ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`} style={{ background: "var(--cream)" }}>
          {!selectedOwner ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <User className="w-8 h-8" style={{ color: "var(--muted)" }} />
                </div>
                <p className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>Select an owner</p>
                <p className="font-archivo text-xs mt-1" style={{ color: "var(--muted)" }}>Choose a landlord from the list to view their details</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
              {/* Mobile back button */}
              <button onClick={() => setSelectedOwner(null)} className="lg:hidden flex items-center gap-2 mb-4 font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>
                <ArrowLeft className="w-4 h-4" /> All Owners
              </button>

              {/* Owner header card */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--black)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--pink)" }}>
                    {(() => { const Icon = ENTITY_ICONS[(activeOwner?.entityType as EntityType) || "individual"]; return <Icon className="w-6 h-6 text-white" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-anton text-xl text-white" style={{ letterSpacing: "-0.01em" }}>{activeOwner?.name}</h2>
                    <p className="font-archivo text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {ENTITY_LABELS[(activeOwner?.entityType as EntityType) || "individual"]}
                      {activeOwner?.companyName ? ` · ${activeOwner.companyName}` : ""}
                    </p>
                    {(activeOwner as any)?.pushStatus && (activeOwner as any).pushStatus !== "not_pushed" && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {pushStatusIcon((activeOwner as any).pushStatus)}
                        <span className="font-archivo text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {(activeOwner as any).pushStatus === "synced" ? `Synced to ${(activeOwner as any).platformSource}` : (activeOwner as any).pushStatus === "pending" ? "Push pending" : `Push error`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => activeOwner && openEdit(activeOwner)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button onClick={() => setDeleteConfirm(selectedOwner)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#fca5a5" }} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setShowPushModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-archivo text-xs font-semibold" style={{ background: "var(--pink)", color: "white" }}>
                    <Upload className="w-3.5 h-3.5" /> Push to CRM
                  </button>
                  {activeOwner?.email && (
                    <a href={`mailto:${activeOwner.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-archivo text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  )}
                  {activeOwner?.phone && (
                    <a href={`tel:${activeOwner.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-archivo text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  )}
                </div>
              </div>

              {/* Contact details */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                <h3 className="font-archivo text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Contact Details</h3>
                <div className="space-y-3">
                  {activeOwner?.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pink)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.email}</span></div>}
                  {activeOwner?.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pink)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.phone}</span></div>}
                  {activeOwner?.alternatePhone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.alternatePhone} (alt)</span></div>}
                  {activeOwner?.mailingAddress && <div className="flex items-start gap-3"><Home className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--pink)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.mailingAddress}</span></div>}
                  <div className="flex items-center gap-3"><Bell className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>Preferred: <strong>{CONTACT_LABELS[(activeOwner?.preferredContact as PreferredContact) || "email"]}</strong></span></div>
                  <div className="flex items-center gap-3"><Bell className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted)" }} /><span className="font-archivo text-sm" style={{ color: "var(--black)" }}>Reports: <strong>{FREQ_LABELS[(activeOwner?.reportFrequency as ReportFrequency) || "after_each_inspection"]}</strong></span></div>
                </div>
              </div>

              {/* Properties */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                <h3 className="font-archivo text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Properties ({selectedOwnerData?.properties?.length || 0})</h3>
                <div className="space-y-2">
                  {selectedOwnerData?.properties?.map((p: { id: number; propertyId: number; address: string; suburb: string | null; city: string | null; isPrimary: boolean | null }) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--cream)" }}>
                      <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pink)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-archivo text-sm font-semibold truncate" style={{ color: "var(--black)" }}>{p.address}</p>
                        {(p.suburb || p.city) && <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{p.suburb || p.city}</p>}
                      </div>
                      {p.isPrimary && <span className="font-archivo text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--pink)", color: "white" }}>Primary</span>}
                      <button onClick={() => unlinkPropMutation.mutate({ ownerId: selectedOwner, propertyId: p.propertyId })} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                        <X className="w-3 h-3" style={{ color: "#ef4444" }} />
                      </button>
                    </div>
                  ))}
                  <div className="mt-2">
                    <p className="font-archivo text-xs mb-2" style={{ color: "var(--muted)" }}>Link additional property:</p>
                    <div className="flex flex-wrap gap-2">
                      {allProperties.filter(p => !selectedOwnerData?.properties?.find((op: { propertyId: number }) => op.propertyId === p.id)).slice(0, 6).map(p => (
                        <button key={p.id} onClick={() => linkPropMutation.mutate({ ownerId: selectedOwner, propertyId: p.id })}
                          className="font-archivo text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "var(--cream)", border: "1.5px dashed rgba(0,0,0,0.15)", color: "var(--black)" }}>
                          + {p.address.slice(0, 28)}{p.address.length > 28 ? "\u2026" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent reports */}
              {selectedOwnerData?.notifications && selectedOwnerData.notifications.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                  <h3 className="font-archivo text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Recent Reports</h3>
                  <div className="space-y-2">
                    {selectedOwnerData.notifications.slice(0, 5).map((n: { id: number; type: string; title: string; pmStatus: string; sentAt: Date | null; createdAt: Date }) => (
                      <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--cream)" }}>
                        <Bell className="w-4 h-4 flex-shrink-0" style={{ color: "var(--pink)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-archivo text-sm font-semibold truncate" style={{ color: "var(--black)" }}>{n.title}</p>
                          <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>{n.pmStatus === "sent" ? "Sent to owner" : n.pmStatus === "pm_approved" ? "PM approved" : "Draft"}</p>
                        </div>
                        <span className="font-archivo text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: n.pmStatus === "sent" ? "#dcfce7" : n.pmStatus === "pm_approved" ? "#fef3c7" : "#f3f4f6", color: n.pmStatus === "sent" ? "#16a34a" : n.pmStatus === "pm_approved" ? "#d97706" : "#6b7280" }}>
                          {n.pmStatus === "sent" ? "Sent" : n.pmStatus === "pm_approved" ? "Approved" : "Draft"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Push to CRM modal */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-anton text-lg" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>PUSH TO CRM</h3>
              <button onClick={() => setShowPushModal(false)}><X className="w-5 h-5" style={{ color: "var(--muted)" }} /></button>
            </div>
            <p className="font-archivo text-sm mb-4" style={{ color: "var(--muted)" }}>
              Choose where to push <strong style={{ color: "var(--black)" }}>{activeOwner?.name}</strong>&apos;s details:
            </p>
            <div className="space-y-2">
              {CRM_OPTIONS.map((crm) => (
                <button key={crm.value} onClick={() => handlePush(crm.value)} disabled={pushToCrmMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: crm.color }}>
                    {pushingPlatform === crm.value && pushToCrmMutation.isPending
                      ? <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      : <Upload className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>{crm.label}</p>
                    {crm.value === "standalone" && <p className="font-archivo text-xs" style={{ color: "var(--muted)" }}>No external push needed</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <h3 className="font-anton text-lg mb-2" style={{ color: "var(--black)" }}>REMOVE OWNER?</h3>
            <p className="font-archivo text-sm mb-6" style={{ color: "var(--muted)" }}>This will remove the owner record and all property links. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 fxd-btn" style={{ background: "var(--cream)", color: "var(--black)" }}>Cancel</button>
              <button onClick={() => deleteMutation.mutate({ id: deleteConfirm })} className="flex-1 fxd-btn" style={{ background: "#ef4444", color: "white" }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit owner form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "white", maxHeight: "90vh" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--black)" }}>
              <h3 className="font-anton text-lg text-white" style={{ letterSpacing: "-0.01em" }}>{editingId ? "EDIT OWNER" : "ADD OWNER"}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 130px)" }}>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. David Thornton"
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Entity Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["individual", "company", "trust", "partnership"] as EntityType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, entityType: t }))}
                      className="px-3 py-2 rounded-xl font-archivo text-sm font-semibold transition-all"
                      style={{ background: form.entityType === t ? "var(--black)" : "var(--cream)", color: form.entityType === t ? "white" : "var(--black)", border: `1.5px solid ${form.entityType === t ? "var(--black)" : "rgba(0,0,0,0.1)"}` }}>
                      {ENTITY_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              {(form.entityType === "company" || form.entityType === "trust") && (
                <div>
                  <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>{form.entityType === "trust" ? "Trust Name" : "Company Name"}</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
                </div>
              )}
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="owner@example.com"
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="021 000 0000"
                    className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
                </div>
                <div>
                  <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Alt Phone</label>
                  <input value={form.alternatePhone} onChange={e => setForm(f => ({ ...f, alternatePhone: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
                </div>
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Mailing Address</label>
                <input value={form.mailingAddress} onChange={e => setForm(f => ({ ...f, mailingAddress: e.target.value }))} placeholder="PO Box or street address"
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Preferred Contact</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["email", "phone", "sms", "portal"] as PreferredContact[]).map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, preferredContact: c }))}
                      className="px-3 py-2 rounded-xl font-archivo text-sm font-semibold transition-all"
                      style={{ background: form.preferredContact === c ? "var(--pink)" : "var(--cream)", color: form.preferredContact === c ? "white" : "var(--black)", border: `1.5px solid ${form.preferredContact === c ? "var(--pink)" : "rgba(0,0,0,0.1)"}` }}>
                      {CONTACT_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Report Frequency</label>
                <div className="space-y-2">
                  {(["after_each_inspection", "monthly", "quarterly"] as ReportFrequency[]).map(f => (
                    <button key={f} onClick={() => setForm(fm => ({ ...fm, reportFrequency: f }))}
                      className="w-full px-3 py-2 rounded-xl font-archivo text-sm font-semibold text-left transition-all"
                      style={{ background: form.reportFrequency === f ? "var(--black)" : "var(--cream)", color: form.reportFrequency === f ? "white" : "var(--black)", border: `1.5px solid ${form.reportFrequency === f ? "var(--black)" : "rgba(0,0,0,0.1)"}` }}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none resize-none"
                  style={{ background: "var(--cream)", border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--black)" }} />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: "1.5px solid rgba(0,0,0,0.08)" }}>
              <button onClick={() => setShowForm(false)} className="flex-1 fxd-btn" style={{ background: "var(--cream)", color: "var(--black)" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 fxd-btn fxd-btn-pink flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {editingId ? "Save Changes" : "Add Owner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
'''

with open('/home/ubuntu/inspect360/client/src/pages/Owners.tsx', 'w') as f:
    f.write(content)
print("Done")
