import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAstroSummary, getSunSignFromBirthDate } from "@/lib/astro";
import { buildSajuLiteSummary, getZodiacAnimal } from "@/lib/saju-lite";
import { buildSajuChart, buildTodayLuckChart } from "@/lib/saju-chart";

export const runtime = "nodejs";

function clampInt(n: any, min = 0, max = 100) {
  let x = 0;
  if (typeof n === "number" && Number.isFinite(n)) x = n;
  else if (typeof n === "string") {
    const p = Number.parseFloat(n);
    if (Number.isFinite(p)) x = p;
  }
  const r = Math.round(x);
  return Math.max(min, Math.min(max, r));
}

function hashStr(s: string) {
  // simple deterministic hash (FNV-1a like)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function defaultScores(seed: {
  dayStemElement?: string | null;
  dayGanji?: string | null;
  sunSign?: string | null;
  zodiac?: string | null;
  luckDayGanji?: string | null;
}) {
  const base = `${seed.dayStemElement ?? ""}|${seed.dayGanji ?? ""}|${seed.luckDayGanji ?? ""}|${seed.sunSign ?? ""}|${seed.zodiac ?? ""}`;
  const h = hashStr(base);
  const pick = (offset: number, min: number, max: number) => {
    const span = Math.max(1, max - min + 1);
    const v = (hashStr(`${h}:${offset}`) % span) + min;
    return v;
  };
  // 꽤 그럴듯한 범위 (너무 낮게 안 나오게)
  const overall = pick(1, 52, 88);
  const money = pick(2, 45, 85);
  const love = pick(3, 45, 85);
  const health = pick(4, 48, 90);
  return { overall, money, love, health };
}

function makeDefaultKeywords(seed: { dayStemElement?: string | null; sunSign?: string | null }) {
  // 역할 분리(주의/기회/태도) 기본 3개
  const byElement: Record<string, [string, string, string]> = {
    "목": ["#새싹스타트", "#아이디어발아", "#루틴쌓기"],
    "화": ["#말조심이보약", "#아이디어폭발", "#속도조절"],
    "토": ["#페이스조절", "#정리정돈", "#내적성장데이"],
    "금": ["#정리정돈", "#선긋기가능", "#선택과집중"],
    "수": ["#감정정리", "#흐름타기", "#직감주의"],
  };
  const el = seed.dayStemElement ?? "토";
  const base = byElement[el] ?? byElement["토"];

  // 별자리 약간의 개성만 덧씌우기(단, 재현성/단순성 유지)
  const sun = seed.sunSign ?? "";
  if (sun.includes("사자")) return [base[0], "#존재감상승", base[2]];
  if (sun.includes("처녀")) return [base[0], "#디테일점검", base[2]];
  if (sun.includes("물고기")) return [base[0], "#감수성리듬", base[2]];
  return base;
}

