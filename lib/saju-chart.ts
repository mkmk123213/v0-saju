// lib/saju-chart.ts
/**
 * 사주 간지(연주/월주/일주/시주) 계산 — "정밀 만세력"의 완전 대체가 아니라,
 * 서비스 내 '신뢰감 있는 근거'를 만들기 위한 실용 구현이야.
 *
 * ⚠️ 주의
 * - 절기 경계(특히 월주)는 해마다 시각이 조금씩 달라서, 본 구현은 '고정 근사 절기일'을 사용해.
 * - 추후 만세력/절기 테이블로 고도화 가능하도록 타입/구조를 안정적으로 유지한다.
 */

export type YinYang = "양" | "음"
export type Element = "목" | "화" | "토" | "금" | "수"

export type Pillar = {
  stem_hanja: string
  stem_kor: string
  stem_element: Element
  stem_yinyang: YinYang
  branch_hanja: string
  branch_kor: string
  branch_animal: string
  branch_element: Element
  branch_yinyang: YinYang
  ganji_hanja: string
  ganji_kor: string
}

const STEMS_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const
const STEMS_KOR = ["갑","을","병","정","무","기","경","신","임","계"] as const
const BRANCHES_HANJA = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const
const BRANCHES_KOR = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const

const STEM_ELEMENT: Record<(typeof STEMS_KOR)[number], Element> = {
  갑:"목", 을:"목",
  병:"화", 정:"화",
  무:"토", 기:"토",
  경:"금", 신:"금",
  임:"수", 계:"수",
}

const STEM_YINYANG: Record<(typeof STEMS_KOR)[number], YinYang> = {
  갑:"양", 을:"음",
  병:"양", 정:"음",
  무:"양", 기:"음",
  경:"양", 신:"음",
  임:"양", 계:"음",
}

const BRANCH_ANIMAL: Record<(typeof BRANCHES_KOR)[number], string> = {
  자:"쥐", 축:"소", 인:"호랑이", 묘:"토끼",
  진:"용", 사:"뱀", 오:"말", 미:"양",
  신:"원숭이", 유:"닭", 술:"개", 해:"돼지",
}

const BRANCH_ELEMENT: Record<(typeof BRANCHES_KOR)[number], Element> = {
  자:"수", 축:"토", 인:"목", 묘:"목",
  진:"토", 사:"화", 오:"화", 미:"토",
  신:"금", 유:"금", 술:"토", 해:"수",
}

const BRANCH_YINYANG: Record<(typeof BRANCHES_KOR)[number], YinYang> = {
  자:"양", 축:"음", 인:"양", 묘:"음",
  진:"양", 사:"음", 오:"양", 미:"음",
  신:"양", 유:"음", 술:"양", 해:"음",
}

// 고정 근사 절기 경계(한국 기준 대략 일자). 월지(寅~丑) 전환에 사용.
// [월지] 立春 寅, 驚蟄 卯, 清明 辰, 立夏 巳, 芒種 午, 小暑 未, 立秋 申, 白露 酉, 寒露 戌, 立冬 亥, 大雪 子, 小寒 丑
const SOLAR_TERM_BOUNDARIES = [
  { m: 2, d: 4, branchKor: "인" }, // 立春
  { m: 3, d: 6, branchKor: "묘" }, // 驚蟄
  { m: 4, d: 5, branchKor: "진" }, // 清明
  { m: 5, d: 6, branchKor: "사" }, // 立夏
  { m: 6, d: 6, branchKor: "오" }, // 芒種
  { m: 7, d: 7, branchKor: "미" }, // 小暑
  { m: 8, d: 8, branchKor: "신" }, // 立秋
  { m: 9, d: 8, branchKor: "유" }, // 白露
  { m:10, d: 8, branchKor: "술" }, // 寒露
  { m:11, d: 7, branchKor: "해" }, // 立冬
  { m:12, d: 7, branchKor: "자" }, // 大雪
  { m: 1, d: 6, branchKor: "축" }, // 小寒
] as const

function isValidISODate(dateISO: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateISO)
}

// Gregorian -> Julian Day Number (UTC 기준). 알고리즘: Fliegel & Van Flandern
function toJdnUTC(year: number, month: number, day: number) {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  return jdn
}

// 일주: 기준일(1984-02-02 = 甲子일)로부터 60갑자 순환
function getDayIndex60(year: number, month: number, day: number) {
  const baseJdn = toJdnUTC(1984, 2, 2)
  const jdn = toJdnUTC(year, month, day)
  const diff = jdn - baseJdn
  const idx = ((diff % 60) + 60) % 60
  return idx
}

