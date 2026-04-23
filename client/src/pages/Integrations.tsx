import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Link2,
  Loader2,
  RefreshCw,
  Settings2,
  TestTube2,
  Zap,
} from "lucide-react";

const PLATFORMS = [
  {
    key: "palace" as const,
    name: "Palace",
    description: "Palace Property Management — NZ's leading residential PM platform",
    iconColor: "bg-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    fields: [
      { key: "apiEndpoint", label: "API URL", placeholder: "https://api.palacepm.com/v2" },
      { key: "apiKey", label: "API Key", placeholder: "pk_live_...", type: "password" },
    ],
  },
  {
    key: "console" as const,
    name: "Console Cloud",
    description: "Console Cloud — property management software for NZ & AU",
    iconColor: "bg-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    fields: [
      { key: "apiEndpoint", label: "API URL", placeholder: "https://api.console.cloud/v1" },
      { key: "apiKey", label: "API Key", placeholder: "cc_...", type: "password" },
    ],
  },
  {
    key: "propertytree" as const,
    name: "PropertyTree",
    description: "PropertyTree — modern cloud-based property management",
    iconColor: "bg-green-600",
    bgColor: "bg-green-50 border-green-200",
    fields: [
      { key: "apiEndpoint", label: "API URL", placeholder: "https://api.propertytree.com/v1" },
      { key: "apiKey", label: "API Key", placeholder: "pt_...", type: "password" },
    ],
  },
  {
    key: "rest" as const,
    name: "REST",
    description: "REST Professional — property management for NZ agencies",
    iconColor: "bg-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    fields: [
      { key: "apiEndpoint", label: "API URL", placeholder: "https://api.restprofessional.com/v1" },
      { key: "apiKey", label: "API Key", placeholder: "rp_...", type: "password" },
    ],
  },
  {
    key: "test" as const,
    name: "Test / Sandbox",
    description: "Sandbox environment for development and testing — no real data",
    iconColor: "bg-amber-500",
    bgColor: "bg-amber-50 border-amber-200",
    fields: [
      { key: "apiEndpoint", label: "Sandbox URL", placeholder: "https://sandbox.inspect360.io/api" },
      { key: "apiKey", label: "Test Key", placeholder: "test_...", type: "password" },
    ],
  },
];

export default function Integrations() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const { data: configs, isLoading, refetch } = trpc.integrations.list.useQuery();
  const configure = trpc.integrations.configure.useMutation({
    onSuccess: () => {
      toast.success("Integration saved");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const testConnection = trpc.integrations.testConnection.useMutation({
    onSuccess: (data) => {
      setTesting(null);
      if (data.success) {
        toast.success(`Connection successful! ${data.message ?? ""}`);
      } else {
        toast.error(`Connection failed: ${data.message ?? "Unknown error"}`);
      }
    },
    onError: (e) => {
      setTesting(null);
      toast.error(e.message);
    },
  });
  const syncNow = trpc.integrations.sync.useMutation({
    onSuccess: (data) => {
      setSyncing(null);
      if (data.success) {
        toast.success(data.message ?? "Sync complete");
      } else {
        toast.error(data.message ?? "Sync failed");
      }
      refetch();
    },
    onError: (e) => {
      setSyncing(null);
      toast.error(e.message);
    },
  });

  function getConfig(platform: string) {
    return configs?.find((c) => c.platform === platform);
  }

  function getFormValue(platform: string, field: string) {
    return formValues[platform]?.[field] ?? "";
  }

  function setFormValue(platform: string, field: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? {}), [field]: value },
    }));
  }

  function handleSave(platform: (typeof PLATFORMS)[number]["key"]) {
    const values = formValues[platform] ?? {};
    configure.mutate({
      platform,
      apiEndpoint: values.apiEndpoint || undefined,
      apiKey: values.apiKey || undefined,
      isEnabled: true,
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect Inspect360 to your NZ property management platform to sync appointments and properties.
        </p>
      </div>

      {/* Active connections summary */}
      {!isLoading && configs && configs.some((c) => c.isEnabled) && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <h2 className="font-display text-sm font-semibold text-foreground mb-3">Active Connections</h2>
          <div className="flex flex-wrap gap-2">
            {configs
              .filter((c) => c.isEnabled)
              .map((c) => {
                const platform = PLATFORMS.find((p) => p.key === c.platform);
                return (
                  <div
                    key={c.platform}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {platform?.name ?? c.label}
                    {c.lastSyncedAt && (
                      <span className="text-green-500">
                        · synced {new Date(c.lastSyncedAt).toLocaleDateString("en-NZ")}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Platform cards */}
      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const config = getConfig(platform.key);
          const isExpanded = expanded === platform.key;
          const isConnected = config?.isEnabled;
          const syncStatus = config?.syncStatus;

          return (
            <div
              key={platform.key}
              className={`bg-card rounded-xl border overflow-hidden transition-all ${
                isConnected ? "border-green-200" : "border-border"
              }`}
            >
              {/* Header row */}
              <div
                className="p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : platform.key)}
              >
                <div className={`h-10 w-10 rounded-xl ${platform.iconColor} flex items-center justify-center shrink-0`}>
                  <Link2 className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-foreground text-sm">{platform.name}</p>
                    {isConnected ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Not connected
                      </span>
                    )}
                    {syncStatus === "error" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Sync error
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{platform.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isConnected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSyncing(platform.key);
                        syncNow.mutate({ platform: platform.key });
                      }}
                      disabled={syncing === platform.key}
                      title="Sync now"
                      className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 text-muted-foreground ${
                          syncing === platform.key ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded config */}
              {isExpanded && (
                <div className={`border-t border-border p-5 ${platform.bgColor}`}>
                  <div className="space-y-3 max-w-lg">
                    {platform.fields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium text-foreground mb-1.5 block">
                          {field.label}
                        </label>
                        <Input
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          value={getFormValue(platform.key, field.key)}
                          onChange={(e) => setFormValue(platform.key, field.key, e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleSave(platform.key)}
                        disabled={configure.isPending}
                        className="bg-primary text-primary-foreground"
                      >
                        {configure.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : (
                          <Settings2 className="h-3.5 w-3.5 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTesting(platform.key);
                          testConnection.mutate({ platform: platform.key });
                        }}
                        disabled={testing === platform.key || testConnection.isPending}
                      >
                        {testing === platform.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : (
                          <TestTube2 className="h-3.5 w-3.5 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      {isConnected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSyncing(platform.key);
                            syncNow.mutate({ platform: platform.key });
                          }}
                          disabled={syncing === platform.key}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-2" />
                          Sync Now
                        </Button>
                      )}
                    </div>

                    {/* Webhook info */}
                    <div className="mt-4 p-3 bg-background/80 rounded-lg border border-border">
                      <p className="text-xs font-medium text-foreground mb-1">Webhook URL</p>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/{platform.key}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure this URL in your {platform.name} settings to enable automatic appointment sync.
                      </p>
                    </div>

                    {/* Sync error */}
                    {config?.syncError && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs font-medium text-red-700 mb-1">Last sync error</p>
                        <p className="text-xs text-red-600">{config.syncError}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">How sync works</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When connected, Inspect360 automatically imports scheduled inspections as appointment tiles on your dashboard.
              Each appointment can be started as any inspection type. Completed reports can be pushed back to your platform.
              Webhooks enable real-time sync — configure the webhook URL above in your property management software.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
