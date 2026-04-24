import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Send, DollarSign, Building2, ChevronRight, X, Check } from "lucide-react";

type LineItem = { description: string; quantity: number; unitPrice: number; gst: boolean };

const STATUS_COLORS: Record<string, string> = {
  draft: "rgba(100,100,100,0.15)",
  sent: "rgba(59,130,246,0.15)",
  paid: "rgba(34,197,94,0.15)",
  overdue: "rgba(239,68,68,0.15)",
  cancelled: "rgba(156,163,175,0.15)",
};
const STATUS_TEXT: Record<string, string> = {
  draft: "#6b7280",
  sent: "#3b82f6",
  paid: "#16a34a",
  overdue: "#dc2626",
  cancelled: "#9ca3af",
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const EMPTY_LINE: LineItem = { description: "", quantity: 1, unitPrice: 0, gst: true };

export default function Invoices() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...EMPTY_LINE }]);

  const propertiesQuery = trpc.properties.list.useQuery();
  const invoicesQuery = trpc.invoices.list.useQuery(
    { propertyId: selectedPropertyId ?? undefined },
    { enabled: true }
  );
  const detailQuery = trpc.invoices.get.useQuery(
    { id: showDetail! },
    { enabled: showDetail !== null }
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created");
      utils.invoices.list.invalidate();
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  const updateStatusMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated");
      utils.invoices.list.invalidate();
      utils.invoices.get.invalidate();
    },
    onError: () => toast.error("Failed to update invoice"),
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted");
      utils.invoices.list.invalidate();
      setShowDetail(null);
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  function resetForm() {
    setRecipientName(""); setRecipientEmail(""); setRecipientAddress("");
    setNotes(""); setLineItems([{ ...EMPTY_LINE }]);
  }

  function calcTotals(items: LineItem[]) {
    let sub = 0, gst = 0;
    for (const item of items) {
      const line = Math.round(item.quantity * item.unitPrice * 100);
      sub += line;
      if (item.gst) gst += Math.round(line * 0.15);
    }
    return { sub, gst, total: sub + gst };
  }

  const { sub, gst, total } = calcTotals(lineItems);

  function handleCreate() {
    if (!selectedPropertyId) { toast.error("Select a property first"); return; }
    if (lineItems.every(l => !l.description)) { toast.error("Add at least one line item"); return; }
    createMutation.mutate({
      propertyId: selectedPropertyId,
      recipientName: recipientName || undefined,
      recipientEmail: recipientEmail || undefined,
      recipientAddress: recipientAddress || undefined,
      lineItems: lineItems.filter(l => l.description),
      notes: notes || undefined,
    });
  }

  const invoiceList = (invoicesQuery.data as any[]) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ background: "var(--black)" }}>
            <FileText size={18} style={{ color: "var(--yellow)" }} />
          </div>
          <div>
            <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>INVOICES</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Property inspection invoicing & billing</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-sm font-archivo text-xs"
          style={{ background: "var(--pink)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          <Plus size={14} /> New Invoice
        </Button>
      </div>

      {/* Property filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedPropertyId(null)}
          className="px-3 py-1.5 rounded-sm font-archivo text-xs transition-all"
          style={{
            background: selectedPropertyId === null ? "var(--black)" : "var(--white)",
            color: selectedPropertyId === null ? "var(--white)" : "var(--muted)",
            border: "1px solid var(--border)",
            letterSpacing: "0.06em", textTransform: "uppercase"
          }}
        >
          All Properties
        </button>
        {(propertiesQuery.data as any[])?.map((p: any) => (
          <button
            key={p.id}
            onClick={() => setSelectedPropertyId(p.id)}
            className="px-3 py-1.5 rounded-sm font-archivo text-xs transition-all"
            style={{
              background: selectedPropertyId === p.id ? "var(--black)" : "var(--white)",
              color: selectedPropertyId === p.id ? "var(--white)" : "var(--muted)",
              border: "1px solid var(--border)",
              letterSpacing: "0.06em", textTransform: "uppercase"
            }}
          >
            {p.address}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {invoiceList.length === 0 ? (
        <div className="text-center py-16 rounded-sm border" style={{ background: "var(--white)", borderColor: "var(--border)" }}>
          <FileText size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--ink)" }} />
          <p className="font-archivo text-sm mb-1" style={{ color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>No invoices yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--muted-light)" }}>Create your first invoice to get started</p>
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-sm font-archivo text-xs"
            style={{ background: "var(--black)", color: "var(--yellow)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            <Plus size={12} className="mr-2" /> New Invoice
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoiceList.map((inv: any) => (
            <button
              key={inv.id}
              onClick={() => setShowDetail(inv.id)}
              className="w-full flex items-center gap-4 p-4 rounded-sm border text-left transition-all hover:shadow-md"
              style={{ background: "var(--white)", borderColor: "var(--border)" }}
            >
              <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: "var(--cream)" }}>
                <FileText size={18} style={{ color: "var(--muted)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>{inv.invoiceNumber}</span>
                  <Badge
                    className="font-archivo text-xs px-2 py-0.5"
                    style={{
                      background: STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft,
                      color: STATUS_TEXT[inv.status] ?? STATUS_TEXT.draft,
                      border: "none", letterSpacing: "0.06em", textTransform: "uppercase"
                    }}
                  >
                    {inv.status}
                  </Badge>
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {inv.recipientName || "No recipient"} · Due {new Date(inv.dueDate).toLocaleDateString("en-NZ")}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{formatCents(inv.totalCents)}</div>
                <div className="text-xs" style={{ color: "var(--muted-light)" }}>incl. GST</div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted-light)" }} />
            </button>
          ))}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--white)" }}>
          <DialogHeader>
            <DialogTitle className="font-anton text-xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>NEW INVOICE</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Property */}
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Property</Label>
              <Select value={selectedPropertyId?.toString() ?? ""} onValueChange={v => setSelectedPropertyId(Number(v))}>
                <SelectTrigger className="rounded-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {(propertiesQuery.data as any[])?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipient Name</Label>
                <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Owner / Company name" className="rounded-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }} />
              </div>
              <div>
                <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipient Email</Label>
                <Input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="email@example.com" type="email" className="rounded-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }} />
              </div>
            </div>
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipient Address</Label>
              <Input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="Postal address" className="rounded-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }} />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-archivo text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Line Items</Label>
                <button
                  onClick={() => setLineItems(prev => [...prev, { ...EMPTY_LINE }])}
                  className="font-archivo text-xs flex items-center gap-1"
                  style={{ color: "var(--pink)", letterSpacing: "0.06em" }}
                >
                  <Plus size={12} /> Add Line
                </button>
              </div>
              <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-12 gap-0 px-3 py-2 font-archivo text-xs" style={{ background: "var(--black)", color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit $</div>
                  <div className="col-span-2 text-right">GST</div>
                  <div className="col-span-1" />
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 px-3 py-2 items-center border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="col-span-5">
                      <Input
                        value={item.description}
                        onChange={e => setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                        placeholder="Description..."
                        className="rounded-sm h-8 text-xs"
                        style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, quantity: Number(e.target.value) } : l))}
                        className="rounded-sm h-8 text-xs text-right"
                        style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                        min={0}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, unitPrice: Number(e.target.value) } : l))}
                        className="rounded-sm h-8 text-xs text-right"
                        style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, gst: !l.gst } : l))}
                        className="w-6 h-6 rounded-sm flex items-center justify-center transition-all"
                        style={{ background: item.gst ? "var(--pink)" : "var(--cream)", border: "1px solid var(--border)" }}
                      >
                        {item.gst && <Check size={12} style={{ color: "var(--white)" }} />}
                      </button>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                        className="w-6 h-6 flex items-center justify-center"
                        style={{ color: "var(--muted-light)" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-sm p-4" style={{ background: "var(--black)", color: "var(--white)" }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Subtotal</span>
                <span>{formatCents(sub)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "rgba(255,255,255,0.6)" }}>GST (15%)</span>
                <span>{formatCents(gst)}</span>
              </div>
              <div className="flex justify-between font-archivo text-base font-bold border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <span style={{ color: "var(--yellow)" }}>Total</span>
                <span style={{ color: "var(--yellow)" }}>{formatCents(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="font-archivo text-xs mb-1.5 block" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details, etc." className="rounded-sm" style={{ background: "var(--cream)", border: "1px solid var(--border)" }} rows={3} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-sm font-archivo text-xs" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-sm font-archivo text-xs"
              style={{ background: "var(--pink)", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {createMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={showDetail !== null} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--white)" }}>
          {detailQuery.data && (() => {
            const inv = detailQuery.data as any;
            const items: LineItem[] = inv.lineItems ?? [];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="font-anton text-xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>{inv.invoiceNumber}</DialogTitle>
                    <Badge
                      className="font-archivo text-xs px-2 py-0.5"
                      style={{
                        background: STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft,
                        color: STATUS_TEXT[inv.status] ?? STATUS_TEXT.draft,
                        border: "none", letterSpacing: "0.06em", textTransform: "uppercase"
                      }}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Recipient */}
                  <div className="rounded-sm p-4 border" style={{ borderColor: "var(--border)", background: "var(--cream)" }}>
                    <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Bill To</div>
                    <div className="font-archivo text-sm font-bold" style={{ color: "var(--ink)" }}>{inv.recipientName || "—"}</div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>{inv.recipientEmail || ""}</div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>{inv.recipientAddress || ""}</div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-sm p-3 border" style={{ borderColor: "var(--border)" }}>
                      <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Issue Date</div>
                      <div className="font-archivo text-sm" style={{ color: "var(--ink)" }}>{new Date(inv.issueDate).toLocaleDateString("en-NZ")}</div>
                    </div>
                    <div className="rounded-sm p-3 border" style={{ borderColor: "var(--border)" }}>
                      <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Due Date</div>
                      <div className="font-archivo text-sm" style={{ color: "var(--ink)" }}>{new Date(inv.dueDate).toLocaleDateString("en-NZ")}</div>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="rounded-sm border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-12 gap-0 px-4 py-2 font-archivo text-xs" style={{ background: "var(--black)", color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Unit</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-0 px-4 py-3 text-sm border-t" style={{ borderColor: "var(--border)" }}>
                        <div className="col-span-6" style={{ color: "var(--ink)" }}>{item.description}{item.gst && <span className="ml-1 text-xs" style={{ color: "var(--muted-light)" }}>(+GST)</span>}</div>
                        <div className="col-span-2 text-right" style={{ color: "var(--muted)" }}>{item.quantity}</div>
                        <div className="col-span-2 text-right" style={{ color: "var(--muted)" }}>${item.unitPrice.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-archivo font-bold" style={{ color: "var(--ink)" }}>${(item.quantity * item.unitPrice).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="rounded-sm p-4" style={{ background: "var(--black)", color: "var(--white)" }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Subtotal</span>
                      <span>{formatCents(inv.subtotalCents)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>GST (15%)</span>
                      <span>{formatCents(inv.gstCents)}</span>
                    </div>
                    <div className="flex justify-between font-archivo text-base font-bold border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                      <span style={{ color: "var(--yellow)" }}>Total</span>
                      <span style={{ color: "var(--yellow)" }}>{formatCents(inv.totalCents)}</span>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="rounded-sm p-4 border" style={{ borderColor: "var(--border)" }}>
                      <div className="font-archivo text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Notes</div>
                      <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.7 }}>{inv.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {inv.status === "draft" && (
                      <Button
                        onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "sent" })}
                        className="rounded-sm font-archivo text-xs flex items-center gap-2"
                        style={{ background: "#3b82f6", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
                      >
                        <Send size={12} /> Mark as Sent
                      </Button>
                    )}
                    {inv.status === "sent" && (
                      <Button
                        onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "paid" })}
                        className="rounded-sm font-archivo text-xs flex items-center gap-2"
                        style={{ background: "#16a34a", color: "var(--white)", border: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
                      >
                        <Check size={12} /> Mark as Paid
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (confirm("Delete this invoice?")) deleteMutation.mutate({ id: inv.id });
                      }}
                      variant="outline"
                      className="rounded-sm font-archivo text-xs flex items-center gap-2 ml-auto"
                      style={{ color: "#dc2626", borderColor: "#dc2626", letterSpacing: "0.08em", textTransform: "uppercase" }}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
