import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Package, Plus, Building2, ChevronRight, X, Check,
  Pencil, Trash2, AlertCircle, CheckCircle2, Clock, Minus,
  ShoppingCart, ArrowLeft,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  whiteware: "Whiteware",
  furniture: "Furniture",
  appliances: "Appliances",
  tools_equipment: "Tools & Equipment",
  soft_furnishings: "Soft Furnishings",
  electronics: "Electronics",
  other: "Other",
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",      color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  excellent: { label: "Excellent",color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  good:      { label: "Good",     color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  fair:      { label: "Fair",     color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  poor:      { label: "Poor",     color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  damaged:   { label: "Damaged",  color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
  missing:   { label: "Missing",  color: "#9ca3af", bg: "rgba(156,163,175,0.1)"},
};

type InventoryCategory = "whiteware"|"furniture"|"appliances"|"tools_equipment"|"soft_furnishings"|"electronics"|"other";
type InventoryCondition = "new"|"excellent"|"good"|"fair"|"poor"|"damaged"|"missing";

interface ItemForm {
  name: string; category: InventoryCategory; quantity: number;
  condition: InventoryCondition; description: string; serialNumber: string; notes: string;
}
const EMPTY: ItemForm = { name:"", category:"furniture", quantity:1, condition:"good", description:"", serialNumber:"", notes:"" };

