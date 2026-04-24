import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
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
  Brain,
  Mic,
  ScanText,
  Map,
  Shield,
  Plug,
  Bot,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Save,
  X,
} from "lucide-react";

// ── Platform Configs ───────────────────────────────────────────────────────────
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
    name: "REST Professional",
    description: "REST Professional — property management for NZ agencies",
    iconColor: "bg-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    fields: [
      { key: "apiEndpoint", label: "API URL", placeholder: "https://api.restprofessional.com/v1" },
      { key: "apiKey", label: "API Key", placeholder: "rp_...", type: "password" },
    ],
  },
];

// ── Provider category metadata ─────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  llm: {
    label: "AI Language Model",
    icon: <Brain className="h-5 w-5" />,
    description: "Powers Fixx chat, report drafting, and all AI analysis features.",
  },
  voice: {
    label: "Voice Transcription",
    icon: <Mic className="h-5 w-5" />,
    description: "Converts voice notes during inspections to text.",
  },
  ocr: {
    label: "OCR / Document Reading",
    icon: <ScanText className="h-5 w-5" />,
    description: "Extracts text from photos, certificates, and uploaded PDFs.",
  },
  floor_plans: {
    label: "Floor Plans",
    icon: <Map className="h-5 w-5" />,
    description: "Generates floor plans from room scans.",
  },
};

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  data: "bg-blue-100 text-blue-700",
  write: "bg-green-100 text-green-700",
  integration: "bg-purple-100 text-purple-700",
  ai: "bg-orange-100 text-orange-700",
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Integrations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"providers" | "platforms" | "admin">("providers");
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, Record<string, string>>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [agentPromptDraft, setAgentPromptDraft] = useState("");

  // ── tRPC queries ─────────────────────────────────────────────────────────────
  const { data: integrationList } = trpc.integrations.list.useQuery();
  const { data: providers, refetch: refetchProviders } = trpc.admin.listProviders.useQuery(undefined, {
    enabled: activeTab === "providers" || activeTab === "admin",
  });
  const { data: skillsList } = trpc.admin.listSkills.useQuery(undefined, { enabled: activeTab === "admin" });
  const { data: connectorsList, refetch: refetchConnectors } = trpc.admin.listConnectors.useQuery(undefined, { enabled: activeTab === "admin" });
  const { data: agentsList, refetch: refetchAgents } = trpc.admin.listAgents.useQuery(undefined, { enabled: activeTab === "admin" });

  const setActiveProvider = trpc.admin.setActiveProvider.useMutation({
    onSuccess: () => { refetchProviders(); toast.success("Active provider updated"); },
    onError: () => toast.error("Failed to update provider"),
  });
  const saveProviderKey = trpc.admin.saveProviderKey.useMutation({
    onSuccess: () => { refetchProviders(); toast.success("API key saved"); },
    onError: () => toast.error("Failed to save key"),
  });
  const testProvider = trpc.admin.testProvider.useMutation({
    onSuccess: (d) => { refetchProviders(); toast.success(`Test ${d.status === "ok" ? "passed ✓" : "failed"}`); },
    onError: () => toast.error("Test failed"),
  });
  const toggleConnector = trpc.admin.toggleConnector.useMutation({
    onSuccess: () => { refetchConnectors(); toast.success("Connector updated"); },
  });
  const updateAgent = trpc.admin.updateAgent.useMutation({
    onSuccess: () => { refetchAgents(); setEditingAgent(null); toast.success("Agent updated"); },
    onError: () => toast.error("Failed to update agent"),
  });

  const configureMutation = trpc.integrations.configure.useMutation({
    onSuccess: () => toast.success("Integration saved"),
    onError: () => toast.error("Failed to save"),
  });
  const testMutation = trpc.integrations.testConnection.useMutation({
    onSuccess: (d) => toast[d.success ? "success" : "error"](d.message),
    onError: () => toast.error("Connection test failed"),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const isOwner = !!user;
  const providersByCategory = providers
    ? providers.reduce<Record<string, typeof providers>>((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      }, {})
    : {};

  const tabs = [
    { id: "providers" as const, label: "AI Providers", icon: <Brain className="h-4 w-4" /> },
    { id: "platforms" as const, label: "Property Platforms", icon: <Link2 className="h-4 w-4" /> },
    ...(isOwner ? [{ id: "admin" as const, label: "Admin", icon: <Shield className="h-4 w-4" /> }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect services, configure AI providers, and manage agent capabilities.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "admin" && (
                <Badge variant="outline" className="text-xs ml-1 border-amber-400 text-amber-600">Owner only</Badge>
              )}
            </button>
          ))}
        </div>

        {/* ── PROVIDERS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "providers" && (
          <div className="space-y-8">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const catProviders = providersByCategory[cat] || [];
              const active = catProviders.find((p) => p.isActive);
              return (
                <div key={cat} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">{meta.icon}</div>
                    <div>
                      <h2 className="font-semibold text-foreground">{meta.label}</h2>
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                      {active && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                          <CheckCircle2 className="h-3 w-3" /> Active: {active.provider}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {catProviders.map((p) => {
                      const keyId = `${cat}-${p.provider}`;
                      const [keyVal, setKeyVal] = useState(p.apiKey || "");
                      const isBuiltIn = ["builtin", "whisper", "builtin_vision", "magicplan"].includes(p.provider);
                      const cfg = p.config as any;
                      return (
                        <div
                          key={p.provider}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            p.isActive ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground">{cfg?.label || p.provider}</span>
                              {p.isActive && <Badge className="text-xs bg-green-100 text-green-700 border-0">Active</Badge>}
                              {p.testStatus === "ok" && !p.isActive && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">Tested ✓</Badge>
                              )}
                              {isBuiltIn && <Badge variant="outline" className="text-xs">Built-in</Badge>}
                            </div>
                            {cfg?.description && <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>}
                            {cfg?.models && <p className="text-xs text-muted-foreground mt-0.5">Models: {cfg.models}</p>}
                          </div>
                          {!isBuiltIn && (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Input
                                  type={showKeys[keyId] ? "text" : "password"}
                                  placeholder="API Key"
                                  value={keyVal}
                                  onChange={(e) => setKeyVal(e.target.value)}
                                  className="h-8 text-xs w-40 pr-8"
                                />
                                <button
                                  onClick={() => setShowKeys((s) => ({ ...s, [keyId]: !s[keyId] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showKeys[keyId] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => saveProviderKey.mutate({ category: cat as any, provider: p.provider, apiKey: keyVal })}
                              >
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => testProvider.mutate({ category: cat as any, provider: p.provider })}
                            >
                              <TestTube2 className="h-3 w-3 mr-1" /> Test
                            </Button>
                            {!p.isActive && (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setActiveProvider.mutate({ category: cat as any, provider: p.provider })}
                              >
                                <Zap className="h-3 w-3 mr-1" /> Use
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PLATFORMS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "platforms" && (
          <div className="space-y-4">
            {PLATFORMS.map((platform) => {
              const integration = integrationList?.find((i) => i.platform === platform.key);
              const isExpanded = expandedPlatform === platform.key;
              const isConnected = integration?.isEnabled && integration?.hasCredentials;
              return (
                <div key={platform.key} className={`rounded-xl border p-4 ${platform.bgColor}`}>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.key)}
                  >
                    <div className={`w-10 h-10 rounded-lg ${platform.iconColor} flex items-center justify-center text-white font-bold text-sm`}>
                      {platform.name.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{platform.name}</span>
                        {isConnected ? (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">Connected</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not connected</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-black/10">
                      {platform.fields.map((field) => (
                        <div key={field.key}>
                          <label className="text-xs font-medium text-foreground mb-1 block">{field.label}</label>
                          <Input
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            defaultValue={""}
                            onChange={(e) =>
                              setPlatformConfigs((prev) => ({
                                ...prev,
                                [platform.key]: { ...(prev[platform.key] || {}), [field.key]: e.target.value },
                              }))
                            }
                            className="bg-white/80"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() =>
                            configureMutation.mutate({
                              platform: platform.key,
                              ...(platformConfigs[platform.key] || {}),
                            })
                          }
                          disabled={configureMutation.isPending}
                        >
                          {configureMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Settings2 className="h-3 w-3 mr-1" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testMutation.mutate({ platform: platform.key })}
                          disabled={testMutation.isPending}
                        >
                          {testMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TestTube2 className="h-3 w-3 mr-1" />}
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ADMIN TAB (owner only) ─────────────────────────────────────────── */}
        {activeTab === "admin" && (
          <div className="space-y-8">
            {/* Connectors */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Plug className="h-5 w-5 text-primary" /> Connectors
              </h2>
              <div className="grid gap-2">
                {connectorsList?.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-sm text-foreground">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{c.type.replace("_", " ")}</span>
                    </div>
                    <button
                      onClick={() => toggleConnector.mutate({ id: c.id, isActive: !c.isActive })}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${c.isActive ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {c.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Library */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" /> Skills Library
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {skillsList?.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{s.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_CATEGORY_COLORS[s.category || ""] || "bg-gray-100 text-gray-600"}`}>
                          {s.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agents */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> Agents
              </h2>
              <div className="space-y-4">
                {agentsList?.map((agent) => {
                  const isEditing = editingAgent === agent.agentId;
                  const agentSkills = (agent.skills as string[] | null) || [];
                  const agentConnectors = (agent.connectors as string[] | null) || [];
                  return (
                    <div key={agent.agentId} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{agent.name}</h3>
                            <Badge variant={agent.isEnabled ? "default" : "secondary"} className="text-xs">
                              {agent.isEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{agent.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAgent.mutate({ agentId: agent.agentId, isEnabled: !agent.isEnabled })}
                          >
                            {agent.isEnabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAgent(isEditing ? null : agent.agentId);
                              setAgentPromptDraft(agent.systemPrompt || "");
                            }}
                          >
                            {isEditing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="text-xs text-muted-foreground mr-1">LLM:</span>
                        <Badge variant="outline" className="text-xs">{agent.preferredLlmProvider || "builtin"}</Badge>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Skills ({agentSkills.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {agentSkills.map((sk) => (
                            <span key={sk} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{sk.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Connectors ({agentConnectors.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {agentConnectors.map((cn) => (
                            <span key={cn} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{cn.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          <div>
                            <label className="text-xs font-medium text-foreground block mb-1">System Prompt</label>
                            <textarea
                              className="w-full text-xs p-2 border border-border rounded-lg bg-background text-foreground resize-none"
                              rows={6}
                              value={agentPromptDraft}
                              onChange={(e) => setAgentPromptDraft(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground block mb-1">Preferred LLM Provider</label>
                            <select
                              className="text-xs p-2 border border-border rounded-lg bg-background text-foreground w-full"
                              defaultValue={agent.preferredLlmProvider || "builtin"}
                              onChange={(e) => updateAgent.mutate({ agentId: agent.agentId, preferredLlmProvider: e.target.value })}
                            >
                              {(providersByCategory["llm"] || []).map((p) => (
                                <option key={p.provider} value={p.provider}>{(p.config as any)?.label || p.provider}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => updateAgent.mutate({ agentId: agent.agentId, systemPrompt: agentPromptDraft })}
                            disabled={updateAgent.isPending}
                          >
                            <Save className="h-3 w-3 mr-1" /> Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
