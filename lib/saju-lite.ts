// lib/saju-lite.ts
/**
 * NOTE
 * - 본 구현은 '오늘의 운세' 요약을 더 설득력 있게 만들기 위한 Lite 버전이야.
 * - 정밀 명식(월주/일주/시주, 절기/만세력, 음양오행/십신/대운 등)은 추후 고도화 대상.
 * - 연주(년주)는 입춘(대략 2/4 전후)을 경계로 보정해, 일반적인 사주 연주 규칙에 최대한 맞춘다.
 */

type YinYang = "양" | "음"
type Element = "목" | "화" | "토" | "금" | "수"

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const

const STEM_TO_ELEMENT: Record<(typeof STEMS)[number], Element> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
}

const STEM_TO_YINYANG: Record<(typeof STEMS)[number], YinYang> = {
  갑: "양", 을: "음",
  병: "양", 정: "음",
  무: "양", 기: "음",
  경: "양", 신: "음",
  임: "양", 계: "음",
}

const BRANCH_TO_ANIMAL: Record<(typeof BRANCHES)[number], string> = {
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼",
  진: "용", 사: "뱀", 오: "말", 미: "양",
  신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
}

export function getZodiacAnimal(birthDateISO: string): string | null {
  const y = Number(birthDateISO.slice(0, 4))
  if (!y) return null
  // 간단히 연도 기준 12지지(띠)를 계산 (입춘 보정은 year pillar 함수에서 처리)
  const animals = ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"]
  const idx = ((y - 2016) % 12 + 12) % 12
  return `${animals[idx]}띠`
}

function approxIpchunBoundary(year: number) {
  // 입춘은 해마다 조금씩 다르지만, Lite에서는 2월 4일을 경계로 사용
  return new Date(Date.UTC(year, 1, 4, 0, 0, 0)) // Feb 4
}

export function getYearPillarLite(birthDateISO: string): {
  stem: (typeof STEMS)[number]
  branch: (typeof BRANCHES)[number]
  ganji: string
  element: Element
  yinYang: YinYang
  zodiacAnimal: string
  note: string
} | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)) return null
  const y = Number(birthDateISO.slice(0, 4))
  const m = Number(birthDateISO.slice(5, 7))
  const d = Number(birthDateISO.slice(8, 10))
  if (!y || !m || !d) return null

  // 입춘 이전이면 사주 연도는 전년도 기준으로 보는 경우가 많음
  const birthUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  const ipchunUTC = approxIpchunBoundary(y)
  const sajuYear = birthUTC < ipchunUTC ? y - 1 : y

  // 1984년이 갑자(甲子) 기준
  const offset = ((sajuYear - 1984) % 60 + 60) % 60
  const stem = STEMS[offset % 10]
  const branch = BRANCHES[offset % 12]
  const element = STEM_TO_ELEMENT[stem]
  const yinYang = STEM_TO_YINYANG[stem]
  const zodiacAnimal = `${BRANCH_TO_ANIMAL[branch]}띠`

  return {
    stem,
    branch,
    ganji: `${stem}${branch}`,
    element,
    yinYang,
    zodiacAnimal,
    note: "Lite 연주(입춘 2/4 기준) — 정밀 명식은 추후 고도화",
  }
}

export function buildSajuLiteSummary(birthDateISO: string, birthTimeCode?: string | null): string {
  const yearPillar = getYearPillarLite(birthDateISO)
  const zodiac = yearPillar?.zodiacAnimal ?? getZodiacAnimal(birthDateISO) ?? "미확인"
  const time = birthTimeCode ? `출생시간 코드: ${birthTimeCode}` : "출생시간: 미상"

  const lineYear = yearPillar
    ? `연주(참고): ${yearPillar.ganji} (${yearPillar.yinYang}${yearPillar.element}) / 띠: ${zodiac}`
    : `띠(참고): ${zodiac}`

  const lineHint = yearPillar
    ? `오행 힌트: ${yearPillar.element} 기운(리듬·지속·성장/정리 포인트) — ${yearPillar.note}`
    : `성향 힌트: 꾸준함/리듬/선택과 집중 (정밀 명식 계산은 추후 고도화)`

  return [lineYear, time, lineHint].join("\n")
}
