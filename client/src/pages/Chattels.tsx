import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus, Wrench, CheckCircle2, AlertCircle, XCircle, Building2,
  ChevronRight, Search, Filter, Zap, Edit2, Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CHATTEL_CATEGORIES = [
  { label: "Kitchen Appliances", value: "kitchen" },
  { label: "Heating & Cooling", value: "heating_cooling" },
  { label: "Ventilation", value: "ventilation" },
  { label: "Hot Water", value: "hot_water" },
  { label: "Floor Coverings", value: "floor_coverings" },
  { label: "Window Treatments", value: "window_treatments" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Other Fixed Items", value: "other" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New", color: "#6366f1" },
  { value: "excellent", label: "Excellent", color: "#10b981" },
  { value: "good", label: "Good", color: "#22c55e" },
  { value: "fair", label: "Fair", color: "var(--yellow-warm)" },
  { value: "poor", label: "Poor", color: "var(--pink)" },
];

type NewChattel = {
  name: string;
  category: string;
  make: string;
  model: string;
  serialNumber: string;
  condition: string;
  notes: string;
  isHealthyHomesItem: boolean;
};

export default function Chattels() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newChattel, setNewChattel] = useState<NewChattel>({
    name: "",
    category: "kitchen",
    make: "",
    model: "",
    serialNumber: "",
    condition: "good",
    notes: "",
    isHealthyHomesItem: false,
  });

  const propertiesQuery = trpc.properties.list.useQuery();
  const chattelsQuery = trpc.chattels.listByProperty.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const addChattelMutation = trpc.chattels.create.useMutation({
    onSuccess: () => {
      chattelsQuery.refetch();
      setShowAddDialog(false);
      toast.success("Chattel added to register");
      setNewChattel({ name: "", category: "Kitchen Appliances", make: "", model: "", serialNumber: "", condition: "good", notes: "", isHealthyHomesItem: false });
    },
    onError: () => toast.error("Failed to add chattel"),
  });

  const chattels = (chattelsQuery.data as any[]) || [];
  const filteredChattels = chattels.filter((c: any) => {
    const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getConditionInfo = (condition: string) => {
    return CONDITION_OPTIONS.find(c => c.value === condition) || CONDITION_OPTIONS[1];
  };

  const handleAddChattel = () => {
    if (!newChattel.name || !selectedPropertyId) return;
    addChattelMutation.mutate({
      propertyId: selectedPropertyId,
      name: newChattel.name,
      category: newChattel.category as any,
      makeModel: newChattel.make && newChattel.model ? `${newChattel.make} ${newChattel.model}` : (newChattel.make || newChattel.model || undefined),
      serialNumber: newChattel.serialNumber || undefined,
      conditionAtRegistration: newChattel.condition as any,
      notes: newChattel.notes || undefined,
      isHealthyHomesItem: newChattel.isHealthyHomesItem,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <Wrench size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                CHATTELS
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Fixed items register — always present regardless of tenancy type
              </p>
            </div>
          </div>
          {selectedPropertyId && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 rounded-sm font-archivo text-xs"
              style={{ background: "var(--black)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <Plus size={14} />
              Add Chattel
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-sm p-4 mb-6 flex items-start gap-3" style={{ background: "var(--black)", color: "var(--white)" }}>
        <Wrench size={16} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--yellow)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            What Are Chattels?
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            Chattels are fixed items that must always be present in the property regardless of tenancy type — oven, range hood, heat pump, extractor fans, floor coverings, window treatments. They are checked at every inspection and their condition is tracked over time. Healthy Homes items (heat pump, fans) are flagged separately.
          </p>
        </div>
      </div>

      {/* Property selector */}
      {!selectedPropertyId ? (
        <div>
          <h2 className="font-archivo text-sm mb-4" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Select Property
          </h2>
          <div className="grid gap-3">
            {(propertiesQuery.data as any[])?.map((prop: any, _idx: number) => (
              <button
                key={prop.id}
                onClick={() => setSelectedPropertyId(prop.id)}
                className="flex items-center gap-4 p-4 rounded-sm border text-left transition-all hover:shadow-md"
                style={{ background: "var(--white)", borderColor: "var(--border)" }}
              >
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "var(--cream)" }}>
                  <Building2 size={18} style={{ color: "var(--muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-archivo text-sm font-bold truncate" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                    {prop.address}
                  </div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>{prop.suburb}, {prop.city}</div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted-light)" }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-light)" }} />
              <Input
                placeholder="Search chattels..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 rounded-sm text-sm"
                style={{ background: "var(--white)", border: "1px solid var(--border)" }}
              />
            </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 rounded-sm" style={{ background: "var(--white)", border: "1px solid var(--border)" }}>
                  <Filter size={12} className="mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CHATTEL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Items", value: chattels.length, color: "var(--black)" },
              { label: "Healthy Homes", value: chattels.filter((c: any) => c.isHealthyHomesItem).length, color: "var(--yellow-warm)" },
              { label: "Good Condition", value: chattels.filter((c: any) => ["excellent", "good"].includes(c.condition)).length, color: "#10b981" },
              { label: "Needs Attention", value: chattels.filter((c: any) => ["poor", "end_of_life"].includes(c.condition)).length, color: "var(--pink)" },
            ].map(stat => (
              <div key={stat.label} className="rounded-sm p-3 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                <div className="font-anton text-2xl" style={{ color: stat.color }}>{stat.value}</div>
                <div className="font-archivo text-xs mt-0.5" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Chattels list */}
          {chattelsQuery.isLoading ? (
            <div className="text-center py-12" style={{ color: "var(--muted)" }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--pink)", borderTopColor: "transparent" }} />
              <p className="text-sm">Loading chattels register...</p>
            </div>
          ) : filteredChattels.length === 0 ? (
            <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
              <Wrench size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
              <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No Chattels Registered</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>Add fixed items to this property's register</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                <Plus size={12} className="mr-2" />
                Add First Chattel
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChattels.map((chattel: any, _idx: number) => {
                const condInfo = getConditionInfo(chattel.condition);
                return (
                  <div
                    key={chattel.id}
                    className="flex items-center gap-4 p-4 rounded-sm border"
                    style={{ background: "var(--white)", borderColor: "var(--border)" }}
                  >
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: `${condInfo.color}15` }}>
                      <Wrench size={16} style={{ color: condInfo.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                          {chattel.name}
                        </span>
                        {chattel.isHealthyHomesItem && (
                          <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,212,0,0.15)", color: "var(--yellow-warm)", border: "1px solid rgba(255,212,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Healthy Homes
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
                        <span>{chattel.category}</span>
                        {chattel.make && <span>· {chattel.make} {chattel.model}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className="font-archivo text-xs px-2 py-0.5"
                        style={{
                          background: `${condInfo.color}15`,
                          color: condInfo.color,
                          border: `1px solid ${condInfo.color}30`,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {condInfo.label}
                      </Badge>
                      <button className="p-1.5 rounded-sm hover:bg-gray-100 transition-colors">
                        <Edit2 size={13} style={{ color: "var(--muted-light)" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Chattel Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md" style={{ background: "var(--white)" }}>
          <DialogHeader>
            <DialogTitle className="font-anton text-xl" style={{ color: "var(--black)", letterSpacing: "0.02em" }}>
              ADD CHATTEL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Item Name *</Label>
              <Input
                value={newChattel.name}
                onChange={e => setNewChattel(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Heat Pump, Oven, Range Hood"
                className="rounded-sm"
              />
            </div>
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Category</Label>
              <Select value={newChattel.category} onValueChange={v => setNewChattel(p => ({ ...p, category: v }))}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHATTEL_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}

                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Make</Label>
                <Input value={newChattel.make} onChange={e => setNewChattel(p => ({ ...p, make: e.target.value }))} placeholder="e.g. Mitsubishi" className="rounded-sm" />
              </div>
              <div>
                <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Model</Label>
                <Input value={newChattel.model} onChange={e => setNewChattel(p => ({ ...p, model: e.target.value }))} placeholder="e.g. MSZ-AP25VG" className="rounded-sm" />
              </div>
            </div>
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Condition</Label>
              <Select value={newChattel.condition} onValueChange={v => setNewChattel(p => ({ ...p, condition: v }))}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Notes</Label>
              <Textarea value={newChattel.notes} onChange={e => setNewChattel(p => ({ ...p, notes: e.target.value }))} placeholder="Any relevant notes..." className="rounded-sm resize-none" rows={2} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-sm" style={{ background: "rgba(255,212,0,0.08)", border: "1px solid rgba(255,212,0,0.25)" }}>
              <input
                type="checkbox"
                id="healthyHomes"
                checked={newChattel.isHealthyHomesItem}
                onChange={e => setNewChattel(p => ({ ...p, isHealthyHomesItem: e.target.checked }))}
                className="w-4 h-4"
              />
              <label htmlFor="healthyHomes" className="font-archivo text-sm" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                This is a Healthy Homes compliance item
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddChattel}
                disabled={!newChattel.name || addChattelMutation.isPending}
                className="flex-1 rounded-sm font-archivo text-xs"
                style={{ background: "var(--black)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {addChattelMutation.isPending ? "Adding..." : "Add to Register"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-sm font-archivo text-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
