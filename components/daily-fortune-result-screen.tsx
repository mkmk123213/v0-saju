"use client";

import { useMemo, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  BookOpen,
  Brain,
  ChevronLeft,
  Clock,
  Coins,
  Eye,
  Film,
  Heart,
  Key,
  Lightbulb,
  Sparkles,
  Stars,
  Sun,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { getSunSignFromBirthDate } from "@/lib/astro";
import { getZodiacAnimal } from "@/lib/saju-lite";

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

function formatBirthDateShort(dateStr?: string) {
  if (!dateStr) return "생년월일 없음";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, mo, da] = dateStr.split("-");
    return `${y}.${mo}.${da}`;
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatBirthTime(timeStr?: string) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  const hour = Number(h);
  const minute = m ? m.padStart(2, "0") : "00";
  if (Number.isNaN(hour)) return null;
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${String(displayHour).padStart(2, "0")}:${minute}`;
}

function sectionText(sections: any, key: string) {
  const v = sections?.[key];
  // ✅ 서버 스키마: sections.overall/money/love/health = string
  if (typeof v === "string") return v.trim();
  // ✅ 구버전 호환: sections.overall.text
  if (typeof v?.text === "string") return String(v.text).trim();
  return "";
}

function TitleRow({
  title,
  icon,
  score,
}: {
  title: string;
  icon: ReactNode;
  score?: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">{icon}</div>
        <div className="font-semibold text-foreground">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        {typeof score === "number" && (
          <div className="min-w-[52px] text-right text-2xl font-bold tabular-nums text-amber-500">{score}</div>
        )}
      </div>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const t = (text ?? "").toString().trim();
  return (
    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
      {t || "내용을 준비 중이야."}
    </p>
  );
}

function Grid9({ todayKeys }: { todayKeys: any }) {
  const items = useMemo(() => {
    const order: Array<[string, string, string]> = [
      ["color", "오늘의 색", "🎨"],
      ["taboo", "오늘의 금기", "🚫"],
      ["talisman", "오늘의 부적", "🧿"],
      ["lucky_spot", "럭키 스팟", "📍"],
      ["number", "행운 숫자", "🔢"],
      ["food", "럭키 푸드", "🍽️"],
      ["item", "소지품", "🎒"],
      ["action", "오늘의 실천", "✅"],
      ["helper", "오늘의 귀인", "🫶"],
    ];
    return order.map(([k, label, emoji]) => {
      const v = todayKeys?.[k]?.value ?? "-";
      return { key: k, label, emoji, value: typeof v === "string" ? v : String(v ?? "-") };
    });
  }, [todayKeys]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.key} className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-500/20 p-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-amber-900/30">
              <span className="text-base">{it.emoji}</span>
            </div>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 text-center">{it.label}</div>
            <div className="text-sm font-semibold text-foreground text-center break-keep">{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DailyFortuneResultScreen({ sajuInput, date, resultSummary, onBack }: Props) {
  const scores = resultSummary?.scores ?? {};
  const sections = resultSummary?.sections ?? {};
  const premium = resultSummary?.premium_algo ?? {};
  const tags = toBadgeTags(resultSummary?.today_keywords);

  const overall = safeInt(scores?.overall, 0);
  const money = safeInt(scores?.money, 0);
  const love = safeInt(scores?.love, 0);
  const health = safeInt(scores?.health, 0);

  const summaryOneLiner = (resultSummary?.today_one_liner ?? "").toString().trim();

  const vibeText = sectionText(sections, "overall");
  const moneyText = sectionText(sections, "money");
  const loveText = sectionText(sections, "love");
  const healthText = sectionText(sections, "health");

  const spine = resultSummary?.spine_chill ?? null;
  const spineText =
    spine && typeof spine === "object"
      ? `${spine?.time_window ?? "오늘"}\n${spine?.prediction ?? ""}\n\n체크포인트: ${spine?.verification ?? ""}`
      : "";

  const cheatkeyText = (premium?.cheatkey ?? "").toString().trim();
  const mindText = (premium?.mind ?? "").toString().trim();
  const highlightText = (premium?.highlight ?? "").toString().trim();
  const moodText = (premium?.mood_setting ?? "").toString().trim();

  const sajuBrief = (resultSummary?.saju_brief ?? "").toString().trim();
  const astroBrief = (resultSummary?.astro_brief ?? "").toString().trim();

  const zodiacAnimal = (resultSummary?.profile_badges?.zodiac_animal ?? getZodiacAnimal(sajuInput?.birthDate ?? "")) as string;
  const sunSign = (resultSummary?.profile_badges?.sun_sign ?? getSunSignFromBirthDate(sajuInput?.birthDate ?? "")) as string;

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
      {/* Orange themed blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-400/20 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-orange-400/15 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-yellow-300/10 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6 relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" className="h-9 px-2 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={onBack}>
            <ChevronLeft className="mr-1 h-5 w-5" />
            이전
          </Button>
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-500" />
            <div className="font-bold text-foreground">오늘의 운세</div>
          </div>
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">{date}</span>
        </div>

        {/* Profile Card - Premium Warm Theme */}
        <Card className="border-none overflow-hidden shadow-xl mb-4">
          <div className="relative px-5 py-5 bg-gradient-to-br from-amber-800/70 via-orange-800/55 to-rose-800/45 dark:from-amber-950/45 dark:via-orange-950/35 dark:to-rose-950/30">
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            
            {/* Soft inner glow */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-200/12 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-rose-200/10 blur-2xl" />
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-white tracking-tight drop-shadow-sm">
                  {sajuInput?.name?.trim() ? sajuInput.name : "이름 없음"}
                </p>
                <p className="mt-1 text-sm text-white/80 font-medium">
                  {formatBirthDateShort(sajuInput?.birthDate)}
                  {formatBirthTime(sajuInput?.birthTime) && ` · ${formatBirthTime(sajuInput?.birthTime)}`}
                  {` · ${sajuInput?.gender === "male" ? "남" : "여"}`}
                  {` · ${sajuInput?.calendarType === "solar" ? "양력" : "음력"}`}
                </p>
              </div>
            </div>

            {(zodiacAnimal || sunSign) && (
              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                {zodiacAnimal && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <Stars className="h-3.5 w-3.5" />
                    {zodiacAnimal}
                  </span>
                )}
                {sunSign && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {sunSign}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* One liner */}
        <Card className="border-none shadow-lg overflow-hidden mb-4 bg-white dark:bg-card">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-100/80 via-orange-50/50 to-transparent dark:from-amber-900/30 dark:via-orange-900/20 dark:to-transparent">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-foreground">오늘 한 줄</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summaryOneLiner || "오늘의 한 줄을 준비 중이야."}</p>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.slice(0, 3).map((t: string) => (
                  <Badge key={t} variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {t.startsWith("#") ? t : `#${t}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Sections */}
        <Accordion type="single" collapsible defaultValue="overall" className="space-y-3">
          <AccordionItem value="overall" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="오늘의 바이브" icon={<Sun className="h-5 w-5 text-amber-500" />} score={overall} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={vibeText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="money" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="머니 컨디션" icon={<Coins className="h-5 w-5 text-amber-500" />} score={money} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={moneyText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="love" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="심쿵 시그널" icon={<Heart className="h-5 w-5 text-rose-500" />} score={love} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={loveText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="health" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="에너지 수치" icon={<Zap className="h-5 w-5 text-orange-500" />} score={health} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={healthText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="spine" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="소름포인트" icon={<Eye className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={spineText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="keywords" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="오늘의 키워드" icon={<Target className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5">
                <Grid9 todayKeys={resultSummary?.today_keys} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="cheat" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="오늘의 운빨 치트키" icon={<Key className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={cheatkeyText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="mind" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="나만 몰랐던 내 마음" icon={<Brain className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={mindText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="highlight" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="미리 보는 하이라이트" icon={<Lightbulb className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={highlightText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="mood" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="시간대별 무드 세팅" icon={<Clock className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={moodText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="evidence" className="border-none">
            <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-card border border-amber-200/50 dark:border-amber-500/20">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-50/50 dark:hover:bg-amber-900/20">
                <TitleRow title="분석근거" icon={<BookOpen className="h-5 w-5 text-amber-500" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Saju Chart Grid */}
                <div className="mb-4 rounded-2xl border border-amber-200 bg-white dark:bg-card dark:border-amber-500/30 overflow-hidden">
                  {/* Header Row */}
                  <div className="grid grid-cols-4 text-center text-xs font-semibold text-muted-foreground border-b border-amber-200 dark:border-amber-500/30">
                    <div className="py-2 border-r border-amber-200 dark:border-amber-500/30">대운</div>
                    <div className="py-2 border-r border-amber-200 dark:border-amber-500/30">연운</div>
                    <div className="py-2 border-r border-amber-200 dark:border-amber-500/30">월운</div>
                    <div className="py-2">일운</div>
                  </div>
                  {/* Heavenly Stems Row */}
                  <div className="grid grid-cols-4">
                    {(resultSummary?.saju_pillars?.heavenly_stems ?? ["丙", "丙", "己", "己"]).map((stem: string, idx: number) => (
                      <div
                        key={`stem-${idx}`}
                        className={`py-3 text-center border-r last:border-r-0 border-amber-200 dark:border-amber-500/30 ${
                          idx < 2 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                        }`}
                      >
                        <div className="text-2xl font-bold text-foreground">{stem.charAt(0)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stem.length > 1 ? stem.slice(1) : ""}</div>
                      </div>
                    ))}
                  </div>
                  {/* Earthly Branches Row */}
                  <div className="grid grid-cols-4">
                    {(resultSummary?.saju_pillars?.earthly_branches ?? ["申", "午", "丑", "亥"]).map((branch: string, idx: number) => (
                      <div
                        key={`branch-${idx}`}
                        className={`py-3 text-center border-r last:border-r-0 border-amber-200 dark:border-amber-500/30 ${
                          idx < 2 ? "bg-yellow-100 dark:bg-yellow-900/30" : idx === 2 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                        }`}
                      >
                        <div className="text-2xl font-bold text-foreground">{branch.charAt(0)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{branch.length > 1 ? branch.slice(1) : ""}</div>
                      </div>
                    ))}
                  </div>
                  {/* Sha Labels Row */}
                  <div className="grid grid-cols-4 text-center text-[10px] text-muted-foreground border-t border-amber-200 dark:border-amber-500/30">
                    {(resultSummary?.saju_pillars?.sha_labels ?? ["겁살", "육해살", "월살", "망신살"]).map((label: string, idx: number) => (
                      <div key={`sha-${idx}`} className="py-1.5 border-r last:border-r-0 border-amber-200 dark:border-amber-500/30">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 dark:border-amber-500/30 p-4">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/80 dark:bg-amber-900/30 p-3">
                      <div className="mb-1 text-xs font-semibold text-amber-600 dark:text-amber-400">사주 분석</div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{sajuBrief || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 dark:bg-amber-900/30 p-3">
                      <div className="mb-1 text-xs font-semibold text-amber-600 dark:text-amber-400">별자리 분석</div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{astroBrief || "-"}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
