import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  Square,
  ArrowLeft,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Timer,
  Activity,
  Target,
  DollarSign,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLocation } from "wouter";
import type { SimulationEvent, SimulationLiveState } from "@/types/api";

const MOCK_LIVE_STATE: SimulationLiveState = {
  run_id: "demo",
  scenario_name: "Demo Scenario",
  status: "running",
  current_round: 3,
  total_rounds: 10,
  start_time: new Date().toISOString(),
  metrics: {
    adoption_rate: 45,
    market_sentiment: 72,
    avg_willingness_to_pay: 68,
    total_interactions: 24,
    positive_ratio: 58,
    negative_ratio: 18,
  },
  agent_counts: { consumer: 50, competitor: 5, investor: 3, supplier: 2 },
  events: [],
  round_metrics: [],
  top_objections: [],
};

// Agent type → avatar color mapping
const avatarColors: Record<string, string> = {
  consumer: "bg-emerald-600",
  competitor: "bg-red-500",
  investor: "bg-amber-600",
  enterprise_buyer: "bg-slate-700",
  supplier: "bg-sky-600",
  regulator: "bg-gray-500",
  technical_expert: "bg-gray-600",
  mentor: "bg-stone-500",
};

const avatarLetters: Record<string, string> = {
  consumer: "C",
  competitor: "X",
  investor: "I",
  enterprise_buyer: "E",
  supplier: "S",
  regulator: "R",
  technical_expert: "T",
  mentor: "M",
};

const sentimentConfig = {
  positive: { icon: ThumbsUp, class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "Positive" },
  negative: { icon: ThumbsDown, class: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", label: "Negative" },
  neutral: { icon: Minus, class: "bg-muted text-muted-foreground", label: "Neutral" },
};

function SentimentChip({ sentiment }: { sentiment: "positive" | "negative" | "neutral" }) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${config.class}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

function AgentAvatar({ type }: { type: string }) {
  const color = avatarColors[type] || "bg-gray-500";
  const letter = avatarLetters[type] || "?";
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {letter}
    </div>
  );
}

