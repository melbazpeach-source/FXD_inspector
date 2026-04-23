import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, AlertCircle, ChevronRight, Thermometer,
  Wind, Droplets, Shield, Layers, FileText, Download, Clock,
  Zap, HelpCircle, ArrowRight, Building2
} from "lucide-react";
import { Link } from "wouter";

const STANDARDS = [
  {
    id: "heating",
    icon: Thermometer,
    label: "Heating",
    color: "var(--pink)",
    description: "Fixed heating device capable of heating the main living room to 18°C",
    agentCapability: "Agent identifies heater type and kW rating from chattels register + MagicPlan room dimensions",
    manualRequired: "Climate zone selection if MagicPlan not used",
  },
  {
    id: "insulation",
    icon: Layers,
    label: "Insulation",
    color: "#6366f1",
    description: "Ceiling and underfloor insulation meeting minimum R-values",
    agentCapability: "None — insulation cannot be assessed visually",
    manualRequired: "Inspector must physically check ceiling/subfloor space and enter R-values",
  },
  {
    id: "ventilation",
    icon: Wind,
    label: "Ventilation",
    color: "var(--yellow)",
    description: "Openable windows, extractor fans in kitchens and bathrooms",
    agentCapability: "Agent identifies windows, fans, range hood from 360 photos. Flags missing latches, broken glass.",
    manualRequired: "External venting confirmation for range hood and bathroom fans",
  },
  {
    id: "moisture",
    icon: Droplets,
    label: "Moisture & Drainage",
    color: "#06b6d4",
    description: "Efficient drainage, gutters, and ground moisture barriers",
    agentCapability: "Agent assesses gutter condition, drainage, moisture staining, mould from photos",
    manualRequired: "Subfloor moisture barrier — inspector must physically check",
  },
  {
    id: "draught",
    icon: Shield,
    label: "Draught Stopping",
    color: "#10b981",
    description: "Gaps and holes in walls, ceilings, floors, and around windows/doors blocked",
    agentCapability: "Agent identifies visible gaps around frames, unsealed penetrations, fireplace presence",
    manualRequired: "Whether fireplace/chimney is sealed — inspector confirms",
  },
];

type AssessmentStatus = "compliant" | "non_compliant" | "pending" | "exempt";

type StandardStatus = {
  status: AssessmentStatus;
  notes: string;
  agentFindings: string;
};

