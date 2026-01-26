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

function isBlankKeyValue(v: any) {
  if (v == null) return true;
  const s = String(v).trim();
  return !s || s === "-" || s === "—" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined";
}

function makeDefaultTodayKeys(seed: {
  dayStemElement?: string | null;
  sunSign?: string | null;
  zodiac?: string | null;
  dayGanji?: string | null;
  luckDayGanji?: string | null;
  keywords: string[];
}) {
  const kw = (seed.keywords || []).map(asHashtagWord);
  const k1 = kw[0] || "조심";
  const k2 = kw[1] || "기회";
  const k3 = kw[2] || "성장";

  const el = seed.dayStemElement ?? "토";
  const base = `${seed.dayGanji ?? ""}|${seed.luckDayGanji ?? ""}|${seed.sunSign ?? ""}|${seed.zodiac ?? ""}`;
  const h = hashStr(base);
  const pick = <T,>(arr: T[]) => arr[h % arr.length];
  const pickN = (min: number, max: number) => {
    const span = Math.max(1, max - min + 1);
    return (hashStr(`${h}:n`) % span) + min;
  };

  const colorByEl: Record<string, string[]> = {
    "목": ["초록", "올리브", "민트"],
    "화": ["레드", "코랄", "버건디"],
    "토": ["머스타드", "베이지", "샌드"],
    "금": ["화이트", "실버", "라이트그레이"],
    "수": ["네이비", "블루", "딥퍼플"],
  };

  const tabooByEl: Record<string, string[]> = {
    "목": ["계획만 세우기", "약속 미루기", "결정 미루기"],
    "화": ["감정 섞인 답장", "충동 결제", "말로 밀어붙이기"],
    "토": ["정리 안 하고 시작", "대충 넘기기", "과식·과음"],
    "금": ["지나친 냉정", "완벽주의로 지연", "비교/평가"],
    "수": ["밤샘", "감정 과몰입", "미확인 정보 공유"],
  };

  const talismanByEl: Record<string, string[]> = {
    "목": ["잎사귀 키링", "연두 펜", "나무 향"],
    "화": ["따뜻한 향수", "빨간 포인트", "작은 캔들"],
    "토": ["노트/메모", "미니 파우치", "정리 클립"],
    "금": ["반짝이는 액세서리", "금속 키링", "심플한 시계"],
    "수": ["물병", "블루 이어폰", "차분한 향"],
  };

  const spotByEl: Record<string, string[]> = {
    "목": ["식물 많은 카페", "공원 산책길", "창가 자리"],
    "화": ["햇빛 드는 곳", "활기찬 거리", "운동 공간"],
    "토": ["정리된 책상", "도서관", "조용한 회의실"],
    "금": ["깔끔한 매장", "새 노트 산 곳", "정돈된 공간"],
    "수": ["물가/분수", "조용한 골목", "차분한 라운지"],
  };

  const foodByEl: Record<string, string[]> = {
    "목": ["샐러드", "허브티", "과일"],
    "화": ["매콤한 국물", "따뜻한 라떼", "구운 고기"],
    "토": ["든든한 밥", "감자/고구마", "된장국"],
    "금": ["담백한 면", "두부", "흰살생선"],
    "수": ["미역국", "수분 많은 과일", "차(티)"],
  };

  const itemByEl: Record<string, string[]> = {
    "목": ["메모지", "펜", "가벼운 가방"],
    "화": ["핸드크림", "립밤", "미니 향"],
    "토": ["파우치", "정리용 케이블", "에코백"],
    "금": ["충전기", "이어폰", "명함/카드지갑"],
    "수": ["물병", "우산", "보온 텀블러"],
  };

  const actionByEl: Record<string, string[]> = {
    "목": ["10분 정리", "5분 계획", "짧은 산책"],
    "화": ["답장 전 10초 멈춤", "결제 전 재확인", "5분 호흡"],
    "토": ["체크리스트 3개", "책상 정돈", "물 한 컵"],
    "금": ["우선순위 1개만", "불필요 알림 끄기", "정리/삭제"],
    "수": ["감정 기록 3줄", "미온수 한 컵", "잠깐 휴식"],
  };

  const helperTypes = [
    "디테일 챙기는 동료",
    "빠르게 답 주는 상담원",
    "차분한 성격의 선배",
    "정리 잘하는 친구(필요할 때만)",
    "현실 조언하는 가족",
  ];

  const num = pickN(1, 9);
  const color = pick(colorByEl[el] ?? colorByEl["토"]);
  const taboo = pick(tabooByEl[el] ?? tabooByEl["토"]);
  const talisman = pick(talismanByEl[el] ?? talismanByEl["토"]);
  const spot = pick(spotByEl[el] ?? spotByEl["토"]);
  const food = pick(foodByEl[el] ?? foodByEl["토"]);
  const item = pick(itemByEl[el] ?? itemByEl["토"]);
  const action = pick(actionByEl[el] ?? actionByEl["토"]);
  const helper = pick(helperTypes);

  return {
    color: { value: color, why: `${k2}를 살리려면 눈에 띄는 포인트가 필요해. ${color}가 리듬을 잡아줘.` },
    taboo: { value: taboo, why: `${k1} 모드인 오늘은 ${taboo}가 실수로 이어지기 쉬워.` },
    talisman: { value: talisman, why: `${k3}를 남기려면 작은 루틴이 좋아. ${talisman}이 신호가 돼.` },
    lucky_spot: { value: spot, why: `${k2}는 장소가 열어줘. ${spot}에서 집중이 살아나.` },
    number: { value: String(num), why: `${k1}과 ${k2} 사이 균형을 잡는 숫자야. 중요한 선택에 한 번 더 체크.` },
    food: { value: food, why: `${k3}를 위한 에너지 보충. ${food}로 컨디션을 안정시키자.` },
    item: { value: item, why: `${k1} 방어용. ${item} 하나면 흐름이 덜 흔들려.` },
    action: { value: action, why: `${k2}는 작은 실행에서 터져. ${action}만 해도 오늘 운이 바뀐다.` },
    helper: { value: helper, why: `${k3}는 혼자보다 ‘도움’에서 커져. ${helper} 유형이 힌트 줄 확률이 높아.` },
  };
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


function buildPremiumAlgoFallback(args: {
  seedKey: string;
  ganjiTokens: string[];
  sunSign: string;
  zodiac: string;
  todayKeywords: string[];
}) {
  const h = hashStr(args.seedKey);
  const pick = <T,>(arr: T[]) => arr[h % arr.length];
  const pick2 = <T,>(arr: T[], off: number) => arr[(h + off) % arr.length];
  const t1 = args.ganjiTokens?.[0] || "일주";
  const t2 = args.ganjiTokens?.[1] || args.ganjiTokens?.[2] || t1;

  const sun = args.sunSign || "별자리";
  const z = args.zodiac || "띠";
  const k = (args.todayKeywords || []).map(asHashtagWord).filter(Boolean);
  const k1 = k[0] || "말조심";
  const k2 = k[1] || "아이디어";
  const k3 = k[2] || "내적성장";

  const cheatScenarios = [
    `오늘은 ${t1} 흐름이 ‘예상 밖 과제’를 던져. 오전에 갑자기 바뀐 일정/요청이 오면 당황하지 말고, ${sun} 특유의 디테일 감각으로 체크리스트부터 세팅해.`,
    `결제/계약/예약 같은 돈 얘기는 ${t2} 기운이 예민하게 건드려. 버튼 누르기 전 10초만 더 확인하면 ‘지출 방어’가 치트키가 돼.`,
    `메신저/메일이 동시에 터지기 쉬운 날이야. ${t1} 리듬이 빨라서 답장 순서가 꼬이기 딱 좋아. ‘첫 문장만 저장→나중에 정리’ 루틴이 살려줘.`,
    `이동/대기에서 변수가 생길 수 있어. ${t2} 타이밍엔 ‘10분 버퍼’가 승리 공식. 늦어질 땐 미리 한 줄만 보내도 평판이 지켜져.`,
  ];

  const mindScenarios = [
    `${t1}과 ${t2}가 부딪히면 마음이 ‘과열→급냉’으로 튈 수 있어. 오늘은 신나도, 갑자기 현타가 와도 정상. 감정을 밀어붙이지 말고 3분만 호흡을 길게 해봐.`,
    `${sun} 성향은 잘해내려는 마음이 큰데, 오늘은 작은 실수도 크게 보일 수 있어. ‘완벽’ 대신 ‘완료’를 목표로 잡아. 끝낸 뒤에야 마음이 가벼워져.`,
    `오늘은 이유 없이 예민해질 수 있어. ${t2} 기운이 ‘숨은 걱정’을 끌어올리거든. 머릿속에서만 굴리지 말고, 걱정 하나를 메모로 밖에 꺼내면 바로 진정돼.`,
    `${z} 흐름이 ‘체면’ 버튼을 눌러. 괜히 쿨한 척하다가 속이 답답해질 수 있어. 오늘은 솔직하게 “지금은 정리 중” 한 마디가 오히려 멋이야.`,
  ];

  const highlightScenes = [
    `점심~오후에 네 말/표현이 한 번 ‘레전드’로 남을 수 있어. ${t1}이 말솜씨를 밀어주니까, 핵심만 짧게 말하면 사람들 기억에 딱 박혀.`,
    `오늘 하이라이트는 ‘작은 도움’에서 터져. 네가 던진 한 줄 팁이 누군가를 살리고, 그 덕이 다시 너한테 기회로 돌아와.`,
    `회의/통화에서 한 단어가 오해를 만들 뻔하지만, 네가 바로 정정하면 오히려 신뢰가 올라가. ${sun}의 진정성 모드가 빛나는 장면.`,
    `업무/공부에서 막히던 게 저녁에 갑자기 풀릴 수 있어. ${t2} 기운이 ‘정리’에 강해서, 미뤄둔 파일/책상 정리가 트리거가 돼.`,
  ];

  const moodSetting = `오늘 너의 24시간을 우주의 흐름에 맞춰 튜닝했어. 이 타이밍만 타면 오늘은 네 거야.\n\n` +
    `🌅 오전 (07:00 ~ 11:00) : #${k1} #빌드업\n` +
    `${pick2([
      "복잡한 일부터 쳐내기 좋아. 일정/문서/숫자 먼저 정리하면 하루가 편해져.",
      "말/메신저가 꼬이기 쉬우니 ‘짧고 정확하게’만 지키면 실수 방어 성공.",
      "컨디션 신호가 오면 바로 스트레칭. 작은 관리가 하루 기세를 바꿔."
    ], 1)}\n\n` +
    `☀️ 점심 & 오후 (12:00 ~ 16:00) : #${k2} #텐션업\n` +
    `${pick2([
      "사람 만남/미팅에 운이 붙어. 중요한 얘기는 이때 던져봐.",
      "아이디어가 번쩍 떠오를 시간. 떠오른 건 바로 메모—오늘은 기록이 금이다.",
      "결제/승인/결정은 ‘한 번 더 확인’만 하면 흐름이 좋아져."
    ], 2)}\n\n` +
    `🌇 저녁 (18:00 ~ 21:00) : #${k3} #리커버리\n` +
    `${pick2([
      "감정 회복 시간이야. 따뜻한 음식+가벼운 산책이면 머리가 맑아져.",
      "정리 운이 들어와. 방/책상/파일 정리 10분이 내일 운까지 끌어올려.",
      "사소한 칭찬 한 마디가 관계 운을 살려. ‘고마워’가 오늘의 주문."
    ], 3)}\n\n` +
    `🌙 밤 (22:00 ~ 01:00) : #로그아웃 #내면정리\n` +
    `${pick2([
      "SNS 끄고 머리 비우는 게 최고. 내일 할 일 3개만 적고 자면 운이 정렬돼.",
      "생각이 많아지면 따뜻한 물 한 잔. 몸이 풀리면 마음도 같이 풀려.",
      "오늘의 실수/걱정은 여기서 종료. ‘오늘은 여기까지’로 스스로를 칭찬해."
    ], 4)}`;

  const cheatkey = ensureMentions(pick(cheatScenarios), [t1, sun].filter(Boolean) as string[]);
  const mind = ensureMentions(pick(mindScenarios), [t2, sun].filter(Boolean) as string[]);
  const highlight = ensureMentions(pick(highlightScenes), [t1, sun].filter(Boolean) as string[]);

  return { cheatkey, mind, highlight, mood_setting: moodSetting };
}

function normalizeDailyResultSummary(
  rs: any,
  profile: any,
  sajuChart: any | null,
  todayLuckChart: any | null,
  targetDate?: string | null
) {
  const out: any = rs && typeof rs === "object" ? rs : {};

  // target date (used for deterministic premium fallback & consistency)
  const td = typeof targetDate === "string" && targetDate.trim()
    ? targetDate.trim()
    : new Date().toISOString().slice(0, 10);

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
  const mustDailyTokens = mustDaily;

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

  // today_keys(9개 치트키) - 모델/캐시 편차로 비거나 '-'가 자주 나와서 서버에서 강제 보정
  out.today_keys = out.today_keys && typeof out.today_keys === "object" ? out.today_keys : {};
  const defaultKeys = makeDefaultTodayKeys({
    dayStemElement: dayStemEl,
    sunSign: out.profile_badges.sun_sign ?? null,
    zodiac: out.profile_badges.zodiac_animal ?? null,
    dayGanji: d?.ganji_kor ?? null,
    luckDayGanji: ld?.ganji_kor ?? null,
    keywords: out.today_keywords ?? [],
  });
  (Object.keys(defaultKeys) as (keyof typeof defaultKeys)[]).forEach((k) => {
    const cur = out.today_keys?.[k] && typeof out.today_keys[k] === "object" ? out.today_keys[k] : {};
    const v = cur?.value;
    const w = cur?.why;
    out.today_keys[k] = {
      value: isBlankKeyValue(v) ? defaultKeys[k].value : String(v),
      why: isBlankKeyValue(w) ? defaultKeys[k].why : String(w),
    };
  });

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
  // premium_algo - (이제 결과보기 자체가 유료라서 요약에 포함)
  out.premium_algo = out.premium_algo && typeof out.premium_algo === "object" ? out.premium_algo : {};
  const pSeed = `${out.profile_badges?.zodiac_animal ?? ""}-${out.profile_badges?.sun_sign ?? ""}-${td}-${d?.ganji_kor ?? ""}-${ld?.ganji_kor ?? ""}`;
  const premiumFallback = buildPremiumAlgoFallback({
    seedKey: pSeed,
    ganjiTokens: mustDailyTokens,
    sunSign: out.profile_badges?.sun_sign ?? "",
    zodiac: out.profile_badges?.zodiac_animal ?? "",
    todayKeywords: out.today_keywords ?? [],
  });

  const tooShort = (s: any) => {
    const t = (s ?? "").toString().trim();
    return t.length < 140 || countLines(t) < 4;
  };

  if (tooShort(out.premium_algo?.cheatkey)) out.premium_algo.cheatkey = premiumFallback.cheatkey;
  if (tooShort(out.premium_algo?.mind)) out.premium_algo.mind = premiumFallback.mind;
  if (tooShort(out.premium_algo?.highlight)) out.premium_algo.highlight = premiumFallback.highlight;

  const mood = (out.premium_algo?.mood_setting ?? "").toString();
  const hasAllParts = ["🌅", "☀️", "🌇", "🌙"].every((x) => mood.includes(x));
  if (!mood || !hasAllParts || mood.length < 220) out.premium_algo.mood_setting = premiumFallback.mood_setting;



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


async function rpcSpendForReading(supabaseUser: any, reading_id: string) {
  // Supabase SQL: rpc_unlock_detail(p_reading_id uuid)
  const { error } = await supabaseUser.rpc("rpc_unlock_detail", { p_reading_id: reading_id });
  return error ?? null;
}

function isSchemaCacheNotFound(err: any) {
  const msg = String(err?.message ?? "");
  return /schema cache|could not find the function|function public\.rpc_unlock_detail/i.test(msg);
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
    // ⚠️ result_summary: pre-insert placeholder({})는 truthy라서, "비어있는 객체"는 캐시로 취급하면 안 됨.
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

    const isUsableResultSummary = (v: any) => {
      if (!v) return false;
      if (typeof v !== "object") return true;
      if (Array.isArray(v)) return v.length > 0;
      try {
        return Object.keys(v).length > 0;
      } catch {
        return false;
      }
    };

    // ✅ 완성된 result_summary만 캐시로 반환(placeholder {}는 제외)
    if (cached?.data?.id && isUsableResultSummary(cached.data.result_summary)) {
      const normalized = type === "daily"
        ? normalizeDailyResultSummary(cached.data.result_summary, profile, sajuChart, todayLuckChart, target_date ?? null)
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

    const system = `너는 "사주(동양 명리) + 서양 점성술(별자리)"을 함께 보는 전문 상담가야.
사용자가 읽자마자 "근거가 있다"라고 느끼게, 오늘 하루에 딱 맞는 현실적인 조언을 줘.

말투:
- 무조건 반말체. 친근하고 스윗하지만 가볍지 않게(연애 조언 과잉 금지).
- 단정적인 불행 예언/공포 조장/의학·법률 단정은 금지. 대신 '가능성/경향'으로 말해.

핵심 원칙(신뢰감):
- 사주 근거는 반드시 (일간/일지/일운/월운/연운/대운) 중 최소 2개를 엮어서 써.
- 별자리 근거는 태양궁(=sun sign) 성향 + 오늘 흐름(리듬/집중/관계/결정)을 연결해.
- "오늘 실제로 일어날 법한 장면"을 각 섹션마다 최소 1개 포함해(업무/메신저/결제/이동/문서/가족/컨디션 등).

표현 스타일:
- 문장은 짧게 끊어서 리듬 있게. 한 문단에 정보가 몰리지 않게 줄바꿈을 적극 사용해.
- 흔한 덕담 금지("힘내", "긍정적으로" 같은 문장 금지). 대신 구체 행동/상황으로.
- 너무 현학적 용어 나열 금지. 간지/오행은 '단서'처럼 자연스럽게.

재현성 규칙(매우 중요):
- 입력이 완전히 같으면 표현/구성/예시를 최대한 동일하게 유지해(동의어 바꿔치기/랜덤 예시 금지).
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

[오늘의 흐름 표 원본(today_luck_chart, 서버 계산 JSON - 이 값을 그대로 출력 JSON에 채워)]
${JSON.stringify(todayLuckChart ?? {}, null, 2)}

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
  "premium_algo": {
    "cheatkey": "🔑 오늘의 운빨 치트키(6~7줄, 줄바꿈 포함. 아주 현실적인 상황/조언 포함)",
    "mind": "🧠 나만 몰랐던 내 마음(6~7줄, 줄바꿈 포함. 감정의 근거와 다루는 방법)",
    "highlight": "🎬 미리 보는 하이라이트(6~10문장, 오늘 벌어질 법한 장면 중심)",
    "mood_setting": "🗺️ 시간대별 무드 세팅(아래 포맷을 따라 4파트 + 해시태그 포함, 줄바꿈 유지)

🌅 오전 (07:00 ~ 11:00) : #해시태그 #해시태그
한두 문장

☀️ 점심 & 오후 (12:00 ~ 16:00) : #해시태그 #해시태그
한두 문장

🌇 저녁 (18:00 ~ 21:00) : #해시태그 #해시태그
한두 문장

🌙 밤 (22:00 ~ 01:00) : #해시태그 #해시태그
한두 문장"
  },
  "scores": { "overall": 72, "money": 61, "love": 66, "health": 70 }
}

세부 규칙:
- profile_badges는 서버 제공 요약에서 가져와: 띠(말띠 등), 태양궁(사자자리 등).
- today_keywords는 '한눈에 꽂히는' 3개 해시태그:
  - 형식: '#' + 공백 없는 한국어(2~9자), 총 3개
  - 중복/유사어 금지, 각각 역할 분리(주의/기회/태도)
  - 예: #말조심이보약 #아이디어폭발 #내적성장데이
- today_one_liner는 "오늘한줄" 영역이야. 4~5줄로 써(줄바꿈 포함).
  - 각 줄은 1문장(짧게 12~28자), 총 4~5줄 고정.
  - today_keywords 3개 분위기를 모두 녹여(해시태그 문자열을 그대로 박지 말고 의미로).
  - 과장/예언/공포 조장 금지. 현실적인 이미지/상황으로.
- today_luck_chart는 반드시 위 구조를 유지해 출력해.
  - ⚠️ 위에 제공된 [오늘의 흐름 표 원본] JSON 값을 그대로 복사해서 모든 필드를 채워(빈 문자열 금지).
  - stem_hanja/branch_hanja는 한자 1글자, stem_kor/branch_kor는 해당 한자의 한글(예: 丙=병, 申=신)로 정확히.
- 간지 표기 규칙(신뢰감):
  - 천간+오행: 갑목, 을목, 병화, 정화, 무토, 기토, 경금, 신금, 임수, 계수
  - 지지+오행: 자수, 축토, 인목, 묘목, 진토, 사화, 오화, 미토, 신금, 유금, 술토, 해수
  - 본문에서는 위 형태로 붙여 써(예: "일주의 병화", "일운의 해수").
- sections(오늘의 바이브/머니 컨디션/심쿵 시그널/에너지 수치)은 각 항목 4~5줄로 써(줄바꿈 포함).
  - 각 줄은 1문장, 4~5줄 고정.
  - 각 섹션마다 '오늘 실제로 일어날 법한 장면' 1개 포함.
  - 반드시 2개의 간지 단서를 포함: (일간/일지 중 1개) + (일운/월운/연운/대운 중 1개).
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
- premium_algo.cheatkey(오늘의 운빨치트키)와 premium_algo.mind(나만 몰랐던 내 마음)는 각각 6~7줄로 써(줄바꿈 포함, 각 줄 1문장).
- premium_algo.highlight는 6~10문장(줄바꿈 포함 가능)으로, 너무 일반론 금지.
  - 반드시 사주 간지 단서 1개(위 토큰 목록에서) + 별자리 성향 1개를 자연스럽게 포함.
  - '오늘 실제로 일어날 법한 장면' 1개 포함(예: 회의/메신저/결제/이동지연/문서실수/가족부탁/컨디션신호).
  - 친구/지인/썸/애인 같은 특정 관계에 편중되지 않게, 업무/돈/컨디션/가족/기기/이동 등 다양한 상황을 섞어.
- premium_algo.mood_setting은 예시 포맷을 그대로 따르고(4파트 고정), 각 파트에 해시태그 2개와 1~2문장 조언을 넣어.

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

    // 🔒 결과보기는 최초 1회만 유료(엽전 1닢)
    // - 동일 프로필/날짜(또는 연도)로 이미 생성된 reading은 무료 재열람
    // - cache miss라도, 기존 row가 있고(result_summary가 비어있는 placeholder)면 같은 id로 재시도(무료)
    const REQUIRED_COINS = 1;

    // user-context client (RLS 적용) for rpc_get_coin_balance / rpc_unlock_detail(엽전 차감)
    const url = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
    const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
    if (!url || !anonKey) return NextResponse.json({ error: "SUPABASE_PUBLIC_ENV_MISSING" }, { status: 500 });
    const supabaseUser = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

    // cache miss지만 기존 row가 있을 수 있음(placeholder 등). 유니크 충돌 방지를 위해 있으면 재사용.
    const existingReadingId: string | null = cached?.data?.id ?? null;
    const reading_id = existingReadingId ?? crypto.randomUUID();
    const needsInsert = !existingReadingId;
    // 💰 결제(엽전 차감)는 "새로운 reading을 처음 생성할 때" 1회만
    // - 동일 프로필/날짜(또는 연도)로 이미 생성된 reading이 있으면(캐시 hit / placeholder 포함) 재열람/재시도는 무료
    const shouldCharge = needsInsert;

    // ✅ 코인 검증은 서버에서 강제(클라 우회/버그 방지)
    let balance_before: number | null = null;
    if (shouldCharge) {
      const { data: bal, error: balErr } = await supabaseUser.rpc("rpc_get_coin_balance");
      if (balErr) {
        return NextResponse.json(
          {
            error: "coin_balance_failed",
            message: "엽전 잔액을 확인하는 중 오류가 발생했어.",
            detail: String(balErr.message ?? balErr),
          },
          { status: 500 }
        );
      }
      const n = Number(bal ?? 0);
      balance_before = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      if ((balance_before ?? 0) < REQUIRED_COINS) {
        return NextResponse.json(
          {
            error: "coin_required",
            message: "결과를 보려면 엽전 1닢이 필요해.",
            required_coins: REQUIRED_COINS,
            balance_coins: balance_before ?? 0,
          },
          { status: 402 }
        );
      }
    }

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

    // 먼저 reading row를 만들어야 RPC가 참조 가능
    if (needsInsert) {
      const { error: preInsErr } = await supabaseAdmin
        .from("readings")
        .insert({
          id: reading_id,
          user_id,
          profile_id,
          type,
          target_date,
          target_year,
          input_snapshot,
          // readings.result_summary is NOT NULL in our schema.
          // Use an empty object as a placeholder so RPC can reference this row
          // before the final AI-generated result_summary is written.
          result_summary: {},
        });

      if (preInsErr) {
        return NextResponse.json({ error: "DB_INSERT_FAILED", detail: String(preInsErr.message ?? preInsErr) }, { status: 500 });
      }
    }

    // ✅ 결제(엽전 차감)는 최초 1회만
    if (shouldCharge) {
      const payErr = await rpcSpendForReading(supabaseUser, reading_id);
      if (payErr) {
        // 결제 실패면 (이번 요청에서 만든 row라면) 정리(목록에 빈 카드 남지 않게)
        if (needsInsert) {
          await supabaseAdmin.from("readings").delete().eq("id", reading_id);
        }
        const msg = String(payErr.message ?? "");

      // ⚠️ Supabase PostgREST schema cache에 함수가 안 보일 때(보통 EXECUTE 권한 문제)
      if (isSchemaCacheNotFound(payErr)) {
        return NextResponse.json(
          {
            error: "payment_failed",
            message: "결과 결제 처리 중 오류가 발생했어.",
            detail:
              "rpc_unlock_detail 함수 실행 권한이 없거나 API 스키마 캐시가 갱신되지 않았어. Supabase SQL Editor에서 다음을 실행해줘: GRANT EXECUTE ON FUNCTION public.rpc_unlock_detail(uuid) TO authenticated; 그리고 Settings > API에서 Reload schema 눌러줘.\n원본: " + msg,
          },
          { status: 500 }
        );
      }


      // ✅ 코인 부족이 아닌 다른 오류를 'coin_required'로 뭉개지 않도록 분기
      const looksLikeCoinShortage = /coin|엽전|insufficient|not enough|balance|잔액/i.test(msg);
      if (looksLikeCoinShortage) {
        // 보유 엽전도 같이 내려줘서(클라 RPC 실패해도) UI에서 바로 표시 가능하게
        let balance_coins = 0;
        try {
          const { data: bal } = await supabaseUser.rpc("rpc_get_coin_balance");
          const n = Number(bal ?? 0);
          balance_coins = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        } catch {}
        return NextResponse.json(
          {
            error: "coin_required",
            message: "결과를 보려면 엽전 1닢이 필요해.",
            required_coins: 1,
            balance_coins,
            detail: msg,
          },
          { status: 402 }
        );
      }

        return NextResponse.json(
          {
            error: "payment_failed",
            message: "결과 결제 처리 중 오류가 발생했어.",
            detail: msg,
          },
          { status: 500 }
        );
      }

      // ✅ "0코인인데 진행됨" 같은 케이스 방지: 실제 차감이 반영됐는지 확인
      if (balance_before !== null) {
        try {
          const { data: bal2, error: bal2Err } = await supabaseUser.rpc("rpc_get_coin_balance");
          if (!bal2Err) {
            const n2 = Number(bal2 ?? 0);
            const balance_after = Number.isFinite(n2) ? Math.max(0, Math.floor(n2)) : null;
            const expectedMax = Math.max(0, (balance_before ?? 0) - REQUIRED_COINS);
            if (balance_after !== null && balance_after > expectedMax) {
              // 차감이 안 됐다면(결제 미적용) reading을 정리
if (needsInsert) {
                await supabaseAdmin.from("readings").delete().eq("id", reading_id);
              }
              return NextResponse.json(
                {
                  error: "coin_spend_not_applied",
                  message: "엽전 차감이 반영되지 않았어. 결제 로직(rpc_unlock_detail)을 확인해줘.",
                  detail: `before=${balance_before}, after=${balance_after}`,
                },
                { status: 500 }
              );
            }
          }
        } catch {
          // balance 재확인 실패는 치명적이지 않게 무시(이미 unlock 성공)
        }
      }
    }

    // (참고) coins_spent 컬럼은 사용하지 않음(원장은 coin_ledger / unlocks로 관리)

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
          max_tokens: 3200,
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
      result_summary = normalizeDailyResultSummary(result_summary, profile, sajuChart, todayLuckChart, target_date ?? null);
    }

    // 요약 생성 완료 → reading에 저장
    const { error: updErr } = await supabaseAdmin
      .from("readings")
      .update({ result_summary })
      .eq("id", reading_id)
      .eq("user_id", user_id);

    if (updErr) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED", detail: String(updErr.message ?? updErr) }, { status: 500 });
    }

    return NextResponse.json({
      reading_id,
      result_summary,
      cached: false,
    });

} catch (e: any) {
    return NextResponse.json({ error: "UNEXPECTED", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
