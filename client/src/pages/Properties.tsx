import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Plus,
  Search,
  ChevronRight,
  Home,
  Users,
  CalendarCheck,
} from "lucide-react";

export default function Properties() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    address: "",
    suburb: "",
    city: "",
    postcode: "",
    landlordName: "",
    landlordEmail: "",
  });

  const { data: properties, isLoading, refetch } = trpc.properties.list.useQuery();
  const createProperty = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("Property added");
      refetch();
      setAddOpen(false);
      setForm({ address: "", suburb: "", city: "", postcode: "", landlordName: "", landlordEmail: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  // Start a new inspection directly from a property
  const createInspection = trpc.inspections.create.useMutation({
    onSuccess: ({ inspectionId }) => {
      toast.success("Inspection started!");
      setLocation(`/inspections/${inspectionId}`);
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">{t("properties.title")}</h1>
          <p className="text-muted-foreground text-sm">Manage your rental portfolio</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("properties.addProperty")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("common.search") + "..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Properties grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !properties || properties.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-display text-lg font-medium text-foreground mb-2">{t("properties.noProperties")}</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Add your first property to start managing inspections.
          </p>
          <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            {t("properties.addProperty")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm leading-snug">{p.address}</p>
                  {p.suburb && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {p.suburb}, {p.city}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">

                {p.landlordName && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.landlordName}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    createInspection.mutate({
                      propertyId: p.id,
                      type: "new_routine",
                    });
                  }}
                  disabled={createInspection.isPending}
                >
                  <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
                  {t("dashboard.newInspection")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t("properties.addProperty")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Street address *"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Suburb"
                value={form.suburb}
                onChange={(e) => setForm({ ...form, suburb: e.target.value })}
              />
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Postcode"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              />
            </div>
            <Input
              placeholder="Landlord / Owner name"
              value={form.landlordName}
              onChange={(e) => setForm({ ...form, landlordName: e.target.value })}
            />
            <Input
              placeholder="Landlord email"
              type="email"
              value={form.landlordEmail}
              onChange={(e) => setForm({ ...form, landlordEmail: e.target.value })}
            />
            <Button
              className="w-full bg-primary text-primary-foreground"
              onClick={() => {
                if (!form.address.trim()) return;
                createProperty.mutate({
                  address: form.address,
                  suburb: form.suburb || undefined,
                  city: form.city || undefined,
                  postcode: form.postcode || undefined,
                  landlordName: form.landlordName || undefined,
                  landlordEmail: form.landlordEmail || undefined,

                });
              }}
              disabled={!form.address.trim() || createProperty.isPending}
            >
              {t("properties.addProperty")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