// 입춘(2/4) 기준 연도 보정
function getSajuYearForDate(y: number, m: number, d: number) {
  if (m < 2) return y - 1
  if (m > 2) return y
  return d < 4 ? y - 1 : y
}

function stemKorFromIndex(i: number) {
  return STEMS_KOR[((i % 10) + 10) % 10]
}
function branchKorFromIndex(i: number) {
  return BRANCHES_KOR[((i % 12) + 12) % 12]
}

function buildPillar(stemKor: (typeof STEMS_KOR)[number], branchKor: (typeof BRANCHES_KOR)[number]): Pillar {
  const stemIdx = STEMS_KOR.indexOf(stemKor)
  const branchIdx = BRANCHES_KOR.indexOf(branchKor)
  const stemHanja = STEMS_HANJA[stemIdx]
  const branchHanja = BRANCHES_HANJA[branchIdx]
  const stemEl = STEM_ELEMENT[stemKor]
  const stemYY = STEM_YINYANG[stemKor]
  const brEl = BRANCH_ELEMENT[branchKor]
  const brYY = BRANCH_YINYANG[branchKor]
  const animal = BRANCH_ANIMAL[branchKor]
  return {
    stem_hanja: stemHanja,
    stem_kor: stemKor,
    stem_element: stemEl,
    stem_yinyang: stemYY,
    branch_hanja: branchHanja,
    branch_kor: branchKor,
    branch_animal: animal,
    branch_element: brEl,
    branch_yinyang: brYY,
    ganji_hanja: `${stemHanja}${branchHanja}`,
    ganji_kor: `${stemKor}${branchKor}`,
  }
}

// 월지(寅~丑) 결정 (절기 근사)
function getMonthBranchKor(y: number, m: number, d: number): (typeof BRANCHES_KOR)[number] {
  // 1월은 소한(1/6) 이전이면 전년도 12월의 子월(자월)로 보는 근사도 있지만,
  // 서비스 UX 상 혼란을 줄이기 위해: 1/6 기준으로 축월/자월만 가른다.
  const md = m * 100 + d

  // boundary list 중, 현재 날짜에 해당하는 가장 최근 boundary의 branch를 선택
  // 단, 1월(소한) 이전은 전년도 12월(자월)로 취급
  if (m === 1 && d < 6) return "자"

  // 2월 4일 이전은 전년도 소한~입춘 사이의 축월로 취급
  if (m === 2 && d < 4) return "축"

  // 2/4 이후는 boundaries를 순회
  // 기본은 인(입춘)
  let current: (typeof BRANCHES_KOR)[number] = "인"
  for (const b of SOLAR_TERM_BOUNDARIES) {
    // 같은 해 기준
    const bmd = b.m * 100 + b.d
    if (md >= bmd && !(b.m === 1)) current = b.branchKor as any
  }
  // 12/7 이후는 자월, 그 후 1/6 이전은 자월 처리 이미 위에서 함
  if (m === 12 && d >= 7) current = "자"
  if (m === 1 && d >= 6) current = "축"
  return current
}

// 월간 계산: 연간(천간)에 따라 寅월 시작 천간이 달라진다.
function getMonthStemStartForYearStem(yearStemKor: (typeof STEMS_KOR)[number]): (typeof STEMS_KOR)[number] {
  // 甲/己 → 丙, 乙/庚 → 戊, 丙/辛 → 庚, 丁/壬 → 壬, 戊/癸 → 甲
  if (yearStemKor === "갑" || yearStemKor === "기") return "병"
  if (yearStemKor === "을" || yearStemKor === "경") return "무"
  if (yearStemKor === "병" || yearStemKor === "신") return "경"
  if (yearStemKor === "정" || yearStemKor === "임") return "임"
  return "갑" // 무/계
}

function nextStemKor(stemKor: (typeof STEMS_KOR)[number], steps: number) {
  const idx = STEMS_KOR.indexOf(stemKor)
  return STEMS_KOR[(idx + steps) % 10]
}

function getHourBranchKorFromHour(hour24: number): (typeof BRANCHES_KOR)[number] {
  // 子:23-1, 丑:1-3, ... 亥:21-23
  if (hour24 >= 23 || hour24 < 1) return "자"
  if (hour24 < 3) return "축"
  if (hour24 < 5) return "인"
  if (hour24 < 7) return "묘"
  if (hour24 < 9) return "진"
  if (hour24 < 11) return "사"
  if (hour24 < 13) return "오"
  if (hour24 < 15) return "미"
  if (hour24 < 17) return "신"
  if (hour24 < 19) return "유"
  if (hour24 < 21) return "술"
  return "해"
}

