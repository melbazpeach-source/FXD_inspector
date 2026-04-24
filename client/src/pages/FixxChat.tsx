import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Sparkles, Bot, User, Lightbulb, BookOpen, AlertTriangle, TrendingUp, Home, ChevronRight } from "lucide-react";
import { Streamdown } from "streamdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  { icon: AlertTriangle, label: "Healthy Homes deadlines", prompt: "What are the current Healthy Homes compliance deadlines for private landlords in NZ?", color: "var(--pink)" },
  { icon: BookOpen, label: "Notice periods", prompt: "What notice periods are required for property inspections under the Residential Tenancies Act?", color: "var(--yellow)" },
  { icon: TrendingUp, label: "Rent increase rules", prompt: "What are the rules for rent increases in NZ? How much notice is required and how often can rent be increased?", color: "var(--pink)" },
  { icon: Home, label: "Tribunal preparation", prompt: "How do I prepare for a Tenancy Tribunal hearing? What evidence do I need for a damage claim?", color: "var(--yellow)" },
  { icon: Lightbulb, label: "Fair wear vs damage", prompt: "Explain the difference between fair wear and tear versus tenant damage in NZ tenancy law. Give me practical examples.", color: "var(--pink)" },
  { icon: Sparkles, label: "Maintenance obligations", prompt: "What are the landlord's maintenance obligations under the RTA? What can be charged to tenants?", color: "var(--yellow)" },
];

const KNOWLEDGE_TOPICS = [
  "Residential Tenancies Act 1986",
  "Healthy Homes Standards 2019",
  "Inspection frequency & notice",
  "Rent reviews & increases",
  "Bond lodgement & refunds",
  "Tenancy Tribunal process",
  "Maintenance obligations",
  "Fair wear vs damage",
  "Ending tenancies",
  "Privacy Act obligations",
];

export default function FixxChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `**Kia ora! I'm Fixx** — your FXD Inspector AI assistant, trained on NZ tenancy law, Healthy Homes Standards, and property management best practice.\n\nI can help you with:\n- **Tenancy law questions** — RTA 1986, notice periods, rights and obligations\n- **Healthy Homes compliance** — standards, deadlines, assessment guidance\n- **Inspection guidance** — what to look for, how to document, tribunal-ready language\n- **Maintenance advice** — cost estimates, urgency assessment, contractor briefing\n- **Report drafting** — tenant letters, landlord briefs, tribunal evidence\n\nRemember: *AI can draft, but it cannot decide.* Always verify legal matters with a professional.\n\nWhat can I help you with today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.agent.chat.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const result = await chatMutation.mutateAsync({
        message: text,
        conversationHistory: history,
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.reply,
        timestamp: new Date(),
      }]);
    } catch {
      toast.error("Fixx is unavailable right now. Please try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full" style={{ background: "var(--cream)" }}>
      {/* Sidebar — Knowledge Base */}
      <aside
        className="hidden xl:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ background: "var(--white)", borderColor: "var(--border)" }}
      >
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: "var(--black)" }}
            >
              <Bot size={16} style={{ color: "var(--pink)" }} />
            </div>
            <div>
              <div className="font-anton text-base" style={{ color: "var(--black)", letterSpacing: "0.02em" }}>
                FIXX
              </div>
              <div className="font-archivo text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                AI Assistant
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge topics */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="font-archivo text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t("fixx.knowledgeBase")}
          </div>
          <div className="space-y-1">
            {KNOWLEDGE_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => sendMessage(`Tell me about: ${topic}`)}
                className="w-full text-left px-3 py-2 rounded-sm flex items-center gap-2 transition-colors hover:bg-gray-50 group"
              >
                <ChevronRight size={12} style={{ color: "var(--muted-light)" }} className="group-hover:text-pink-500 flex-shrink-0" />
                <span className="text-sm" style={{ color: "var(--ink)" }}>{topic}</span>
              </button>
            ))}
          </div>

          <div className="font-archivo text-xs mt-5 mb-3" style={{ color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t("fixx.quickPrompts")}
          </div>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  className="w-full text-left p-3 rounded-sm border transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--border)", background: "var(--cream)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={12} style={{ color: qp.color }} />
                    <span className="font-archivo text-xs" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {qp.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-light)", lineHeight: 1.5 }}>
            {t("fixx.disclaimer")}
          </p>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0"
          style={{ background: "var(--white)", borderColor: "var(--border)" }}
        >
          <div>
            <h1 className="font-anton text-2xl" style={{ color: "var(--black)", letterSpacing: "0.02em" }}>
              FIXX<span style={{ color: "var(--pink)" }}>.</span>
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              NZ Property Management AI — trained on tenancy law, Healthy Homes, and inspection best practice
            </p>
          </div>
          <Badge
            className="font-archivo text-xs px-3 py-1"
            style={{ background: "var(--black)", color: "var(--yellow)", letterSpacing: "0.1em", textTransform: "uppercase", border: "none" }}
          >
            AI
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: msg.role === "assistant" ? "var(--black)" : "var(--pink)",
                }}
              >
                {msg.role === "assistant"
                  ? <Bot size={14} style={{ color: "var(--pink)" }} />
                  : <User size={14} style={{ color: "var(--white)" }} />
                }
              </div>

              {/* Bubble */}
              <div
                className="max-w-2xl rounded-sm px-4 py-3"
                style={{
                  background: msg.role === "assistant" ? "var(--white)" : "var(--black)",
                  color: msg.role === "assistant" ? "var(--ink)" : "var(--white)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none" style={{ color: "var(--ink)" }}>
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--white)" }}>{msg.content}</p>
                )}
                <div
                  className="text-xs mt-2"
                  style={{ color: msg.role === "assistant" ? "var(--muted-light)" : "rgba(255,255,255,0.4)" }}
                >
                  {msg.timestamp.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--black)" }}
              >
                <Bot size={14} style={{ color: "var(--pink)" }} />
              </div>
              <div
                className="rounded-sm px-4 py-3"
                style={{ background: "var(--white)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "var(--pink)",
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-4 py-4 border-t flex-shrink-0"
          style={{ background: "var(--white)", borderColor: "var(--border)" }}
        >
          {/* Mobile quick prompts */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 xl:hidden">
            {QUICK_PROMPTS.slice(0, 4).map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border flex-shrink-0 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "var(--border)", background: "var(--cream)" }}
                >
                  <Icon size={11} style={{ color: qp.color }} />
                  <span className="font-archivo text-xs whitespace-nowrap" style={{ color: "var(--ink)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {qp.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("fixx.placeholder")}
              className="flex-1 resize-none min-h-[48px] max-h-32 text-sm"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="self-end px-4 py-2 rounded-sm"
              style={{
                background: input.trim() && !isLoading ? "var(--black)" : "var(--border)",
                color: input.trim() && !isLoading ? "var(--white)" : "var(--muted-light)",
                border: "none",
              }}
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted-light)" }}>
            {t("fixx.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
