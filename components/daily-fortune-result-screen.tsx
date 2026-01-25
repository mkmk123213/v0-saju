"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Cloud,
  Coins,
  Heart,
  Zap,
  KeyRound,
  Brain,
  Film,
  Map,
  Moon,
  ChevronLeft,
} from "lucide-react";

type Props = {
  sajuInput: any;
  date: string;
  resultSummary: any;
  onBack: () => void;
};

function safeInt(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : fallback;
}

function toBadgeTags(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (typeof x === "string" ? x : ""))
    .map((s) => s.trim())
    .filter(Boolean);
}

function TitleRow({
  title,
  icon,
  score,
  onOpenFull,
  showFullButton,
}: {
  title: string;
  icon: ReactNode;
  score?: number | null;
  onOpenFull?: () => void;
  showFullButton?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        {typeof score === "number" && (
          <div className="min-w-[52px] text-right text-2xl font-bold tabular-nums">{score}</div>
        )}
        {showFullButton && (
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onOpenFull}>
            한눈에 보기
          </Button>
        )}
      </div>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  return <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{text}</p>;
}

function Grid9({ todayKeys }: { todayKeys: any }) {
  const items = useMemo(() => {
    const order: Array<[string, string]> = [
      ["color", "색깔"],
      ["taboo", "금기"],
      ["talisman", "부적"],
      ["lucky_spot", "스팟"],
      ["number", "숫자"],
      ["food", "음식"],
      ["item", "소지품"],
      ["action", "실천"],
      ["helper", "귀인"],
    ];
    return order.map(([k, label]) => {
      const v = todayKeys?.[k]?.value ?? "-";
      return { key: k, label, value: typeof v === "string" ? v : String(v ?? "-") };
    });
  }, [todayKeys]);

  const iconBg: Record<string, string> = {
    color: "bg-pink-500/10",
    taboo: "bg-red-500/10",
    talisman: "bg-purple-500/10",
    lucky_spot: "bg-emerald-500/10",
    number: "bg-blue-500/10",
    food: "bg-orange-500/10",
    item: "bg-cyan-500/10",
    action: "bg-fuchsia-500/10",
    helper: "bg-sky-500/10",
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.key} className="rounded-2xl border bg-white/70 p-3 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg[it.key] ?? "bg-muted"}`}>
              <span className="text-sm font-bold">{it.label.slice(0, 1)}</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">{it.label}</div>
            <div className="text-sm font-semibold text-foreground text-center break-keep">{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DailyFortuneResultScreen({ sajuInput, date, resultSummary, onBack }: Props) {
  const [fullOpen, setFullOpen] = useState(false);
  const [fullTitle, setFullTitle] = useState("");
  const [fullText, setFullText] = useState("");

  const openFull = (title: string, text: string) => {
    setFullTitle(title);
    setFullText(text);
    setFullOpen(true);
  };

  const scores = resultSummary?.scores ?? {};
  const sections = resultSummary?.sections ?? {};
  const premium = resultSummary?.premium_algo ?? {};
  const tags = toBadgeTags(resultSummary?.today_keywords);

  const overall = safeInt(scores?.overall, 0);
  const money = safeInt(scores?.money, 0);
  const love = safeInt(scores?.love, 0);
  const health = safeInt(scores?.health, 0);

  const summaryOneLiner = (resultSummary?.today_one_liner ?? "").toString().trim();

  const vibeText = (sections?.overall?.text ?? "").toString().trim();
  const moneyText = (sections?.money?.text ?? "").toString().trim();
  const loveText = (sections?.love?.text ?? "").toString().trim();
  const healthText = (sections?.health?.text ?? "").toString().trim();

  const spine = resultSummary?.spine_chill ?? null;
  const spineText =
    spine && typeof spine === "object"
      ? `⚡️ ${spine?.time_window ?? "오늘"}\n${spine?.prediction ?? ""}\n\n✅ 체크포인트: ${spine?.verification ?? ""}`
      : "";

  const cheatkeyText = (premium?.cheatkey ?? "").toString().trim();
  const mindText = (premium?.mind ?? "").toString().trim();
  const highlightText = (premium?.highlight ?? "").toString().trim();
  const moodText = (premium?.mood_setting ?? "").toString().trim();

  const sajuBrief = (resultSummary?.saju_brief ?? "").toString().trim();
  const astroBrief = (resultSummary?.astro_brief ?? "").toString().trim();

  return (
    <div className="flex min-h-screen flex-col starfield">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" className="h-9 px-2" onClick={onBack}>
            <ChevronLeft className="mr-1 h-5 w-5" />
            이전
          </Button>
          <div className="text-sm text-muted-foreground">{date}</div>
        </div>

        <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-br from-yellow-200/90 via-amber-200/80 to-orange-200/70">
          <div className="p-5 text-center">
            <div className="text-lg font-extrabold tracking-tight text-foreground/90">{summaryOneLiner}</div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {tags.slice(0, 3).map((t: string) => (
                  <Badge key={t} variant="secondary" className="bg-black/10 text-foreground/90">
                    {t.startsWith("#") ? t : `#${t}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Accordion type="single" collapsible defaultValue="overall" className="space-y-2">
          <AccordionItem value="overall" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="오늘의 바이브 ☁️" icon={<Cloud className="h-5 w-5" />} score={overall} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={vibeText} />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openFull("오늘의 바이브 ☁️", vibeText)}
                >
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="money" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="머니 컨디션 💸" icon={<Coins className="h-5 w-5" />} score={money} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={moneyText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("머니 컨디션 💸", moneyText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="love" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="심쿵 시그널 ❤️" icon={<Heart className="h-5 w-5" />} score={love} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={loveText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("심쿵 시그널 ❤️", loveText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="에너지 수치 🔋" icon={<Zap className="h-5 w-5" />} score={health} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={healthText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("에너지 수치 🔋", healthText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spine" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="소름포인트 ⚡️" icon={<Zap className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <TextBlock text={spineText} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="keywords" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="오늘의 키워드 🗝️" icon={<KeyRound className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5">
              <Grid9 todayKeys={resultSummary?.today_keys} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cheat" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="🔑 오늘의 운빨 치트키" icon={<KeyRound className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={cheatkeyText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("🔑 오늘의 운빨 치트키", cheatkeyText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mind" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="🧠 나만 몰랐던 내 마음" icon={<Brain className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={mindText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("🧠 나만 몰랐던 내 마음", mindText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="highlight" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="🎬 미리 보는 하이라이트" icon={<Film className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={highlightText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("🎬 미리 보는 하이라이트", highlightText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mood" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="🗺️ 시간대별 무드 세팅" icon={<Map className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <TextBlock text={moodText} />
                <Button variant="outline" className="w-full" onClick={() => openFull("🗺️ 시간대별 무드 세팅", moodText)}>
                  전체 텍스트 보기
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="evidence" className="rounded-2xl border bg-white/80">
            <AccordionTrigger className="px-4 py-3">
              <TitleRow title="🌙 분석근거" icon={<Moon className="h-5 w-5" />} />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="rounded-2xl border bg-gradient-to-br from-slate-900/80 via-indigo-900/60 to-slate-900/80 p-4 text-white">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <Moon className="h-4 w-4" />
                  분석 근거
                </div>
                <Separator className="mb-3 bg-white/20" />
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="mb-1 text-xs font-semibold text-white/80">사주 분석</div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{sajuBrief}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="mb-1 text-xs font-semibold text-white/80">별자리 분석</div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{astroBrief}</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Dialog open={fullOpen} onOpenChange={setFullOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{fullTitle}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto pr-1">
              <TextBlock text={fullText} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