export default function Inventory() {
  const [selPropId, setSelPropId] = useState<number|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY);
  const [delConfirm, setDelConfirm] = useState<number|null>(null);
  const [tab, setTab] = useState<"inventory"|"shopping">("inventory");
  const [detail, setDetail] = useState(false);

  const { data: props = [] } = trpc.properties.list.useQuery();
  const { data: items = [], refetch } = trpc.chattels.listInventory.useQuery(
    { propertyId: selPropId! }, { enabled: !!selPropId }
  );

  const createM = trpc.chattels.createInventoryItem.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setForm(EMPTY); toast.success("Item added"); },
    onError: e => toast.error(e.message),
  });
  const updateM = trpc.chattels.updateInventoryItem.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); setEditId(null); setForm(EMPTY); toast.success("Updated"); },
    onError: e => toast.error(e.message),
  });
  const deleteM = trpc.chattels.deleteInventoryItem.useMutation({
    onSuccess: () => { refetch(); setDelConfirm(null); toast.success("Removed"); },
    onError: e => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!selPropId || !form.name) return;
    if (editId) updateM.mutate({ id: editId, condition: form.condition, notes: form.notes, quantity: form.quantity });
    else createM.mutate({ propertyId: selPropId, ...form });
  };

  const openEdit = (item: (typeof items)[0]) => {
    setEditId(item.id);
    setForm({ name: item.name, category: item.category as InventoryCategory, quantity: item.quantity??1,
      condition: (item.condition??"good") as InventoryCondition, description: item.description??"",
      serialNumber: item.serialNumber??"", notes: item.notes??"" });
    setShowForm(true);
  };

  const selProp = props.find(p => p.id === selPropId);
  const grouped = items.reduce((acc, i) => { (acc[i.category]??=[]).push(i); return acc; }, {} as Record<string,(typeof items)>);
  const needsAttention = items.filter(i => ["poor","damaged","missing"].includes(i.condition??"good"));
  const summary = {
    good: items.filter(i => ["new","excellent","good"].includes(i.condition??"good")).length,
    fair: items.filter(i => i.condition==="fair").length,
    action: items.filter(i => ["poor","damaged","missing"].includes(i.condition??"good")).length,
  };

  return (
    <DashboardLayout title="Inventory">
      <div className="flex h-full" style={{ minHeight:"calc(100vh - 56px)" }}>
        {/* Left panel */}
        <div className={`flex-col border-r flex-shrink-0 w-full lg:w-72 ${detail?"hidden lg:flex":"flex"}`}
          style={{ borderColor:"rgba(0,0,0,0.08)", background:"var(--cream)" }}>
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--black)" }}>
                <Package className="w-4 h-4" style={{ color:"var(--yellow)" }} />
              </div>
              <h1 className="font-anton text-2xl" style={{ color:"var(--black)", letterSpacing:"-0.01em" }}>INVENTORY</h1>
            </div>
            <p className="font-archivo text-xs" style={{ color:"var(--muted)" }}>Furnished tenancy item register</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {props.map(p => {
              const active = selPropId===p.id;
              return (
                <button key={p.id} onClick={() => { setSelPropId(p.id); setDetail(true); }}
                  className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                  style={{ background:active?"var(--black)":"white", border:`1.5px solid ${active?"var(--black)":"rgba(0,0,0,0.08)"}` }}>
                  <Building2 className="w-4 h-4 flex-shrink-0" style={{ color:active?"var(--yellow)":"var(--pink)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-archivo text-sm font-semibold truncate" style={{ color:active?"white":"var(--black)" }}>{p.address}</p>
                    {p.suburb && <p className="font-archivo text-xs truncate" style={{ color:active?"rgba(255,255,255,0.6)":"var(--muted)" }}>{p.suburb}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:active?"rgba(255,255,255,0.5)":"var(--muted)" }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className={`flex-1 overflow-y-auto ${detail?"flex flex-col":"hidden lg:flex lg:flex-col"}`} style={{ background:"var(--cream)" }}>
          {!selPropId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-4" style={{ color:"rgba(0,0,0,0.1)" }} />
                <p className="font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>Select a property</p>
                <p className="font-archivo text-xs mt-1" style={{ color:"var(--muted)" }}>Choose a property to view its inventory</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
              <button onClick={() => setDetail(false)} className="lg:hidden flex items-center gap-2 mb-4 font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>
                <ArrowLeft className="w-4 h-4" /> All Properties
              </button>
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-anton text-xl" style={{ color:"var(--black)", letterSpacing:"-0.01em" }}>{selProp?.address}</h2>
                  <p className="font-archivo text-xs mt-0.5" style={{ color:"var(--muted)" }}>{items.length} item{items.length!==1?"s":""} registered</p>
                </div>
                <button onClick={() => { setEditId(null); setForm(EMPTY); setShowForm(true); }}
                  className="fxd-btn fxd-btn-pink flex items-center gap-2" style={{ fontSize:13, padding:"8px 16px" }}>
                  <Plus className="w-4 h-4" /> ADD ITEM
                </button>
              </div>

              {items.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{l:"Good",c:summary.good,col:"#22c55e",bg:"rgba(34,197,94,0.08)"},{l:"Fair",c:summary.fair,col:"#d97706",bg:"rgba(217,119,6,0.08)"},{l:"Action",c:summary.action,col:"#ef4444",bg:"rgba(239,68,68,0.08)"}].map(s=>(
                    <div key={s.l} className="rounded-xl p-3 text-center" style={{ background:s.bg, border:`1.5px solid ${s.col}20` }}>
                      <p className="font-anton text-2xl" style={{ color:s.col }}>{s.c}</p>
                      <p className="font-archivo text-xs" style={{ color:"var(--muted)" }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-0 mb-5 border-b" style={{ borderColor:"rgba(0,0,0,0.08)" }}>
                {[{k:"inventory" as const,l:`All Items (${items.length})`},{k:"shopping" as const,l:`Needs Attention (${needsAttention.length})`}].map(t=>(
                  <button key={t.k} onClick={()=>setTab(t.k)}
                    className="font-archivo text-xs px-4 py-2.5 transition-colors whitespace-nowrap"
                    style={{ borderBottom:tab===t.k?"2px solid var(--pink)":"2px solid transparent", color:tab===t.k?"var(--pink)":"var(--muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:-1 }}>
                    {t.l}
                  </button>
                ))}
              </div>

              {tab==="inventory" && (
                items.length===0 ? (
                  <div className="text-center py-16 rounded-2xl" style={{ background:"white", border:"1.5px dashed rgba(0,0,0,0.1)" }}>
                    <Package className="w-10 h-10 mx-auto mb-3" style={{ color:"rgba(0,0,0,0.1)" }} />
                    <p className="font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>No items yet</p>
                    <p className="font-archivo text-xs mt-1" style={{ color:"var(--muted)" }}>Add items to start tracking this property's inventory</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([cat, catItems]) => (
                      <div key={cat}>
                        <h3 className="font-archivo text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--muted)" }}>
                          {CATEGORY_LABELS[cat]||cat} ({catItems.length})
                        </h3>
                        <div className="space-y-2">
                          {catItems.map(item => {
                            const cond = CONDITION_CONFIG[item.condition??"good"]??CONDITION_CONFIG.good;
                            return (
                              <div key={item.id} className="rounded-xl p-4 flex items-start gap-3"
                                style={{ background:"white", border:"1.5px solid rgba(0,0,0,0.06)" }}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>{item.name}</p>
                                    {(item.quantity??1)>1 && <span className="font-archivo text-xs px-2 py-0.5 rounded-full" style={{ background:"var(--cream)", color:"var(--muted)" }}>×{item.quantity}</span>}
                                    <span className="font-archivo text-xs px-2 py-0.5 rounded-full" style={{ background:cond.bg, color:cond.color }}>{cond.label}</span>
                                  </div>
                                  {item.description && <p className="font-archivo text-xs mt-1" style={{ color:"var(--muted)" }}>{item.description}</p>}
                                  {item.serialNumber && <p className="font-archivo text-xs mt-0.5" style={{ color:"var(--muted)" }}>S/N: {item.serialNumber}</p>}
                                  {item.notes && <p className="font-archivo text-xs mt-0.5 italic" style={{ color:"var(--muted)" }}>{item.notes}</p>}
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <button onClick={()=>openEdit(item)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"var(--cream)" }}>
                                    <Pencil className="w-3 h-3" style={{ color:"var(--black)" }} />
                                  </button>
                                  <button onClick={()=>setDelConfirm(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"rgba(239,68,68,0.08)" }}>
                                    <Trash2 className="w-3 h-3" style={{ color:"#ef4444" }} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab==="shopping" && (
                needsAttention.length===0 ? (
                  <div className="text-center py-16 rounded-2xl" style={{ background:"white", border:"1.5px dashed rgba(0,0,0,0.1)" }}>
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color:"#22c55e" }} />
                    <p className="font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>All items in good condition</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {needsAttention.map(item => {
                      const cond = CONDITION_CONFIG[item.condition??"poor"]??CONDITION_CONFIG.poor;
                      return (
                        <div key={item.id} className="rounded-xl p-4 flex items-center gap-3"
                          style={{ background:"white", border:`1.5px solid ${cond.color}30` }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:cond.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-archivo text-sm font-semibold" style={{ color:"var(--black)" }}>{item.name}</p>
                            <p className="font-archivo text-xs" style={{ color:cond.color }}>{cond.label} · {CATEGORY_LABELS[item.category]}</p>
                          </div>
                          <ShoppingCart className="w-4 h-4 flex-shrink-0" style={{ color:"var(--muted)" }} />
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background:"white", maxHeight:"90vh" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background:"var(--black)" }}>
              <h3 className="font-anton text-lg text-white">{editId?"EDIT ITEM":"ADD ITEM"}</h3>
              <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight:"calc(90vh - 130px)" }}>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Item Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Sofa, Washing Machine"
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                  style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)", color:"var(--black)" }} />
              </div>
              {!editId && (
                <div>
                  <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(CATEGORY_LABELS) as [InventoryCategory,string][]).map(([v,l])=>(
                      <button key={v} onClick={()=>setForm(f=>({...f,category:v}))}
                        className="px-3 py-2 rounded-xl font-archivo text-xs font-semibold transition-all text-left"
                        style={{ background:form.category===v?"var(--black)":"var(--cream)", color:form.category===v?"white":"var(--black)", border:`1.5px solid ${form.category===v?"var(--black)":"rgba(0,0,0,0.1)"}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["new","excellent","good","fair","poor","damaged","missing"] as InventoryCondition[]).map(c=>(
                    <button key={c} onClick={()=>setForm(f=>({...f,condition:c}))}
                      className="px-3 py-2 rounded-xl font-archivo text-xs font-semibold transition-all text-left"
                      style={{ background:form.condition===c?CONDITION_CONFIG[c].bg:"var(--cream)", color:form.condition===c?CONDITION_CONFIG[c].color:"var(--black)", border:`1.5px solid ${form.condition===c?CONDITION_CONFIG[c].color:"rgba(0,0,0,0.1)"}` }}>
                      {CONDITION_CONFIG[c].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setForm(f=>({...f,quantity:Math.max(1,f.quantity-1)}))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)" }}><Minus className="w-4 h-4" style={{ color:"var(--black)" }} /></button>
                  <span className="font-archivo text-lg font-semibold w-8 text-center" style={{ color:"var(--black)" }}>{form.quantity}</span>
                  <button onClick={()=>setForm(f=>({...f,quantity:f.quantity+1}))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)" }}><Plus className="w-4 h-4" style={{ color:"var(--black)" }} /></button>
                </div>
              </div>
              {!editId && (
                <>
                  <div>
                    <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Description</label>
                    <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional"
                      className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                      style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)", color:"var(--black)" }} />
                  </div>
                  <div>
                    <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Serial Number</label>
                    <input value={form.serialNumber} onChange={e=>setForm(f=>({...f,serialNumber:e.target.value}))} placeholder="Optional"
                      className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none"
                      style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)", color:"var(--black)" }} />
                  </div>
                </>
              )}
              <div>
                <label className="font-archivo text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color:"var(--muted)" }}>Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
                  className="w-full rounded-xl px-4 py-2.5 font-archivo text-sm outline-none resize-none"
                  style={{ background:"var(--cream)", border:"1.5px solid rgba(0,0,0,0.1)", color:"var(--black)" }} />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop:"1.5px solid rgba(0,0,0,0.08)" }}>
              <button onClick={()=>setShowForm(false)} className="flex-1 fxd-btn" style={{ background:"var(--cream)", color:"var(--black)" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!form.name||createM.isPending||updateM.isPending}
                className="flex-1 fxd-btn fxd-btn-pink flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {editId?"Save Changes":"Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background:"white" }}>
            <h3 className="font-anton text-lg mb-2" style={{ color:"var(--black)" }}>REMOVE ITEM?</h3>
            <p className="font-archivo text-sm mb-6" style={{ color:"var(--muted)" }}>This will permanently remove the item from the inventory.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDelConfirm(null)} className="flex-1 fxd-btn" style={{ background:"var(--cream)", color:"var(--black)" }}>Cancel</button>
              <button onClick={()=>deleteM.mutate({id:delConfirm})} className="flex-1 fxd-btn" style={{ background:"#ef4444", color:"white" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