function parseBirthTimeToHour(birthTimeCode?: string | null): number | null {
  if (!birthTimeCode) return null
  const t = String(birthTimeCode).trim()
  if (!t || t === "unknown" || t === "모름" || t === "미상") return null

  // HH:mm, HHmm, HH 형태
  const m1 = t.match(/^(\d{1,2}):(\d{2})$/)
  if (m1) {
    const h = Number(m1[1]); const mi = Number(m1[2])
    if (Number.isFinite(h) && Number.isFinite(mi)) return Math.max(0, Math.min(23, h))
  }
  const m2 = t.match(/^(\d{2})(\d{2})$/)
  if (m2) {
    const h = Number(m2[1])
    if (Number.isFinite(h)) return Math.max(0, Math.min(23, h))
  }
  const m3 = t.match(/^\d{1,2}$/)
  if (m3) {
    const h = Number(t)
    if (Number.isFinite(h)) return Math.max(0, Math.min(23, h))
  }

  // 자시/축시... 또는 '자','축' 등 포함
  for (const b of BRANCHES_KOR) {
    if (t.includes(`${b}시`) || t === b || t.includes(b)) {
      // 대표 시간값(중간값) 반환
      const idx = BRANCHES_KOR.indexOf(b)
      // 자시는 23시로 취급
      if (b === "자") return 23
      return Math.min(23, idx * 2 + 1)
    }
  }

  return null
}

// 시주: 일간에 따라 子시 시작 천간이 달라짐
function getHourStemStartForDayStem(dayStemKor: (typeof STEMS_KOR)[number]): (typeof STEMS_KOR)[number] {
  // 甲/己 → 甲, 乙/庚 → 丙, 丙/辛 → 戊, 丁/壬 → 庚, 戊/癸 → 壬
  if (dayStemKor === "갑" || dayStemKor === "기") return "갑"
  if (dayStemKor === "을" || dayStemKor === "경") return "병"
  if (dayStemKor === "병" || dayStemKor === "신") return "무"
  if (dayStemKor === "정" || dayStemKor === "임") return "경"
  return "임" // 무/계
}

export function buildSajuChart(birthDateISO: string, birthTimeCode?: string | null) {
  if (!isValidISODate(birthDateISO)) return null
  const y = Number(birthDateISO.slice(0, 4))
  const m = Number(birthDateISO.slice(5, 7))
  const d = Number(birthDateISO.slice(8, 10))
  if (!y || !m || !d) return null

  // Year pillar
  const sajuYear = getSajuYearForDate(y, m, d)
  const yearIdx60 = ((sajuYear - 1984) % 60 + 60) % 60
  const yearStemKor = stemKorFromIndex(yearIdx60)
  const yearBranchKor = branchKorFromIndex(yearIdx60)
  const yearPillar = buildPillar(yearStemKor, yearBranchKor)

  // Month pillar
  const monthBranchKor = getMonthBranchKor(y, m, d)
  const monthBranchIndexFromIn = ["인","묘","진","사","오","미","신","유","술","해","자","축"].indexOf(monthBranchKor)
  const monthStemStart = getMonthStemStartForYearStem(yearStemKor)
  const monthStemKor = nextStemKor(monthStemStart, monthBranchIndexFromIn)
  const monthPillar = buildPillar(monthStemKor, monthBranchKor)

  // Day pillar
  const dayIdx60 = getDayIndex60(y, m, d)
  const dayStemKor = stemKorFromIndex(dayIdx60)
  const dayBranchKor = branchKorFromIndex(dayIdx60)
  const dayPillar = buildPillar(dayStemKor, dayBranchKor)

  // Hour pillar (optional)
  const hour = parseBirthTimeToHour(birthTimeCode)
  let hourPillar: Pillar | null = null
  if (typeof hour === "number") {
    const hourBranchKor = getHourBranchKorFromHour(hour)
    const hourBranchIndex = BRANCHES_KOR.indexOf(hourBranchKor)
    const hourStemStart = getHourStemStartForDayStem(dayStemKor)
    const hourStemKor = nextStemKor(hourStemStart, hourBranchIndex)
    hourPillar = buildPillar(hourStemKor, hourBranchKor)
  }

  return {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    notes: [
      "월주는 절기(입춘/경칩 등) 경계를 '고정 근사일'로 계산한 값이야.",
      "정밀 만세력/절기 시각 반영은 추후 고도화에서 개선할 수 있어.",
    ],
  }
}
