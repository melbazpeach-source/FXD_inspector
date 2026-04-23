import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2, Mail, Phone, Plus, Pencil, Trash2, User, Users,
  ChevronRight, X, Check, Briefcase, Home, Bell, Eye,
} from "lucide-react";

type EntityType = "individual" | "company" | "trust" | "partnership";
type PreferredContact = "email" | "phone" | "sms" | "portal";
type ReportFrequency = "after_each_inspection" | "monthly" | "quarterly";

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

  const { data: owners = [], refetch } = trpc.owners.list.useQuery();
  const { data: allProperties = [] } = trpc.properties.list.useQuery();
  const { data: selectedOwnerData } = trpc.owners.get.useQuery(
    { id: selectedOwner! },
    { enabled: !!selectedOwner }
  );

  const createOwner = trpc.owners.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm(EMPTY_FORM); toast.success("Owner added"); },
    onError: (e) => toast.error(e.message),
  });

  const updateOwner = trpc.owners.update.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); toast.success("Owner updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteOwner = trpc.owners.delete.useMutation({
    onSuccess: () => { refetch(); setDeleteConfirm(null); if (selectedOwner === deleteConfirm) setSelectedOwner(null); toast.success("Owner removed"); },
    onError: (e) => toast.error(e.message),
  });

  const linkProperty = trpc.owners.linkProperty.useMutation({
    onSuccess: () => { refetch(); if (selectedOwner) trpc.useUtils().owners.get.invalidate({ id: selectedOwner }); },
  });

  const unlinkProperty = trpc.owners.unlinkProperty.useMutation({
    onSuccess: () => { refetch(); if (selectedOwner) trpc.useUtils().owners.get.invalidate({ id: selectedOwner }); },
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(owner: typeof owners[0]) {
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
      propertyIds: owner.properties.map((p: { propertyId: number }) => p.propertyId),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateOwner.mutate({ id: editingId, ...form });
    } else {
      createOwner.mutate(form);
    }
  }

  const toggleProperty = (pid: number) => {
    setForm(f => ({
      ...f,
      propertyIds: f.propertyIds.includes(pid)
        ? f.propertyIds.filter(id => id !== pid)
        : [...f.propertyIds, pid],
    }));
  };

  const activeOwner = selectedOwner ? owners.find(o => o.id === selectedOwner) : null;

  return (
    <DashboardLayout title="Owners">
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 0px)" }}>
        {/* Left panel — owner list */}
        <div
          className="flex flex-col border-r flex-shrink-0"
          style={{ width: 320, borderColor: "rgba(0,0,0,0.08)", background: "var(--cream)" }}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>
                OWNERS
              </h1>
              <p className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)", letterSpacing: "0.04em" }}>
                {owners.length} landlord{owners.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            <button
              onClick={openCreate}
              className="fxd-btn fxd-btn-pink"
              style={{ padding: "6px 12px", fontSize: 11 }}
            >
              <Plus size={12} />
              ADD
            </button>
          </div>

          {/* Owner list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {owners.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
                <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>
                  No owners yet. Add your first landlord to get started.
                </p>
              </div>
            ) : (
              owners.map(owner => {
                const Icon = ENTITY_ICONS[(owner.entityType as EntityType) || "individual"];
                const isActive = selectedOwner === owner.id;
                return (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedOwner(isActive ? null : owner.id)}
                    className="w-full text-left rounded-sm mb-1 px-3 py-3 transition-all duration-100"
                    style={{
                      background: isActive ? "var(--black)" : "transparent",
                      border: isActive ? "none" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isActive ? "var(--pink)" : "rgba(0,0,0,0.06)" }}
                      >
                        <Icon size={14} style={{ color: isActive ? "white" : "var(--black)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-archivo font-semibold text-sm truncate"
                          style={{ color: isActive ? "white" : "var(--black)" }}
                        >
                          {owner.name}
                        </div>
                        <div
                          className="font-archivo text-xs truncate mt-0.5"
                          style={{ color: isActive ? "rgba(255,255,255,0.5)" : "var(--muted)" }}
                        >
                          {ENTITY_LABELS[(owner.entityType as EntityType) || "individual"]}
                          {owner.properties.length > 0 && ` · ${owner.properties.length} propert${owner.properties.length !== 1 ? "ies" : "y"}`}
                        </div>
                      </div>
                      <ChevronRight size={12} style={{ color: isActive ? "rgba(255,255,255,0.4)" : "var(--muted)", flexShrink: 0 }} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — owner detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedOwner ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-4" style={{ color: "rgba(0,0,0,0.12)" }} />
                <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>
                  Select an owner to view their profile
                </p>
              </div>
            </div>
          ) : activeOwner && (
            <div className="p-6 max-w-3xl">
              {/* Owner header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--pink)" }}
                  >
                    {(() => {
                      const Icon = ENTITY_ICONS[(activeOwner.entityType as EntityType) || "individual"];
                      return <Icon size={22} style={{ color: "white" }} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "-0.01em" }}>
                      {activeOwner.name.toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="font-archivo text-xs px-2 py-0.5 rounded-sm"
                        style={{ background: "var(--yellow)", color: "var(--black)", letterSpacing: "0.08em", textTransform: "uppercase" }}
                      >
                        {ENTITY_LABELS[(activeOwner.entityType as EntityType) || "individual"]}
                      </span>
                      {activeOwner.companyName && (
                        <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                          {activeOwner.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(activeOwner)}
                    className="fxd-btn"
                    style={{ padding: "6px 12px", fontSize: 11, background: "rgba(0,0,0,0.06)", color: "var(--black)" }}
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(activeOwner.id)}
                    className="fxd-btn"
                    style={{ padding: "6px 12px", fontSize: 11, background: "rgba(220,38,38,0.08)", color: "#dc2626" }}
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>
              </div>

              {/* Contact details */}
              <div
                className="rounded-sm p-4 mb-4"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <h3 className="font-archivo font-semibold text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                  Contact Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {activeOwner.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} style={{ color: "var(--pink)", flexShrink: 0 }} />
                      <span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.email}</span>
                    </div>
                  )}
                  {activeOwner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} style={{ color: "var(--pink)", flexShrink: 0 }} />
                      <span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.phone}</span>
                    </div>
                  )}
                  {activeOwner.mailingAddress && (
                    <div className="flex items-start gap-2 col-span-2">
                      <Home size={13} style={{ color: "var(--pink)", flexShrink: 0, marginTop: 2 }} />
                      <span className="font-archivo text-sm" style={{ color: "var(--black)" }}>{activeOwner.mailingAddress}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <div>
                    <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>Preferred contact: </span>
                    <span className="font-archivo text-xs font-semibold" style={{ color: "var(--black)" }}>
                      {CONTACT_LABELS[(activeOwner.preferredContact as PreferredContact) || "email"]}
                    </span>
                  </div>
                  <div>
                    <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>Reports: </span>
                    <span className="font-archivo text-xs font-semibold" style={{ color: "var(--black)" }}>
                      {FREQ_LABELS[(activeOwner.reportFrequency as ReportFrequency) || "after_each_inspection"]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Properties */}
              <div
                className="rounded-sm p-4 mb-4"
                style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-archivo font-semibold text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Properties ({activeOwner.properties.length})
                  </h3>
                </div>
                {activeOwner.properties.length === 0 ? (
                  <p className="font-archivo text-sm" style={{ color: "var(--muted)" }}>No properties linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeOwner.properties.map((p: { propertyId: number; address: string; suburb?: string | null; city?: string | null; isPrimary?: boolean | null }) => (
                      <div
                        key={p.propertyId}
                        className="flex items-center justify-between px-3 py-2 rounded-sm"
                        style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={13} style={{ color: "var(--pink)" }} />
                          <span className="font-archivo text-sm" style={{ color: "var(--black)" }}>
                            {p.address}
                          </span>
                          {p.suburb && (
                            <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                              {p.suburb}{p.city ? `, ${p.city}` : ""}
                            </span>
                          )}
                          {p.isPrimary && (
                            <span
                              className="font-archivo text-xs px-1.5 py-0.5 rounded-sm"
                              style={{ background: "var(--yellow)", color: "var(--black)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}
                            >
                              Primary
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => unlinkProperty.mutate({ ownerId: activeOwner.id, propertyId: p.propertyId })}
                          className="p-1 rounded-sm transition-colors"
                          style={{ color: "var(--muted)" }}
                          title="Unlink property"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Link additional properties */}
                {allProperties.filter((p: { id: number }) => !activeOwner.properties.some((op: { propertyId: number }) => op.propertyId === p.id)).length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <p className="font-archivo text-xs mb-2" style={{ color: "var(--muted)" }}>Link additional property:</p>
                    <div className="flex flex-wrap gap-2">
                      {allProperties
                        .filter((p: { id: number }) => !activeOwner.properties.some((op: { propertyId: number }) => op.propertyId === p.id))
                        .map((p: { id: number; address: string; suburb?: string | null; city?: string | null }) => (
                          <button
                            key={p.id}
                            onClick={() => linkProperty.mutate({ ownerId: activeOwner.id, propertyId: p.id })}
                            className="font-archivo text-xs px-2 py-1 rounded-sm transition-colors"
                            style={{ background: "rgba(0,0,0,0.04)", color: "var(--black)", border: "1px dashed rgba(0,0,0,0.12)" }}
                          >
                            <Plus size={10} className="inline mr-1" />
                            {p.address}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {activeOwner.notes && (
                <div
                  className="rounded-sm p-4 mb-4"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <h3 className="font-archivo font-semibold text-xs uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                    Notes
                  </h3>
                  <p className="font-archivo text-sm" style={{ color: "var(--black)", whiteSpace: "pre-wrap" }}>
                    {activeOwner.notes}
                  </p>
                </div>
              )}

              {/* Notifications */}
              {selectedOwnerData?.notifications && selectedOwnerData.notifications.length > 0 && (
                <div
                  className="rounded-sm p-4"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <h3 className="font-archivo font-semibold text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                    Recent Notifications
                  </h3>
                  <div className="space-y-2">
                    {selectedOwnerData.notifications.slice(0, 5).map((n: {
                      id: number; title: string; type: string; approvalStatus?: string | null;
                      estimatedCost?: string | null; createdAt: Date;
                    }) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-3 py-2 rounded-sm"
                        style={{ background: "rgba(0,0,0,0.02)" }}
                      >
                        <Bell size={13} style={{ color: "var(--pink)", flexShrink: 0, marginTop: 2 }} />
                        <div className="flex-1">
                          <div className="font-archivo text-sm font-semibold" style={{ color: "var(--black)" }}>
                            {n.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-archivo text-xs" style={{ color: "var(--muted)" }}>
                              {n.type.replace(/_/g, " ")}
                            </span>
                            {n.estimatedCost && (
                              <span className="font-archivo text-xs" style={{ color: "var(--black)" }}>
                                · Est. {n.estimatedCost}
                              </span>
                            )}
                            {n.approvalStatus && n.approvalStatus !== "pending" && (
                              <span
                                className="font-archivo text-xs px-1.5 py-0.5 rounded-sm"
                                style={{
                                  background: n.approvalStatus === "approved" ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
                                  color: n.approvalStatus === "approved" ? "#16a34a" : "#854d0e",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {n.approvalStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="rounded-sm shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ background: "var(--cream)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between flex-shrink-0"
              style={{ background: "var(--black)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h2 className="font-anton text-lg" style={{ color: "white", letterSpacing: "0.02em" }}>
                {editingId ? "EDIT OWNER" : "ADD OWNER"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}>
                <X size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                  Full Name / Entity Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. John Smith or Smith Family Trust"
                  className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                />
              </div>

              {/* Entity type */}
              <div>
                <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                  Entity Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["individual", "company", "trust", "partnership"] as EntityType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, entityType: type }))}
                      className="py-2 rounded-sm font-archivo text-xs transition-all"
                      style={{
                        background: form.entityType === type ? "var(--black)" : "white",
                        color: form.entityType === type ? "white" : "var(--black)",
                        border: `1px solid ${form.entityType === type ? "var(--black)" : "rgba(0,0,0,0.12)"}`,
                        textTransform: "capitalize",
                      }}
                    >
                      {ENTITY_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company name (if applicable) */}
              {(form.entityType === "company" || form.entityType === "trust" || form.entityType === "partnership") && (
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                    {form.entityType === "trust" ? "Trust Name" : "Company / Trading Name"}
                  </label>
                  <input
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. Smith Holdings Ltd"
                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                  />
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="owner@email.com"
                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                  />
                </div>
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="021 000 0000"
                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                  />
                </div>
              </div>

              {/* Mailing address */}
              <div>
                <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Mailing Address</label>
                <input
                  value={form.mailingAddress}
                  onChange={e => setForm(f => ({ ...f, mailingAddress: e.target.value }))}
                  placeholder="PO Box 123, Wellington 6011"
                  className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                />
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Preferred Contact</label>
                  <select
                    value={form.preferredContact}
                    onChange={e => setForm(f => ({ ...f, preferredContact: e.target.value as PreferredContact }))}
                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                  >
                    {(Object.entries(CONTACT_LABELS) as [PreferredContact, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Report Frequency</label>
                  <select
                    value={form.reportFrequency}
                    onChange={e => setForm(f => ({ ...f, reportFrequency: e.target.value as ReportFrequency }))}
                    className="w-full px-3 py-2 rounded-sm font-archivo text-sm"
                    style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                  >
                    {(Object.entries(FREQ_LABELS) as [ReportFrequency, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link properties */}
              {allProperties.length > 0 && (
                <div>
                  <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>
                    Link Properties
                  </label>
                  <div className="space-y-1.5">
                    {allProperties.map((p: { id: number; address: string; suburb?: string | null }) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProperty(p.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all"
                        style={{
                          background: form.propertyIds.includes(p.id) ? "var(--black)" : "white",
                          border: `1px solid ${form.propertyIds.includes(p.id) ? "var(--black)" : "rgba(0,0,0,0.1)"}`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0"
                          style={{ background: form.propertyIds.includes(p.id) ? "var(--pink)" : "rgba(0,0,0,0.06)" }}
                        >
                          {form.propertyIds.includes(p.id) && <Check size={10} style={{ color: "white" }} />}
                        </div>
                        <Building2 size={12} style={{ color: form.propertyIds.includes(p.id) ? "rgba(255,255,255,0.6)" : "var(--muted)" }} />
                        <span
                          className="font-archivo text-sm"
                          style={{ color: form.propertyIds.includes(p.id) ? "white" : "var(--black)" }}
                        >
                          {p.address}{p.suburb ? `, ${p.suburb}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-archivo text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--muted)" }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any additional notes about this owner..."
                  className="w-full px-3 py-2 rounded-sm font-archivo text-sm resize-none"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.12)", color: "var(--black)" }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                  className="flex-1 py-2.5 rounded-sm font-archivo text-sm"
                  style={{ background: "rgba(0,0,0,0.06)", color: "var(--black)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOwner.isPending || updateOwner.isPending}
                  className="flex-1 py-2.5 rounded-sm font-archivo text-sm font-semibold"
                  style={{ background: "var(--pink)", color: "white" }}
                >
                  {createOwner.isPending || updateOwner.isPending ? "Saving…" : editingId ? "Save Changes" : "Add Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-sm shadow-2xl w-full max-w-sm mx-4 p-6" style={{ background: "var(--cream)" }}>
            <h3 className="font-anton text-lg mb-2" style={{ color: "var(--black)" }}>REMOVE OWNER?</h3>
            <p className="font-archivo text-sm mb-6" style={{ color: "var(--muted)" }}>
              This will remove the owner record and unlink all their properties. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-sm font-archivo text-sm"
                style={{ background: "rgba(0,0,0,0.06)", color: "var(--black)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOwner.mutate({ id: deleteConfirm })}
                disabled={deleteOwner.isPending}
                className="flex-1 py-2.5 rounded-sm font-archivo text-sm font-semibold"
                style={{ background: "#dc2626", color: "white" }}
              >
                {deleteOwner.isPending ? "Removing…" : "Remove Owner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
