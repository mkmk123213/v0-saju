"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Calendar,
  ChevronLeft,
  Cloud,
  Coins,
  Film,
  Heart,
  KeyRound,
  Map,
  Moon,
  Sparkles,
  Stars,
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

function formatBirthDate(dateStr?: string) {
  if (!dateStr) return "생년월일 없음";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, mo, da] = dateStr.split("-");
    return `${y}년 ${Number(mo)}월 ${Number(da)}일`;
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">{icon}</div>
        <div className="font-semibold text-foreground">{title}</div>
      </div>
      <div className="flex items-center gap-2">
        {typeof score === "number" && (
          <div className="min-w-[52px] text-right text-2xl font-bold tabular-nums text-foreground">{score}</div>
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
        <div key={it.key} className="rounded-2xl border bg-muted/30 p-3">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background">
              <span className="text-base">{it.emoji}</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center">{it.label}</div>
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
    setFullText((text ?? "").toString());
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

  const vibeText = sectionText(sections, "overall");
  const moneyText = sectionText(sections, "money");
  const loveText = sectionText(sections, "love");
  const healthText = sectionText(sections, "health");

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

  const zodiacAnimal = (resultSummary?.profile_badges?.zodiac_animal ?? getZodiacAnimal(sajuInput?.birthDate ?? "")) as string;
  const sunSign = (resultSummary?.profile_badges?.sun_sign ?? getSunSignFromBirthDate(sajuInput?.birthDate ?? "")) as string;

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden starfield">
      {/* cosmic blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-accent/15 blur-[80px]" />
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6 relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" className="h-9 px-2" onClick={onBack}>
            <ChevronLeft className="mr-1 h-5 w-5" />
            이전
          </Button>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" />
            <div className="font-bold text-foreground">오늘의 운세</div>
          </div>
          <span className="rounded-full gradient-primary px-2.5 py-0.5 text-xs font-bold text-white">{date}</span>
        </div>

        {/* Profile Card (기존 프로필 카드 톤으로 통일) */}
        <Card className="border-none overflow-hidden shadow-xl glass mb-4">
          <div className="relative px-5 py-5 gradient-cosmic">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-3 right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-8 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Stars className="h-4 w-4 text-white/90" />
                <span className="text-sm font-medium text-white/90">오늘의 운세 보기</span>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                결과
              </span>
            </div>

            <div className="relative mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-white">
                  {sajuInput?.name?.trim() ? sajuInput.name : "이름 없음"}
                </p>
                <p className="mt-0.5 text-xs text-white/80">선택한 프로필의 오늘 운세</p>
              </div>
            </div>
          </div>

          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>생년월일</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatBirthDate(sajuInput?.birthDate)}</p>
              </div>

              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>성별</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {sajuInput?.gender === "male" ? "남성" : "여성"}
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Moon className="h-3.5 w-3.5" />
                  <span>달력</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {sajuInput?.calendarType === "solar" ? "양력" : "음력"}
                </p>
              </div>
            </div>

            {(zodiacAnimal || sunSign) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {zodiacAnimal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Stars className="h-3.5 w-3.5 text-primary" />
                    {zodiacAnimal}
                  </span>
                )}
                {sunSign && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {sunSign}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* One liner */}
        <Card className="border-none glass shadow-lg overflow-hidden mb-4">
          <div className="px-5 py-4 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground">오늘 한 줄</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{summaryOneLiner || "오늘의 한 줄을 준비 중이야."}</p>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.slice(0, 3).map((t: string) => (
                  <Badge key={t} variant="secondary" className="bg-primary/10 text-primary">
                    {t.startsWith("#") ? t : `#${t}`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Sections */}
        <Accordion type="single" collapsible defaultValue="overall" className="space-y-2">
          <AccordionItem value="overall" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="오늘의 바이브" icon={<Cloud className="h-5 w-5" />} score={overall} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={vibeText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("오늘의 바이브", vibeText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="money" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="머니 컨디션" icon={<Coins className="h-5 w-5" />} score={money} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={moneyText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("머니 컨디션", moneyText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="love" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="심쿵 시그널" icon={<Heart className="h-5 w-5" />} score={love} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={loveText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("심쿵 시그널", loveText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="health" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="에너지 수치" icon={<Zap className="h-5 w-5" />} score={health} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={healthText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("에너지 수치", healthText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="spine" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="소름포인트" icon={<Zap className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <TextBlock text={spineText} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="keywords" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="오늘의 키워드" icon={<KeyRound className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-5">
                <Grid9 todayKeys={resultSummary?.today_keys} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="cheat" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="오늘의 운빨 치트키" icon={<KeyRound className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={cheatkeyText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("오늘의 운빨 치트키", cheatkeyText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="mind" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="나만 몰랐던 내 마음" icon={<Brain className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={mindText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("나만 몰랐던 내 마음", mindText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="highlight" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="미리 보는 하이라이트" icon={<Film className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={highlightText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("미리 보는 하이라이트", highlightText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="mood" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="시간대별 무드 세팅" icon={<Map className="h-5 w-5" />} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <TextBlock text={moodText} />
                  <Button variant="outline" className="w-full" onClick={() => openFull("시간대별 무드 세팅", moodText)}>
                    전체 텍스트 보기
                  </Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="evidence" className="border-none">
            <Card className="border-none glass shadow-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <TitleRow title="분석근거" icon={<Moon className="h-5 w-5" />} />
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
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{sajuBrief || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <div className="mb-1 text-xs font-semibold text-white/80">별자리 분석</div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">{astroBrief || "-"}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </Card>
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