function makeOneLiner(keywords: string[]) {
  // 키워드를 그대로 박지 않고 분위기로 녹여내는 짧은 1문장
  // (UI에서 한눈에 보이도록 25~60자 정도)
  const k = keywords.map((s) => s.replace(/^#/, "")).slice(0, 3);
  const moodA = k[0] ?? "조심";
  const moodB = k[1] ?? "기회";
  const moodC = k[2] ?? "성장";
  return `오늘은 ${moodA}로 균형 잡고, ${moodB}를 살려 ${moodC}로 마무리하는 날이야.`;
}

function tokenFromStem(stemKor?: string | null, stemElement?: string | null) {
  if (!stemKor || !stemElement) return "";
  const m: Record<string, string> = { 갑: "갑", 을: "을", 병: "병", 정: "정", 무: "무", 기: "기", 경: "경", 신: "신", 임: "임", 계: "계" };
  const s = m[stemKor] ?? "";
  return s && stemElement ? `${s}${stemElement}` : "";
}

function tokenFromBranch(branchKor?: string | null, branchElement?: string | null) {
  if (!branchKor || !branchElement) return "";
  const b = `${branchKor}${branchElement}`;
  return b;
}

function ensureMentions(text: string, mustInclude: string[]) {
  const t = (text ?? "").toString();
  const missing = mustInclude.filter((m) => m && !t.includes(m));
  if (missing.length === 0) return t;
  const suffix = ` (근거: ${missing.slice(0, 2).join("·")})`;
  return (t + suffix).trim();
}

function normalizeSpineChill(seedKey: string) {
  // 다양한 일상 시나리오를 deterministic하게 뽑아 반복을 줄임
  const h = hashStr(seedKey);
  const pick = <T,>(arr: T[]) => arr[h % arr.length];
  const time = pick(["오전", "점심", "오후", "저녁"]);

  // "친구" 편중 방지: 직장/메신저/결제/지연/실수/문서/기기/가족/헬스/이동 등으로 분산
  const scenarios = [
    {
      prediction: "알림이 한꺼번에 와서 답장 순서가 꼬일 수 있어.",
      verification: "메신저/메일 미확인 뱃지 3개 이상 뜨는지",
    },
    {
      prediction: "결제 직전에 ‘한 번 더’ 확인할 항목이 튀어나와.",
      verification: "정기결제/장바구니에서 삭제 1건 생기는지",
    },
    {
      prediction: "회의/전화에서 한 단어 때문에 오해가 생길 뻔해.",
      verification: "‘그 말은 이런 뜻?’ 확인 질문이 오가는지",
    },
    {
      prediction: "작업/문서에서 숫자·날짜가 한 번 헷갈릴 수 있어.",
      verification: "수정 이력/재전송이 1번 생기는지",
    },
    {
      prediction: "이동 중 갑작스런 지연으로 스케줄이 10분 밀릴 수 있어.",
      verification: "버스/지하철/택시 대기 시간이 평소보다 늘었는지",
    },
    {
      prediction: "몸이 먼저 신호를 줘서 ‘쉬어야 할 타이밍’이 와.",
      verification: "어깨·목 뻐근함이 느껴져 스트레칭을 하게 되는지",
    },
    {
      prediction: "생각보다 빨리 ‘도와줄 사람 유형’이 등장해 진행이 풀려.",
      verification: "모르는 번호/동료/상담원이 해결 키워드를 주는지",
    },
    {
      prediction: "기기/앱에서 로그인·인증이 한 번 더 요구될 수 있어.",
      verification: "인증 문자/OTP가 추가로 필요한지",
    },
    {
      prediction: "집안/가족 쪽에서 작은 부탁이 들어올 가능성이 있어.",
      verification: "장보기/정리/확인 요청 같은 연락이 오는지",
    },
    {
      prediction: "무심코 한 말이 ‘말조심’ 포인트로 돌아올 수 있어.",
      verification: "농담/표현을 정정하거나 웃으며 수습하는지",
    },
  ];

  const s = pick(scenarios);
  return { prediction: s.prediction, time_window: time, verification: s.verification };
}

function countLines(s: string) {
  return (s.match(/\n/g) || []).length + 1;
}

function stemLabel(stemKor?: string | null, stemEl?: string | null) {
  if (!stemKor || !stemEl) return "";
  return `${stemKor}${stemEl}`;
}

function branchLabel(branchKor?: string | null, branchEl?: string | null) {
  if (!branchKor || !branchEl) return "";
  return `${branchKor}${branchEl}`;
}

function asHashtagWord(tag: string) {
  return tag.replace(/^#/, "").trim();
}

function buildSajuLongBrief(args: {
  day?: any;
  month?: any;
  luckDay?: any;
  luckMonth?: any;
  luckYear?: any;
  labels?: any;
  keywords: string[];
}) {
  const day = args.day;
  const month = args.month;
  const ld = args.luckDay;
  const lm = args.luckMonth;
  const ly = args.luckYear;
  const labels = args.labels || {};

  const kw = args.keywords.map(asHashtagWord);
  const k1 = kw[0] || "조심";
  const k2 = kw[1] || "기회";
  const k3 = kw[2] || "성장";

  const dayStem = stemLabel(day?.stem_kor, day?.stem_element);
  const dayBr = branchLabel(day?.branch_kor, day?.branch_element);
  const ldStem = stemLabel(ld?.stem_kor, ld?.stem_element);
  const ldBr = branchLabel(ld?.branch_kor, ld?.branch_element);
  const lmBr = branchLabel(lm?.branch_kor, lm?.branch_element);
  const lyBr = branchLabel(ly?.branch_kor, ly?.branch_element);

  const sinsalDay = labels?.day ? `${labels.day}` : "";
  const sinsalMonth = labels?.month ? `${labels.month}` : "";
  const sinsalYear = labels?.year ? `${labels.year}` : "";

  const lines: string[] = [];
  lines.push(`오늘의 중심축은 일간 ${dayStem}과 일운 ${ldStem}의 맞물림이야. 강하게 밀기보다 한 박자 조절이 운을 살려.`);
  lines.push(`일지 ${dayBr}가 받아들이는 감정은 예민해질 수 있어. 메신저 답장은 ${k1} 모드로 짧고 정확하게.`);
  lines.push(`월주의 기운은 생활 리듬을 정리하라고 말해. 책상·메모·일정을 ${k3} 쪽으로 ‘정돈’하면 집중력이 바로 올라와.`);
  lines.push(`금전은 ‘작은 새는 큰 새를 부른다’ 쪽이야. 결제 전 10초 멈춤이 ${k2}를 진짜 기회로 바꿔줘.`);
  lines.push(`관계는 일운의 ${ldBr} 흐름을 타서 오해가 빨리 생기고 빨리 풀려. 확인 질문 한 번이 감정 소설을 끊어줘.`);
  lines.push(`컨디션은 따뜻한 물+가벼운 걷기로 균형이 잡혀. 특히 오후에 몸이 처지면 8~12분만 밖 공기 마셔.`);
  lines.push(`오늘 신살 흐름은 ${[sinsalDay, sinsalMonth, sinsalYear].filter(Boolean).join("·") || "(신살 정보)"} 쪽이야. 체면보다 ‘실속’ 선택이 손해를 막아.`);
  lines.push(`한 줄 처방: ${k1}로 말의 속도를 낮추고, ${k2}는 작은 실행으로 잡고, ${k3}는 루틴으로 남겨.`);
  return lines.join("\n");
}

function buildAstroLongBrief(args: { sunSign: string; keywords: string[]; luckDay?: any; luckMonth?: any }) {
  const sun = args.sunSign || "";
  const kw = args.keywords.map(asHashtagWord);
  const k1 = kw[0] || "조심";
  const k2 = kw[1] || "기회";
  const k3 = kw[2] || "성장";

  const ld = args.luckDay;
  const lm = args.luckMonth;
  const ldEl = ld?.stem_element ? `${ld.stem_element}` : "";
  const lmEl = lm?.stem_element ? `${lm.stem_element}` : "";

  const trait: Record<string, { strength: string; pitfall: string; tip: string }> = {
    "사자자리": { strength: "표현력·리더십", pitfall: "자존심 과열", tip: "칭찬은 받되 결정은 차분히" },
    "처녀자리": { strength: "디테일·정리력", pitfall: "완벽주의", tip: "80%에서 일단 실행" },
    "염소자리": { strength: "책임감·실리", pitfall: "자기압박", tip: "업무 경계선을 그어" },
    "물고기자리": { strength: "공감·직감", pitfall: "감정 과몰입", tip: "사실/감정 분리" },
  };
  const t = trait[sun] || { strength: "균형 감각", pitfall: "우유부단", tip: "기준 1개만 정해" };

  const lines: string[] = [];
  lines.push(`${sun}의 강점은 ${t.strength}이야. 오늘은 그 장점이 ‘눈에 띄게’ 작동하지만, 속도는 ${k1}로 조절해야 돼.`);
  lines.push(`오늘의 흐름(${ldEl} 기운)가 올라오면 말·결정이 빨라져. 회의나 채팅에선 한 번 더 확인하고 보내.`);
  lines.push(`반대로 ${lmEl} 흐름이 받쳐주면 정리·점검에서 ${k2}가 열려. ‘수정’이 곧 성과로 연결되는 날이야.`);
  lines.push(`사람 관계에서는 ${t.pitfall}이 스위치처럼 켜질 수 있어. 상대의 말에 의미를 덧씌우기 전에 사실부터 체크.`);
  lines.push(`연애/썸은 긴 고백보다 짧은 안부가 더 강해. 오늘은 ‘가볍게 자주’가 매력 포인트.`);
  lines.push(`일은 한 번에 크게 하기보다 2~3개의 작은 완료로 ${k3}를 쌓는 쪽이 맞아. 체크리스트가 최고의 마법.`);
  lines.push(`컨디션은 눈·어깨·호흡이 신호야. 5분 스트레칭+물 한 컵만으로도 텐션이 바뀐다.`);
  lines.push(`오늘의 팁: ${t.tip}. 그리고 ‘잘한 것 1개’를 기록하면 내일 운이 더 부드럽게 이어져.`);
  return lines.join("\n");
}

function normalizeDailyResultSummary(
  rs: any,
  profile: any,
  sajuChart: any | null,
  todayLuckChart: any | null
) {
  const out: any = rs && typeof rs === "object" ? rs : {};

  // --- fixed ganji tokens (to reduce internal inconsistency) ---
  const d = sajuChart?.pillars?.day;
  const ld = todayLuckChart?.pillars?.day;
  const lm = todayLuckChart?.pillars?.month;
  const ly = todayLuckChart?.pillars?.year;
  const dw = todayLuckChart?.pillars?.daewoon;
  const dayStemTok = tokenFromStem(d?.stem_kor, d?.stem_element);
  const dayBranchTok = tokenFromBranch(d?.branch_kor, d?.branch_element);
  const luckDayStemTok = tokenFromStem(ld?.stem_kor, ld?.stem_element);
  const luckDayBranchTok = tokenFromBranch(ld?.branch_kor, ld?.branch_element);
  const luckMonthStemTok = tokenFromStem(lm?.stem_kor, lm?.stem_element);
  const luckMonthBranchTok = tokenFromBranch(lm?.branch_kor, lm?.branch_element);
  const luckYearStemTok = tokenFromStem(ly?.stem_kor, ly?.stem_element);
  const luckYearBranchTok = tokenFromBranch(ly?.branch_kor, ly?.branch_element);
  const daewoonStemTok = tokenFromStem(dw?.stem_kor, dw?.stem_element);
  const daewoonBranchTok = tokenFromBranch(dw?.branch_kor, dw?.branch_element);
  const mustDaily = [dayStemTok || dayBranchTok, luckDayStemTok || luckDayBranchTok].filter(Boolean);

  // profile_badges
  out.profile_badges = out.profile_badges && typeof out.profile_badges === "object" ? out.profile_badges : {};
  out.profile_badges.zodiac_animal =
    typeof out.profile_badges.zodiac_animal === "string" && out.profile_badges.zodiac_animal.trim()
      ? out.profile_badges.zodiac_animal
      : getZodiacAnimal(profile.birth_date) ?? "";
  out.profile_badges.sun_sign =
    typeof out.profile_badges.sun_sign === "string" && out.profile_badges.sun_sign.trim()
      ? out.profile_badges.sun_sign
      : getSunSignFromBirthDate(profile.birth_date) ?? "";

  // today_keywords
  const dayStemEl = d?.stem_element ?? null;
  const sunSign = out.profile_badges.sun_sign ?? null;
  if (!Array.isArray(out.today_keywords) || out.today_keywords.filter((x: any) => typeof x === "string" && x.trim()).length < 3) {
    out.today_keywords = makeDefaultKeywords({ dayStemElement: dayStemEl, sunSign });
  } else {
    out.today_keywords = out.today_keywords.filter((x: any) => typeof x === "string").slice(0, 3);
  }

  // today_one_liner
  if (typeof out.today_one_liner !== "string" || !out.today_one_liner.trim()) {
    out.today_one_liner = makeOneLiner(out.today_keywords);
  }

  // saju/astro briefs(절대 비지 않게)
  if (typeof out.saju_brief !== "string" || !out.saju_brief.trim()) {
    const t = ld
    out.saju_brief = d && t
      ? `일주 ${d.ganji_kor}의 ${d.stem_element} 기운이 오늘 일운 ${t.ganji_kor}의 ${t.branch_element}와 만나, 속도 조절이 핵심이야.`
      : "사주 흐름을 기준으로 오늘은 ‘속도 조절’이 핵심이야.";
  }
  if (typeof out.astro_brief !== "string" || !out.astro_brief.trim()) {
    const sun = out.profile_badges.sun_sign || ""
    out.astro_brief = sun ? `${sun} 성향은 오늘 ‘디테일 점검’이 운을 지켜줘.` : "별자리 흐름상 오늘은 디테일 점검이 운을 지켜줘.";
  }

  // 모델이 짧게 쓰는 경우가 많아서(UX/신뢰감 저하),
  // 최소 7~8줄(줄바꿈 포함) 분량으로 서버에서 보정해준다.
  if (typeof out.saju_brief === "string") {
    const tooShort = out.saju_brief.trim().length < 260 || countLines(out.saju_brief) < 6;
    if (tooShort) {
      out.saju_brief = buildSajuLongBrief({
        day: sajuChart?.pillars?.day,
        month: sajuChart?.pillars?.month,
        luckDay: todayLuckChart?.pillars?.day,
        luckMonth: todayLuckChart?.pillars?.month,
        luckYear: todayLuckChart?.pillars?.year,
        labels: todayLuckChart?.labels,
        keywords: out.today_keywords ?? [],
      });
    }
  }

  if (typeof out.astro_brief === "string") {
    const tooShort = out.astro_brief.trim().length < 260 || countLines(out.astro_brief) < 6;
    if (tooShort) {
      out.astro_brief = buildAstroLongBrief({
        sunSign: out.profile_badges.sun_sign ?? "",
        keywords: out.today_keywords ?? [],
        luckDay: todayLuckChart?.pillars?.day,
        luckMonth: todayLuckChart?.pillars?.month,
      });
    }
  }

  // evidence(절대 비지 않게)
  out.evidence = out.evidence && typeof out.evidence === "object" ? out.evidence : {};
  if (!Array.isArray(out.evidence.saju) || out.evidence.saju.length === 0) {
    const d = sajuChart?.pillars?.day
    const t = todayLuckChart?.pillars?.day
    const y = todayLuckChart?.pillars?.year
    out.evidence.saju = [
      d ? `일주: ${d.ganji_hanja}(${d.ganji_kor}) / 일간 ${d.stem_kor}(${d.stem_element}) 중심` : "일주 정보를 기반으로 해석",
      t ? `오늘 일운: ${t.ganji_hanja}(${t.ganji_kor}) / 일지 ${t.branch_kor}(${t.branch_element}) 영향` : "오늘 일운 흐름 반영",
      y ? `오늘 연운: ${y.ganji_hanja}(${y.ganji_kor}) / 큰 기조(장기 흐름) 참고` : "연운(큰 기조) 참고",
    ].filter(Boolean);
  }
  if (!Array.isArray(out.evidence.astro) || out.evidence.astro.length === 0) {
    const sun = out.profile_badges.sun_sign || ""
    const zodiac = out.profile_badges.zodiac_animal || ""
    out.evidence.astro = [
      sun ? `태양별자리: ${sun} (기본 성향/컨디션의 기준점)` : "태양별자리 기반",
      zodiac ? `띠: ${zodiac} (관계/리듬의 습관 패턴 참고)` : "띠 기반",
      "오늘의 키워드 3개는 ‘주의/기회/태도’로 분리해 한눈에 보이게 구성",
    ].filter(Boolean);
  }

  // section_evidence(절대 비지 않게)
  out.section_evidence = out.section_evidence && typeof out.section_evidence === "object" ? out.section_evidence : {};
  const secFallback: Record<string, string[]> = {
    overall: ["일간/일지의 오행 균형으로 하루 템포를 결정", "연·월·일운의 충돌/보완을 종합"],
    money: ["재성/관성 흐름을 ‘지출 통제 vs 기회’로 해석", "충동구매 유발 신호(급한 화기운 등) 체크"],
    love: ["일지(관계감정)와 오늘 일운의 상호작용 반영", "별자리 성향(대화 스타일)을 같이 적용"],
    health: ["오행 과부족을 생활 루틴(수면/수분/걷기)로 번역", "오늘의 리듬 변화(수·화 충돌 등)를 컨디션 신호로 사용"],
  };
  (Object.keys(secFallback) as (keyof typeof secFallback)[]).forEach((k) => {
    if (!Array.isArray(out.section_evidence[k]) || out.section_evidence[k].length === 0) out.section_evidence[k] = secFallback[k];
    out.section_evidence[k] = out.section_evidence[k].filter((x: any) => typeof x === "string" && x.trim()).slice(0, 3);
  });

  // sections(절대 비지 않게)
  out.sections = out.sections && typeof out.sections === "object" ? out.sections : {};
  const fallback = {
    overall: "오늘은 흐름이 빠르게 바뀌니, 말보다 한 템포 쉬고 움직여.",
    money: "지출은 ‘필요’만 남기고, 결제 버튼 앞에서 10초만 멈춰.",
    love: "오해는 번개처럼 생겨—짧게 확인하고 길게 상상은 금지.",
    health: "몸이 예민해지기 쉬워. 따뜻한 물과 10분 산책이 답이야.",
  };
  (Object.keys(fallback) as (keyof typeof fallback)[]).forEach((k) => {
    const v = out.sections?.[k];
    if (typeof v !== "string" || !v.trim()) out.sections[k] = fallback[k];
  });

  // 내부 통일성: 각 섹션에 '실제 계산된' 간지 단서가 최소 2개는 반드시 들어가도록 보정
  // (모델이 다른 간지를 섞어 말이 안 맞는 경우 UX 신뢰감이 크게 떨어져서 방어)
  out.sections.overall = ensureMentions(out.sections.overall, [...mustDaily, daewoonStemTok || daewoonBranchTok, luckYearStemTok || luckYearBranchTok].filter(Boolean) as string[]);
  out.sections.money = ensureMentions(out.sections.money, [...mustDaily, luckMonthStemTok || luckMonthBranchTok].filter(Boolean) as string[]);
  out.sections.love = ensureMentions(out.sections.love, [...mustDaily, luckDayBranchTok || luckMonthBranchTok].filter(Boolean) as string[]);
  out.sections.health = ensureMentions(out.sections.health, [...mustDaily, luckDayStemTok || luckMonthStemTok].filter(Boolean) as string[]);

  // spine_chill: "친구" 편중 방지 + 캐시/모델 편차 방어
  const seedKey = `${profile?.id ?? profile?.user_id ?? "user"}|${ld?.ganji_kor ?? ""}|${lm?.ganji_kor ?? ""}|${ly?.ganji_kor ?? ""}`;
  const sc = out.spine_chill && typeof out.spine_chill === "object" ? out.spine_chill : null;
  const pred = typeof sc?.prediction === "string" ? sc.prediction : "";
  const tooGeneric = !pred.trim() || pred.trim().length < 12;
  const friendBiased = /(친구|지인|동창|썸|애인)/.test(pred);
  if (!sc || tooGeneric || friendBiased) {
    out.spine_chill = normalizeSpineChill(seedKey);
  } else {
    // time_window 정규화
    const tw = typeof sc.time_window === "string" ? sc.time_window : "";
    const ok = ["오전", "점심", "오후", "저녁"].includes(tw);
    out.spine_chill = {
      prediction: sc.prediction,
      time_window: ok ? sc.time_window : "오후",
      verification: typeof sc.verification === "string" && sc.verification.trim() ? sc.verification : "오늘 실제로 확인 가능한 1가지가 있었는지",
    };
  }

  // ensure each section mentions the computed tokens at least once (prevents "말이 안 맞는" 느낌)
  (Object.keys(out.sections) as (keyof typeof out.sections)[]).forEach((k) => {
    const v = out.sections?.[k];
    if (typeof v === "string" && v.trim() && mustDaily.length) {
      out.sections[k] = ensureMentions(v, mustDaily);
    }
  });

  // scores
  out.scores = out.scores && typeof out.scores === "object" ? out.scores : {};
  out.scores.overall = clampInt(out.scores.overall);
  out.scores.money = clampInt(out.scores.money);
  out.scores.love = clampInt(out.scores.love);
  out.scores.health = clampInt(out.scores.health);

  // 모델이 스키마 예시를 따라 0을 그대로 내보내는 경우가 많아서,
  // 0(또는 비어있음)일 때는 입력 기반으로 "그럴듯한" 점수를 서버에서 보정한다.
  const needFix =
    out.scores.overall === 0 ||
    out.scores.money === 0 ||
    out.scores.love === 0 ||
    out.scores.health === 0;
  if (needFix) {
    const d = sajuChart?.pillars?.day;
    const t = todayLuckChart?.pillars?.day;
    const seed = defaultScores({
      dayStemElement: d?.stem_element ?? null,
      dayGanji: d?.ganji_kor ?? null,
      luckDayGanji: t?.ganji_kor ?? null,
      sunSign: out.profile_badges?.sun_sign ?? null,
      zodiac: out.profile_badges?.zodiac_animal ?? null,
    });
    out.scores.overall = out.scores.overall || seed.overall;
    out.scores.money = out.scores.money || seed.money;
    out.scores.love = out.scores.love || seed.love;
    out.scores.health = out.scores.health || seed.health;
  }

  // 서버 계산 표는 최종 주입
  // (요청사항: 사주 표(saju_chart)는 UI에서 제거. 오늘의 흐름만 제공)
  if (todayLuckChart) out.today_luck_chart = todayLuckChart;

  // also ensure saju/astro briefs include at least one computed token so the story doesn't drift
  if (typeof out.saju_brief === "string" && out.saju_brief.trim() && mustDaily.length) {
    out.saju_brief = ensureMentions(out.saju_brief, [mustDaily[0]]);
  }
  if (typeof out.astro_brief === "string" && out.astro_brief.trim() && mustDaily.length) {
    out.astro_brief = ensureMentions(out.astro_brief, [mustDaily[1] ?? mustDaily[0]]);
  }

  return out;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

function getSupabaseAdmin() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) throw new Error("SUPABASE_URL_MISSING");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAIKey() {
  return env("OPENAI_API_KEY");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retry on transient errors (429 rate limit, 5xx).
 * Do NOT retry on insufficient_quota.
 */
async function fetchWithRetry(fetcher: () => Promise<Response>, retries = 3) {
  let lastRes: Response | null = null;

  for (let i = 0; i < retries; i++) {
    const res = await fetcher();
    lastRes = res;

    if (res.ok) return res;

    const status = res.status;
    const text = await res.clone().text();

    if (status === 429 && text.includes("insufficient_quota")) return res;

    if (status === 429 || status >= 500) {
      await sleep(500 * Math.pow(2, i));
      continue;
    }

    return res;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return lastRes!;
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    const user_id = userData?.user?.id;
    if (userErr || !user_id) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

    const body = await req.json();
    const { profile_id, type = "daily", target_date = null, target_year = null } = body ?? {};
    if (!profile_id) return NextResponse.json({ error: "missing_profile_id" }, { status: 400 });

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", user_id)
      .single();

    if (pErr || !profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

    // 서버 계산(캐시 반환 시에도 UI가 깨지지 않도록 항상 준비)
    const sajuChart = buildSajuChart(profile.birth_date, profile.birth_time_code);
    const todayLuckChart = type === "daily" && target_date
      ? buildTodayLuckChart(profile.birth_date, profile.birth_time_code, profile.gender, String(target_date))
      : null;

    // ✅ Cache: 동일 프로필/타입/날짜(또는 연도)로 이미 생성된 요약이 있으면 OpenAI 호출 없이 반환
    const cacheBase = supabaseAdmin
      .from("readings")
      .select("id,result_summary,created_at")
      .eq("user_id", user_id)
      .eq("profile_id", profile_id)
      .eq("type", type);

    const isDaily = type === "daily";
    const isYearlyLike = type === "yearly" || type === "saju";

    const cached =
      isDaily && target_date
        ? await cacheBase.eq("target_date", target_date).order("created_at", { ascending: false }).limit(1).maybeSingle()
        : isYearlyLike && target_year
          ? await cacheBase.eq("target_year", target_year).order("created_at", { ascending: false }).limit(1).maybeSingle()
          : await cacheBase.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (cached?.data?.id && cached.data.result_summary) {
      const normalized = type === "daily"
        ? normalizeDailyResultSummary(cached.data.result_summary, profile, sajuChart, todayLuckChart)
        : cached.data.result_summary;
      return NextResponse.json({
        reading_id: cached.data.id,
        result_summary: normalized,
        cached: true,
      });
    }

    const astro_summary = buildAstroSummary(profile.birth_date);
    const saju_summary = buildSajuLiteSummary(profile.birth_date, profile.birth_time_code);

    // 프롬프트에 넣을 "간지 근거"(짧고 재현 가능한 형태)
    const sajuCompact = sajuChart
      ? `연주:${sajuChart.pillars.year.ganji_kor} 월주:${sajuChart.pillars.month.ganji_kor} 일주:${sajuChart.pillars.day.ganji_kor}`
      : "";
    const sajuCompact2 = sajuChart
      ? `일간:${sajuChart.pillars.day.stem_kor}(${sajuChart.pillars.day.stem_element}) / 일지:${sajuChart.pillars.day.branch_kor}(${sajuChart.pillars.day.branch_element})`
      : "";
    const luckCompact = todayLuckChart
      ? `대운:${todayLuckChart.pillars.daewoon?.ganji_kor ?? "-"} 연운:${todayLuckChart.pillars.year.ganji_kor} 월운:${todayLuckChart.pillars.month.ganji_kor} 일운:${todayLuckChart.pillars.day.ganji_kor}`
      : "";

    // 모델이 간지/오행을 섞어 말이 안 맞는 경우가 많아,
    // "사용 가능한 토큰"을 프롬프트에 명시해 통일성을 올린다.
    const dTokStem = tokenFromStem(sajuChart?.pillars?.day?.stem_kor, sajuChart?.pillars?.day?.stem_element);
    const dTokBranch = tokenFromBranch(sajuChart?.pillars?.day?.branch_kor, sajuChart?.pillars?.day?.branch_element);
    const ldTokStem = tokenFromStem(todayLuckChart?.pillars?.day?.stem_kor, todayLuckChart?.pillars?.day?.stem_element);
    const ldTokBranch = tokenFromBranch(todayLuckChart?.pillars?.day?.branch_kor, todayLuckChart?.pillars?.day?.branch_element);
    const lmTokStem = tokenFromStem(todayLuckChart?.pillars?.month?.stem_kor, todayLuckChart?.pillars?.month?.stem_element);
    const lmTokBranch = tokenFromBranch(todayLuckChart?.pillars?.month?.branch_kor, todayLuckChart?.pillars?.month?.branch_element);
    const lyTokStem = tokenFromStem(todayLuckChart?.pillars?.year?.stem_kor, todayLuckChart?.pillars?.year?.stem_element);
    const lyTokBranch = tokenFromBranch(todayLuckChart?.pillars?.year?.branch_kor, todayLuckChart?.pillars?.year?.branch_element);
    const dwTokStem = tokenFromStem(todayLuckChart?.pillars?.daewoon?.stem_kor, todayLuckChart?.pillars?.daewoon?.stem_element);
    const dwTokBranch = tokenFromBranch(todayLuckChart?.pillars?.daewoon?.branch_kor, todayLuckChart?.pillars?.daewoon?.branch_element);
    const allowedGanjiTokens = [dTokStem, dTokBranch, ldTokStem, ldTokBranch, lmTokStem, lmTokBranch, lyTokStem, lyTokBranch, dwTokStem, dwTokBranch].filter(Boolean);

    const system = `너는 "사주(동양) + 서양 점성술(별자리)"을 결합해
짧고 강렬하게, 근거가 살아있는 한국어 운세를 쓰는 전문가야.

말투:
- 무조건 반말체, 친근하고 스윗하게. 존댓말 금지.

목표:
- 읽는 사람이 "소름"이라고 느낄 만큼 구체적이고 정확해 보이게 써.
- 공포 조장/단정적 불행 예언/의학·법률 단정은 금지.
- 오늘 하루에 초점을 맞춘 실천 조언을 줘.

문장 스타일(중요):
- 예시처럼 "일주/일운" 같은 간지를 자연스럽게 끼워 넣되, 문장은 예시의 절반 길이로 더 압축해.
- today_one_liner: 1문장, 18~35자 정도의 은유/이미지(너무 길게 쓰지 마).
- today_keywords: 해시태그 3개(각각 '주의/기회/태도' 역할) — 짧고 눈에 띄게.
- sections.overall/money/love/health: 각각 2~4문장(기존의 2배 분량), 사주+별자리 근거가 보이게.
- saju_brief/astro_brief: 각각 8~12문장(현재의 약 5배 분량), 근거 키워드(일간/일지/태양별자리)를 꼭 포함.
- 흔한 덕담/추상적 조언 금지. ("긍정적으로" "힘내" 같은 문장 금지)
- 각 섹션마다 "오늘 실제로 일어날 법한 장면" 1개는 꼭 넣어.

재현성 규칙(매우 중요):
- 입력이 완전히 같으면 결과 문장/표현/선택을 최대한 동일하게 유지해.
- 동의어 바꿔치기/말투 변주/랜덤 예시 변경 금지.
- JSON 키 순서와 필드 구조를 절대 바꾸지 마.
- JSON만 출력(설명문/마크다운/코드블록 금지).`;

    let userPrompt = "";

    if (type === "daily") {
      userPrompt = `아래 입력으로 "오늘의 운세"를 작성해.

[프로필]
이름: ${profile.name}
생년월일(양력): ${profile.birth_date}
출생시간: ${profile.birth_time_code ?? "모름"}
관계: ${profile.relationship ?? "본인"}

[사주 요약(서버 제공)]
${saju_summary}

[사주 간지 근거(서버 계산, 그대로 사용)]
${sajuCompact}
${sajuCompact2}

[별자리 요약(서버 제공)]
${astro_summary}

[오늘 흐름 간지(서버 계산, 그대로 사용)]
${luckCompact}

[사용 가능한 간지/오행 토큰(이 목록만 사용)]
- 일간(토큰): ${dTokStem || "-"}
- 일지(토큰): ${dTokBranch || "-"}
- 일운(토큰): ${ldTokStem || "-"}, ${ldTokBranch || "-"}
- 월운(토큰): ${lmTokStem || "-"}, ${lmTokBranch || "-"}
- 연운(토큰): ${lyTokStem || "-"}, ${lyTokBranch || "-"}
- 대운(토큰): ${dwTokStem || "-"}, ${dwTokBranch || "-"}
- ⚠️ 규칙: 본문/근거에서 "갑목" 같은 토큰은 위 목록에 있는 것만 사용해. 목록 외 토큰(예: 다른 천간/지지) 금지.

[운세 날짜]
${target_date}

[출력(JSON 고정 스키마)]
{
  "profile_badges": {
    "zodiac_animal": "띠(예: 말띠)",
    "sun_sign": "별자리(예: 사자자리)"
  },
  "today_keywords": ["#키워드1", "#키워드2", "#키워드3"],
  "today_one_liner": "today_keywords의 분위기를 합쳐서 만든 오늘 요약 1문장(감성적이되 과장 금지)",
  "today_luck_chart": {
    "pillars": {
      "daewoon": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "year": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "month": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "day": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" }
    },
    "notes": []
  },
  "sections": {
    "overall": "총운(2~4문장, 기존보다 더 구체적으로)",
    "money": "금전운(2~4문장, 기존보다 더 구체적으로)",
    "love": "애정운(2~4문장, 기존보다 더 구체적으로)",
    "health": "건강운(2~4문장, 기존보다 더 구체적으로)"
  },
  "section_evidence": {
    "overall": ["근거 1(짧게)", "근거 2(짧게)"],
    "money": ["근거 1(짧게)", "근거 2(짧게)"],
    "love": ["근거 1(짧게)", "근거 2(짧게)"],
    "health": ["근거 1(짧게)", "근거 2(짧게)"]
  },
  "spine_chill": {
    "prediction": "오늘 실제로 벌어질 가능성이 높은 관찰 2문장(40~90자)",
    "time_window": "오전|점심|오후|저녁 중 하나",
    "verification": "사용자가 오늘 확인할 체크포인트 1개"
  },
  "saju_brief": "사주 분석(8~12문장, 디테일/신뢰감. 오행·간지·신살까지 자연스럽게)",
  "astro_brief": "별자리 분석(8~12문장, 디테일/신뢰감. 태양궁 성향+오늘 흐름 연결)",
  "evidence": {
    "saju": ["사주 근거 1(짧게)", "사주 근거 2(짧게)"],
    "astro": ["별자리 근거 1(짧게)", "별자리 근거 2(짧게)"],
    "today": ["오늘 흐름 근거 1(짧게)"]
  },
  "today_keys": {
    "color": { "value": "색(짧게)", "why": "키워드 1개 포함" },
    "taboo": { "value": "금기(짧게)", "why": "키워드 1개 포함" },
    "talisman": { "value": "부적(짧게)", "why": "키워드 1개 포함" },
    "lucky_spot": { "value": "스팟(짧게)", "why": "키워드 1개 포함" },
    "number": { "value": "숫자", "why": "키워드 1개 포함" },
    "food": { "value": "음식(짧게)", "why": "키워드 1개 포함" },
    "item": { "value": "소지품(짧게)", "why": "키워드 1개 포함" },
    "action": { "value": "실천(짧게)", "why": "키워드 1개 포함" },
    "helper": { "value": "귀인(사람유형,짧게)", "why": "키워드 1개 포함" }
  },
  "scores": { "overall": 72, "money": 61, "love": 66, "health": 70 }
}

세부 규칙:
- profile_badges는 서버 제공 요약에서 가져와: 띠(말띠 등), 태양궁(사자자리 등).
- today_keywords는 '한눈에 꽂히는' 3개 해시태그:
  - 형식: '#' + 공백 없는 한국어(2~9자), 총 3개
  - 중복/유사어 금지, 각각 역할 분리(주의/기회/태도)
  - 예: #말조심이보약 #아이디어폭발 #내적성장데이
- today_one_liner는 today_keywords 3개를 모두 참고해서, 오늘 하루를 요약하는 시적인 1문장으로 써.
  - 예시 느낌: "안개 낀 아침을 지나 오후의 무지개를 기다리는 당신에게 건네는 따뜻한 주파수"
  - 키워드 문자열(#...)을 문장에 그대로 박지 말고, 의미/분위기로 녹여.
  - 과장/예언/공포 조장 금지. 25~60자.
- today_luck_chart는 반드시 위 구조를 유지해 출력해(값은 서버 계산을 그대로 반영한다).
- 간지 표기 규칙(신뢰감):
  - 천간+오행: 갑목, 을목, 병화, 정화, 무토, 기토, 경금, 신금, 임수, 계수
  - 지지+오행: 자수, 축토, 인목, 묘목, 진토, 사화, 오화, 미토, 신금, 유금, 술토, 해수
  - 본문에서는 위 형태로 붙여 써(예: "일주의 병화", "일운의 해수").
- sections 4개는 각각 2~4문장.
  - 길이: 각 섹션 80~160자 내외(기존의 약 2배).
  - 반드시 2개의 간지 단서를 포함: (일간/일지 중 1개) + (일운/월운/연운/대운 중 1개).
  - "오늘 실제로 일어날 법한 장면" 1개를 문장에 끼워 넣어.

길이 규칙(매우 중요):
- sections.overall/money/love/health는 각각 2~4문장.
- 각 섹션은 80~160자(공백 포함) 정도로, 기존보다 2배 더 자세하게.
- 각 섹션 문장 안에 반드시 "간지 근거"를 최소 1개 포함(예: 일간 병화/일운 기토/일운 해수/월운/연운/대운 등).
- 각 섹션 문장 안에 "현실 장면" 1개 포함(예: 회의/메신저/결제/약속/식사/퇴근길 등).
- section_evidence는 각 섹션당 2개씩:
  - 반드시 '사주 요약(연주/오행/띠/리듬/집중)' 또는 '별자리 요약(강점/주의 키워드)' 중 최소 1개 요소를 포함해.
  - "왜 그렇게 말하는지"가 보이게 원인→현상 형태로.
- spine_chill은 반드시 포함:
  - prediction: 오늘 실제로 겪을 법한 구체 상황 1개.
    - 아래 카테고리 중 하나로 작성하고, 친구/지인에 편중되지 않게 해:
      (업무/메신저/결제/이동지연/문서실수/기기인증/가족부탁/컨디션신호/우연한도움/약속변경)
  - time_window: 오전/점심/오후/저녁 중 하나로 고정.
  - verification: 사용자가 오늘 "맞았다/아니다" 판단 가능한 체크포인트 1개.
- 흔한 문장("긍정적으로 생각해"류) 금지. 더 구체적으로.
- today_keys.value는 1~8단어로 짧게. why는 1문장.
- today_keys.why는 사주/별자리 키워드(예: 꾸준함/도전/과신/리듬/집중 등) 중 최소 1개 포함.
- 금기: 오늘 하루 "하지 말아야 할 구체 행동"으로.
- 실천: 5~15분 안에 가능한 행동으로.
- 귀인: 사람유형 + 등장 장면(짧게)로.
- 점수는 0~100 정수.
- 단, 0점은 금지(항상 35~95 범위에서 현실적으로 부여). 4개 점수는 모두 같은 값 금지.
- JSON 외 텍스트 출력 금지.`;
    } else {
      userPrompt = `다음 입력으로 운세 요약을 JSON으로 생성해줘.
타입: ${type}
target_date: ${target_date ?? "없음"}
target_year: ${target_year ?? "없음"}

출력(JSON):
{
  "summary_text": "5~7문장 요약(반말체)",
  "scores": { "overall": 0, "love": 0, "money": 0, "health": 0 }
}`;
    }

    const openaiKey = getOpenAIKey();
    if (!openaiKey) return NextResponse.json({ error: "OPENAI_API_KEY_MISSING" }, { status: 500 });

    const openaiRes = await fetchWithRetry(() =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          top_p: 1,
          presence_penalty: 0,
          frequency_penalty: 0,
          max_tokens: 1600,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
        }),
      })
    );

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();

      if (openaiRes.status === 429 && errText.includes("insufficient_quota")) {
        return NextResponse.json(
          {
            error: "OPENAI_INSUFFICIENT_QUOTA",
            message: "OpenAI API 크레딧/결제 한도가 부족해. OpenAI 콘솔에서 Billing/Usage를 확인해줘.",
            detail: errText,
          },
          { status: 402 }
        );
      }

      return NextResponse.json({ error: "OPENAI_CALL_FAILED", detail: errText }, { status: openaiRes.status });
    }

    const json = await openaiRes.json();
    const content = json?.choices?.[0]?.message?.content;

    let result_summary: any = null;
    try {
      result_summary = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      result_summary = { raw: content };
    }

    if (type === "daily") {
      result_summary = normalizeDailyResultSummary(result_summary, profile, sajuChart, todayLuckChart);
    }

    const reading_id = crypto.randomUUID();
    const input_snapshot = {
      profile: {
        name: profile.name,
        birth_date: profile.birth_date,
        birth_time_code: profile.birth_time_code,
        gender: profile.gender,
        relationship: profile.relationship,
        calendar_type: profile.calendar_type,
        timezone: "Asia/Seoul",
      },
      reading: { type, target_date, target_year },
      server_summaries: { saju_summary, astro_summary },
    };

    const { data: saved, error: insErr } = await supabaseAdmin
      .from("readings")
      .insert({
        id: reading_id,
        user_id,
        profile_id,
        type,
        target_date,
        target_year,
        input_snapshot,
        result_summary,
      })
      .select("id,result_summary")
      .single();

    if (insErr || !saved) {
      return NextResponse.json({ error: "DB_INSERT_FAILED", detail: String(insErr?.message ?? insErr) }, { status: 500 });
    }

    return NextResponse.json({
      reading_id: saved.id,
      result_summary: saved.result_summary,
      cached: false,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "UNEXPECTED", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