function InteractionCard({ event }: { event: SimulationEvent }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <AgentAvatar type={event.agent_type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold">{event.agent_name}</span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            {event.agent_type.replace("_", " ")}
          </Badge>
          {event.target_agent && (
            <span className="text-[10px] text-muted-foreground">
              → {event.target_agent}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            Round {event.round}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
          {event.message}
        </p>
        <div className="mt-1.5">
          <SentimentChip sentiment={event.sentiment} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, change, changeLabel }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
        </div>
        {change !== undefined && (
          <span className={`text-[10px] font-semibold ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <div className="mt-1">
        <span className="text-2xl font-bold">{value}</span>
        {changeLabel && <span className="text-[10px] text-muted-foreground ml-1">{changeLabel}</span>}
      </div>
    </div>
  );
}

export default function SimulationLivePage() {
  const [, navigate] = useLocation();
  const [state] = useState<SimulationLiveState>(MOCK_LIVE_STATE);
  const [visibleEvents, setVisibleEvents] = useState<SimulationEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const eventIndexRef = useRef(0);

  // Simulate events streaming in
  useEffect(() => {
    if (!isPlaying) return;

    // Start with first 5 events if empty
    if (visibleEvents.length === 0) {
      setVisibleEvents(state.events.slice(0, 5));
      eventIndexRef.current = 5;
      return;
    }

    const interval = setInterval(() => {
      if (eventIndexRef.current < state.events.length) {
        setVisibleEvents((prev) => [...prev, state.events[eventIndexRef.current]]);
        eventIndexRef.current += 1;
      } else {
        setIsPlaying(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, state.events, visibleEvents.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleEvents]);

  const progress = (state.current_round / state.total_rounds) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="px-6 py-3 border-b flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/simulations")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{state.scenario_name}</h1>
            <p className="text-[11px] text-muted-foreground">Run ID: {state.run_id}</p>
          </div>
          <Badge
            variant={state.status === "running" ? "default" : "secondary"}
            className={state.status === "running" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {state.status === "running" && (
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
            )}
            {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isPlaying ? "Pause" : "Resume"}
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => setIsPlaying(false)}>
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        </div>
      </div>

      {/* Main Content: Timeline + Metrics Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline Panel */}
        <div className="flex-1 flex flex-col border-r min-w-0">
          {/* Progress Bar */}
          <div className="px-6 py-3 border-b bg-card flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Round <span className="font-semibold text-foreground">{state.current_round}</span> / {state.total_rounds}
              </span>
              <span className="text-xs font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex gap-6 mt-2.5">
              <span className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{state.metrics.total_interactions}</span> interactions
              </span>
              <span className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{Object.values(state.agent_counts).reduce((a, b) => a + b, 0)}</span> agents
              </span>
              <span className="text-[11px] text-muted-foreground">
                Elapsed: <span className="font-semibold text-foreground">2m 30s</span>
              </span>
            </div>
          </div>

          {/* Event Feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {visibleEvents.map((event, index) => {
              const prevEvent = index > 0 ? visibleEvents[index - 1] : null;
              const showRoundHeader = !prevEvent || prevEvent.round !== event.round;
              return (
                <div key={event.id}>
                  {showRoundHeader && (
                    <div className="flex items-center gap-2 py-2 mt-2 first:mt-0">
                      <Separator className="flex-1" />
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 tracking-widest whitespace-nowrap">
                        ROUND {event.round}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <InteractionCard event={event} />
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isPlaying && eventIndexRef.current < state.events.length && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-muted-foreground italic">Agents are interacting...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Metrics Panel */}
        <div className="w-[300px] overflow-y-auto p-4 space-y-4 flex-shrink-0 bg-card">
          {/* Key Metrics */}
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">Key Metrics</h3>
            <div className="space-y-2">
              <MetricCard
                label="Adoption Rate"
                value={`${state.metrics.adoption_rate}%`}
                icon={Target}
                change={3.2}
              />
              <MetricCard
                label="Market Sentiment"
                value={`${state.metrics.market_sentiment}%`}
                icon={Activity}
                change={1.5}
              />
              <MetricCard
                label="Willingness to Pay"
                value={`${state.metrics.avg_willingness_to_pay}%`}
                icon={DollarSign}
                change={-0.8}
              />
              <MetricCard
                label="Total Interactions"
                value={state.metrics.total_interactions}
                icon={MessageSquare}
              />
            </div>
          </div>

          <Separator />

          {/* Sentiment Distribution */}
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">Sentiment Split</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${state.metrics.positive_ratio}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{state.metrics.positive_ratio}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-3 h-3 text-muted-foreground" />
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/50 rounded-full"
                      style={{ width: `${100 - state.metrics.positive_ratio - state.metrics.negative_ratio}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{100 - state.metrics.positive_ratio - state.metrics.negative_ratio}%</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-3 h-3 text-red-500" />
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${state.metrics.negative_ratio}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{state.metrics.negative_ratio}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Adoption Trend Chart */}
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">Adoption Trend</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={state.round_metrics.slice(0, state.current_round)}>
                  <defs>
                    <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="round" tick={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={25} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="adoption"
                    stroke="hsl(142, 71%, 45%)"
                    fill="url(#adoptionGrad)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Separator />

          {/* Agent Population */}
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">Agent Population</h3>
            <div className="space-y-1.5">
              {Object.entries(state.agent_counts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <AgentAvatar type={type} />
                  <span className="flex-1 capitalize">{type.replace("_", " ")}</span>
                  <span className="text-muted-foreground font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Top Objections */}
          <div>
            <h3 className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Top Objections
            </h3>
            <div className="space-y-2.5">
              {state.top_objections.map((obj, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-foreground line-clamp-1">{obj.text}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] ml-2 flex-shrink-0 ${
                        obj.severity === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          : obj.severity === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {obj.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400 dark:bg-red-500"
                        style={{ width: `${(obj.count / state.top_objections[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-5 text-right">{obj.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
