import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Package, ShoppingCart, Plus, Building2, ChevronRight,
  AlertCircle, CheckCircle2, Zap, Minus
} from "lucide-react";

const CONDITION_COLORS: Record<string, string> = {
  new: "#10b981",
  good: "#6366f1",
  fair: "var(--yellow-warm)",
  poor: "var(--pink)",
  damaged: "#ef4444",
};

const CATEGORY_LABELS: Record<string, string> = {
  furniture: "Furniture",
  appliances: "Appliances",
  fixtures: "Fixtures",
  soft_furnishings: "Soft Furnishings",
  white_goods: "White Goods",
  outdoor: "Outdoor",
  other: "Other",
};

export default function Inventory() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "shopping">("inventory");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", category: "furniture", condition: "good",
    quantityRequired: 1, quantityPresent: 1, notes: ""
  });

  const propertiesQuery = trpc.properties.list.useQuery();

  // Placeholder data for UI demonstration
  const inventoryItems: any[] = [];
  const shoppingList = inventoryItems.filter(
    (item: any) => (item.quantityPresent || 0) < (item.quantityRequired || 1)
  );

  const handleAddItem = () => {
    toast.info("Connect to inspection to add inventory items");
    setShowAddForm(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
              <Package size={18} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
                INVENTORY
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Furnished tenancy — appliances and moveable items with quantity tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-sm p-4 mb-6 flex items-start gap-3" style={{ background: "var(--black)", color: "var(--white)" }}>
        <Package size={16} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--yellow)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Furnished Tenancies Only
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            The inventory records all moveable appliances and items provided with a furnished tenancy — fridges, washing machines, furniture, microwaves, lawnmowers, etc. The AI agent auto-generates the inventory list from room photos. You review and confirm quantities. Missing items automatically appear on the Shopping List.
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
            {(propertiesQuery.data as any[])?.map((prop: any) => (
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
                  <div className="font-archivo text-sm font-bold truncate" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>{prop.address}</div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>{prop.suburb}, {prop.city}</div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted-light)" }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-sm" style={{ background: "var(--white)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setActiveTab("inventory")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-archivo text-xs transition-all"
              style={{
                background: activeTab === "inventory" ? "var(--black)" : "transparent",
                color: activeTab === "inventory" ? "var(--yellow)" : "var(--muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Package size={12} />
              Inventory ({inventoryItems.length})
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-archivo text-xs transition-all"
              style={{
                background: activeTab === "shopping" ? "var(--black)" : "transparent",
                color: activeTab === "shopping" ? "var(--yellow)" : "var(--muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <ShoppingCart size={12} />
              Shopping List
              {shoppingList.length > 0 && (
                <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold" style={{ background: "var(--pink)", color: "var(--white)" }}>
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "inventory" && (
            <div>
              {/* Actions bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="font-archivo text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {inventoryItems.length} items recorded
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                    style={{ letterSpacing: "0.08em", textTransform: "uppercase", borderColor: "var(--border)", color: "var(--ink)" }}
                    onClick={() => toast.info("AI inventory generation runs during inspection")}
                  >
                    <Zap size={12} />
                    AI Generate
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                    style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    <Plus size={12} />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="rounded-sm p-5 mb-4 border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <h3 className="font-archivo text-sm font-bold mb-4" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Add Inventory Item
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="font-archivo text-xs mb-1 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Item Name</label>
                      <Input
                        value={newItem.name}
                        onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Dinner fork"
                        className="rounded-sm text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-archivo text-xs mb-1 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Category</label>
                      <select
                        value={newItem.category}
                        onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-sm border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--border)", background: "var(--cream)", color: "var(--ink)" }}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-archivo text-xs mb-1 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Required Qty</label>
                      <Input
                        type="number"
                        min={1}
                        value={newItem.quantityRequired}
                        onChange={e => setNewItem(p => ({ ...p, quantityRequired: parseInt(e.target.value) || 1 }))}
                        className="rounded-sm text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-archivo text-xs mb-1 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Present Qty</label>
                      <Input
                        type="number"
                        min={0}
                        value={newItem.quantityPresent}
                        onChange={e => setNewItem(p => ({ ...p, quantityPresent: parseInt(e.target.value) || 0 }))}
                        className="rounded-sm text-sm"
                      />
                    </div>
                  </div>
                  {newItem.quantityPresent < newItem.quantityRequired && (
                    <div className="flex items-center gap-2 p-3 rounded-sm mb-3" style={{ background: "rgba(255,45,135,0.08)", border: "1px solid rgba(255,45,135,0.2)" }}>
                      <AlertCircle size={14} style={{ color: "var(--pink)" }} />
                      <span className="text-sm" style={{ color: "var(--pink)" }}>
                        {newItem.quantityRequired - newItem.quantityPresent} × {newItem.name || "item"} will be added to the Shopping List
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddItem}
                      className="rounded-sm font-archivo text-xs"
                      style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
                    >
                      Add Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="rounded-sm font-archivo text-xs"
                      style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Inventory table */}
              {inventoryItems.length === 0 ? (
                <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <Package size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
                  <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No Items Recorded</p>
                  <p className="text-sm" style={{ color: "var(--muted-light)" }}>
                    Start a New Inventory inspection to auto-generate the list from photos, or add items manually.
                  </p>
                </div>
              ) : (
                <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "var(--black)", color: "var(--white)" }}>
                        {["Item", "Category", "Condition", "Required", "Present", "Status"].map(h => (
                          <th key={h} className="font-archivo text-xs px-4 py-3 text-left" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.map((item: any, i: number) => {
                        const missing = (item.quantityRequired || 1) - (item.quantityPresent || 0);
                        return (
                          <tr key={item.id} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3">
                              <div className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>{item.name}</div>
                              {item.notes && <div className="text-xs" style={{ color: "var(--muted)" }}>{item.notes}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: "var(--muted)" }}>{CATEGORY_LABELS[item.category] || item.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: `${CONDITION_COLORS[item.condition] || "var(--muted)"}15`, color: CONDITION_COLORS[item.condition] || "var(--muted)", border: `1px solid ${CONDITION_COLORS[item.condition] || "var(--muted)"}30`, letterSpacing: "0.06em", textTransform: "capitalize" }}>
                                {item.condition}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{item.quantityRequired || 1}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-archivo text-sm font-bold" style={{ color: missing > 0 ? "var(--pink)" : "#10b981" }}>{item.quantityPresent || 0}</span>
                            </td>
                            <td className="px-4 py-3">
                              {missing > 0 ? (
                                <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(255,45,135,0.1)", color: "var(--pink)", border: "1px solid rgba(255,45,135,0.2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  {missing} Missing
                                </Badge>
                              ) : (
                                <Badge className="font-archivo text-xs px-2 py-0.5" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                  Complete
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "shopping" && (
            <div>
              {shoppingList.length === 0 ? (
                <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
                  <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" style={{ color: "#10b981" }} />
                  <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Shopping List is Clear</p>
                  <p className="text-sm" style={{ color: "var(--muted-light)" }}>
                    All inventory items are present and accounted for.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-archivo text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {shoppingList.length} items to replace or top up
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-sm font-archivo text-xs"
                      style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
                      onClick={() => toast.info("Shopping list export coming soon")}
                    >
                      Export List
                    </Button>
                  </div>
                  <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: "var(--black)", color: "var(--white)" }}>
                          {["Item", "Required", "Present", "To Buy", "Est. Cost", "Action"].map(h => (
                            <th key={h} className="font-archivo text-xs px-4 py-3 text-left" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shoppingList.map((item: any, i: number) => {
                          const missing = (item.quantityRequired || 1) - (item.quantityPresent || 0);
                          return (
                            <tr key={item.id} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                              <td className="px-4 py-3">
                                <div className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{item.name}</div>
                                <div className="text-xs" style={{ color: "var(--muted)" }}>{CATEGORY_LABELS[item.category] || item.category}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-archivo text-sm" style={{ color: "var(--muted)" }}>{item.quantityRequired || 1}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-archivo text-sm" style={{ color: "var(--pink)" }}>{item.quantityPresent || 0}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-archivo text-sm font-bold" style={{ color: "var(--pink)" }}>{missing}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: "var(--muted)" }}>
                                  {item.estimatedCost ? `$${item.estimatedCost}` : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  className="rounded-sm font-archivo text-xs"
                                  style={{ background: "#10b981", color: "var(--white)", border: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}
                                  onClick={() => toast.success(`${item.name} marked as purchased`)}
                                >
                                  <CheckCircle2 size={10} className="mr-1" />
                                  Purchased
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