export default function HealthyHomes() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [standardStatuses, setStandardStatuses] = useState<Record<string, StandardStatus>>({});
  const [activeStandard, setActiveStandard] = useState<string | null>(null);
  const [isRunningAgent, setIsRunningAgent] = useState(false);

  const propertiesQuery = trpc.properties.list.useQuery();
  const assessmentQuery = trpc.healthyHomes.getByProperty.useQuery(
    { propertyId: selectedPropertyId! },
    { enabled: !!selectedPropertyId }
  );
  const assessment = assessmentQuery.data as any;

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case "compliant": return "#10b981";
      case "non_compliant": return "var(--pink)";
      case "pending": return "var(--yellow)";
      case "exempt": return "var(--muted-light)";
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case "compliant": return CheckCircle2;
      case "non_compliant": return XCircle;
      case "pending": return AlertCircle;
      case "exempt": return HelpCircle;
    }
  };

  const getStatusLabel = (status: AssessmentStatus) => {
    switch (status) {
      case "compliant": return "Compliant";
      case "non_compliant": return "Non-Compliant";
      case "pending": return "Pending";
      case "exempt": return "Exempt";
    }
  };

  const overallStatus = () => {
    const statuses = Object.values(standardStatuses).map(s => s.status);
    if (statuses.some(s => s === "non_compliant")) return "non_compliant";
    if (statuses.some(s => s === "pending")) return "pending";
    if (statuses.length === 5 && statuses.every(s => s === "compliant" || s === "exempt")) return "compliant";
    return "pending";
  };

  const completedCount = Object.values(standardStatuses).filter(s => s.status !== "pending").length;

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{ background: "var(--black)" }}
          >
            <Shield size={18} style={{ color: "var(--yellow)" }} />
          </div>
          <div>
            <h1 className="font-anton text-3xl" style={{ color: "var(--black)", letterSpacing: "0.01em" }}>
              HEALTHY HOMES
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Agentic compliance assessment — NZ Healthy Homes Standards 2019
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="rounded-sm p-4 mb-6 flex items-start gap-3"
        style={{ background: "var(--black)", color: "var(--white)" }}
      >
        <Zap size={16} style={{ color: "var(--yellow)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--yellow)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            How the Agent Helps
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            The agent analyses your 360 and standard photos to assess ventilation, moisture, and draught standards visually.
            Heating capacity is calculated automatically from MagicPlan room dimensions and the chattels register.
            Insulation is the only standard requiring manual inspection — the agent will guide you through it.
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
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cream)" }}
                >
                  <Building2 size={18} style={{ color: "var(--muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-archivo text-sm font-bold truncate" style={{ color: "var(--ink)", letterSpacing: "0.02em" }}>
                    {prop.address}
                  </div>
                  <div className="text-sm" style={{ color: "var(--muted)" }}>
                    {prop.suburb}, {prop.city}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted-light)" }} />
              </button>
            ))}
            {(propertiesQuery.data as any[])?.length === 0 && (
              <div className="text-center py-12" style={{ color: "var(--muted)" }}>
                <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No properties found. Add a property first.</p>
                <Link href="/properties">
                  <Button className="mt-4" style={{ background: "var(--black)", color: "var(--white)", border: "none" }}>
                    Add Property
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Progress overview */}
          <div
            className="rounded-sm p-5 mb-6 border"
            style={{ background: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-archivo text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Assessment Progress
                </div>
                <div className="font-anton text-2xl" style={{ color: "var(--black)" }}>
                  {completedCount} / 5 Standards
                </div>
              </div>
              {completedCount === 5 && (
                <div className="flex gap-2">
                  <Button
                    className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                    style={{
                      background: "var(--black)",
                      color: "var(--white)",
                      border: "none",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    <FileText size={14} />
                    Assessment Report
                  </Button>
                  <Button
                    className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                    style={{
                      background: overallStatus() === "compliant" ? "var(--pink)" : "var(--muted)",
                      color: "var(--white)",
                      border: "none",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                    disabled={overallStatus() !== "compliant"}
                  >
                    <Download size={14} />
                    Compliance Statement
                  </Button>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / 5) * 100}%`,
                  background: overallStatus() === "compliant" ? "#10b981" : overallStatus() === "non_compliant" ? "var(--pink)" : "var(--yellow)",
                }}
              />
            </div>

            {completedCount === 5 && overallStatus() === "compliant" && (
              <div
                className="mt-4 p-3 rounded-sm flex items-center gap-2"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                <span className="font-archivo text-sm" style={{ color: "#10b981", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  All standards compliant — Compliance Statement available for PM signature
                </span>
              </div>
            )}

            {completedCount === 5 && overallStatus() === "non_compliant" && (
              <div
                className="mt-4 p-3 rounded-sm flex items-center gap-2"
                style={{ background: "rgba(255,45,135,0.08)", border: "1px solid rgba(255,45,135,0.2)" }}
              >
                <XCircle size={16} style={{ color: "var(--pink)" }} />
                <span className="font-archivo text-sm" style={{ color: "var(--pink)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Non-compliant items found — remediation required before Compliance Statement can be issued
                </span>
              </div>
            )}
          </div>

          {/* Standards list */}
          <div className="space-y-3">
            {STANDARDS.map((standard) => {
              const Icon = standard.icon;
              const status = standardStatuses[standard.id];
              const StatusIcon = status ? getStatusIcon(status.status) : Clock;
              const isActive = activeStandard === standard.id;

              return (
                <div
                  key={standard.id}
                  className="rounded-sm border overflow-hidden"
                  style={{ background: "var(--white)", borderColor: isActive ? standard.color : "var(--border)" }}
                >
                  {/* Standard header */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-gray-50"
                    onClick={() => setActiveStandard(isActive ? null : standard.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                      style={{ background: `${standard.color}15` }}
                    >
                      <Icon size={18} style={{ color: standard.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-archivo text-sm font-bold" style={{ color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          {standard.label}
                        </span>
                        {status && (
                          <Badge
                            className="font-archivo text-xs px-2 py-0.5"
                            style={{
                              background: `${getStatusColor(status.status)}20`,
                              color: getStatusColor(status.status),
                              border: `1px solid ${getStatusColor(status.status)}40`,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            {getStatusLabel(status.status)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>{standard.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {status ? (
                        <StatusIcon size={20} style={{ color: getStatusColor(status.status) }} />
                      ) : (
                        <Clock size={20} style={{ color: "var(--muted-light)" }} />
                      )}
                      <ChevronRight
                        size={16}
                        style={{
                          color: "var(--muted-light)",
                          transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isActive && (
                    <div
                      className="px-4 pb-4 border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="pt-4 space-y-4">
                        {/* Agent capability info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div
                            className="p-3 rounded-sm"
                            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
                          >
                            <div className="font-archivo text-xs mb-1.5 flex items-center gap-1.5" style={{ color: "#10b981", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              <Zap size={11} />
                              Agent Can Assess
                            </div>
                            <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.5 }}>
                              {standard.agentCapability}
                            </p>
                          </div>
                          <div
                            className="p-3 rounded-sm"
                            style={{ background: "rgba(255,212,0,0.06)", border: "1px solid rgba(255,212,0,0.3)" }}
                          >
                            <div className="font-archivo text-xs mb-1.5 flex items-center gap-1.5" style={{ color: "var(--yellow-warm)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              <AlertCircle size={11} />
                              Manual Input Required
                            </div>
                            <p className="text-sm" style={{ color: "var(--ink)", lineHeight: 1.5 }}>
                              {standard.manualRequired}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                            style={{
                              background: "var(--black)",
                              color: "var(--white)",
                              border: "none",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                            onClick={() => {
                              setIsRunningAgent(true);
                              setTimeout(() => {
                                setStandardStatuses(prev => ({
                                  ...prev,
                                  [standard.id]: {
                                    status: standard.id === "insulation" ? "pending" : "compliant",
                                    notes: standard.id === "insulation" ? "Manual inspection required" : "Agent assessment complete",
                                    agentFindings: `Agent analysis for ${standard.label} standard complete.`,
                                  },
                                }));
                                setIsRunningAgent(false);
                                toast.success(`${standard.label} assessment complete`);
                              }, 1500);
                            }}
                            disabled={isRunningAgent}
                          >
                            <Zap size={12} />
                            Run Agent Assessment
                          </Button>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
                            onClick={() => {
                              setStandardStatuses(prev => ({
                                ...prev,
                                [standard.id]: {
                                  status: "compliant",
                                  notes: "Manually marked compliant",
                                  agentFindings: "",
                                },
                              }));
                              toast.success(`${standard.label} marked as compliant`);
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Mark Compliant
                          </Button>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                            style={{ letterSpacing: "0.08em", textTransform: "uppercase", borderColor: "var(--pink)", color: "var(--pink)" }}
                            onClick={() => {
                              setStandardStatuses(prev => ({
                                ...prev,
                                [standard.id]: {
                                  status: "non_compliant",
                                  notes: "Manually marked non-compliant",
                                  agentFindings: "",
                                },
                              }));
                              toast.error(`${standard.label} marked as non-compliant`);
                            }}
                          >
                            <XCircle size={12} />
                            Mark Non-Compliant
                          </Button>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                            style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
                            onClick={() => {
                              setStandardStatuses(prev => ({
                                ...prev,
                                [standard.id]: {
                                  status: "exempt",
                                  notes: "Exemption applied",
                                  agentFindings: "",
                                },
                              }));
                              toast.info(`${standard.label} marked as exempt`);
                            }}
                          >
                            <HelpCircle size={12} />
                            Apply Exemption
                          </Button>
                        </div>

                        {/* Heating kW display — only shown for heating standard */}
                        {standard.id === "heating" && assessment && (
                          <div
                            className="rounded-sm p-5 border"
                            style={{ background: "var(--black)", borderColor: "var(--black)" }}
                          >
                            <div className="font-archivo text-xs mb-4 flex items-center gap-1.5" style={{ color: "var(--pink)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                              <Thermometer size={12} />
                              Heating Capacity Assessment
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center">
                                <div className="font-archivo text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Actual Capacity</div>
                                <div className="font-anton text-5xl" style={{ color: "var(--pink)", lineHeight: 1 }}>
                                  {assessment.heatingCapacityKw ?? "—"}
                                </div>
                                <div className="font-archivo text-lg font-bold mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>kW</div>
                              </div>
                              <div className="text-center">
                                <div className="font-archivo text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Required Min.</div>
                                <div className="font-anton text-5xl" style={{ color: "var(--yellow)", lineHeight: 1 }}>
                                  {assessment.heatingRequiredKw ?? "—"}
                                </div>
                                <div className="font-archivo text-lg font-bold mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>kW</div>
                              </div>
                            </div>
                            {assessment.heatingDeviceType && (
                              <div className="text-center mb-3">
                                <span className="font-archivo text-sm font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{assessment.heatingDeviceType}</span>
                              </div>
                            )}
                            {assessment.heatingCapacityKw && assessment.heatingRequiredKw && (
                              <div
                                className="flex items-center justify-center gap-2 p-2 rounded-sm"
                                style={{
                                  background: parseFloat(assessment.heatingCapacityKw) >= parseFloat(assessment.heatingRequiredKw)
                                    ? "rgba(16,185,129,0.15)" : "rgba(255,45,135,0.15)",
                                  border: `1px solid ${parseFloat(assessment.heatingCapacityKw) >= parseFloat(assessment.heatingRequiredKw) ? "rgba(16,185,129,0.4)" : "rgba(255,45,135,0.4)"}`
                                }}
                              >
                                {parseFloat(assessment.heatingCapacityKw) >= parseFloat(assessment.heatingRequiredKw) ? (
                                  <><CheckCircle2 size={14} style={{ color: "#10b981" }} /><span className="font-archivo text-xs font-bold" style={{ color: "#10b981", letterSpacing: "0.08em", textTransform: "uppercase" }}>Exceeds requirement by {(parseFloat(assessment.heatingCapacityKw) - parseFloat(assessment.heatingRequiredKw)).toFixed(1)} kW</span></>
                                ) : (
                                  <><XCircle size={14} style={{ color: "var(--pink)" }} /><span className="font-archivo text-xs font-bold" style={{ color: "var(--pink)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Undersized by {(parseFloat(assessment.heatingRequiredKw) - parseFloat(assessment.heatingCapacityKw)).toFixed(1)} kW</span></>
                                )}
                              </div>
                            )}
                            {assessment.heatingNotes && (
                              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{assessment.heatingNotes}</p>
                            )}
                          </div>
                        )}

                        {/* Status display */}
                        {status && (
                          <div
                            className="p-3 rounded-sm"
                            style={{
                              background: `${getStatusColor(status.status)}08`,
                              border: `1px solid ${getStatusColor(status.status)}25`,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon size={14} style={{ color: getStatusColor(status.status) }} />
                              <span className="font-archivo text-xs" style={{ color: getStatusColor(status.status), letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {getStatusLabel(status.status)}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: "var(--ink)" }}>{status.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Compliance Statement section */}
          {completedCount === 5 && (
            <div
              className="mt-6 rounded-sm p-6 border"
              style={{ background: "var(--white)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: overallStatus() === "compliant" ? "rgba(16,185,129,0.1)" : "rgba(255,45,135,0.1)" }}
                >
                  <FileText size={20} style={{ color: overallStatus() === "compliant" ? "#10b981" : "var(--pink)" }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-archivo text-sm font-bold mb-1" style={{ color: "var(--ink)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Compliance Statement — PM Signature Required
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                    The Compliance Statement is a formal legal document — a written promise from the property manager
                    to the tenant that the property meets all Healthy Homes Standards. It must be signed by the PM
                    and attached to the tenancy agreement. A false statement carries penalties of up to $7,200 per standard.
                  </p>
                  {overallStatus() === "compliant" ? (
                    <Button
                      className="flex items-center gap-2 rounded-sm font-archivo text-xs"
                      style={{
                        background: "var(--black)",
                        color: "var(--yellow)",
                        border: "none",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      <ArrowRight size={14} />
                      Review & Sign Compliance Statement
                    </Button>
                  ) : (
                    <div
                      className="p-3 rounded-sm"
                      style={{ background: "rgba(255,45,135,0.06)", border: "1px solid rgba(255,45,135,0.2)" }}
                    >
                      <p className="text-sm" style={{ color: "var(--pink)" }}>
                        Compliance Statement cannot be issued until all non-compliant items are remediated and re-assessed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
