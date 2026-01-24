import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAstroSummary } from "@/lib/astro";
import { buildSajuLiteSummary } from "@/lib/saju-lite";
import { buildSajuChart } from "@/lib/saju-chart";

export const runtime = "nodejs";

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
      return NextResponse.json({
        reading_id: cached.data.id,
        result_summary: cached.data.result_summary,
        cached: true,
      });
    }

    const astro_summary = buildAstroSummary(profile.birth_date);
    const saju_summary = buildSajuLiteSummary(profile.birth_date, profile.birth_time_code);
    const sajuChart = buildSajuChart(profile.birth_date, profile.birth_time_code);

    const system = `너는 "사주(동양) + 서양 점성술(별자리)"을 결합해
짧고 단정한 한국어 운세를 쓰는 전문가야.

말투:
- 무조건 반말체, 친근하고 스윗하게. 존댓말 금지.

목표:
- 읽는 사람이 "소름"이라고 느낄 만큼 구체적이고 정확해 보이게 써.
- 공포 조장/단정적 불행 예언/의학·법률 단정은 금지.
- 오늘 하루에 초점을 맞춘 실천 조언을 줘.

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

[별자리 요약(서버 제공)]
${astro_summary}

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
  "saju_chart": {
    "pillars": {
      "year": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "month": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "day": { "stem_hanja": "", "stem_kor": "", "stem_element": "목|화|토|금|수", "stem_yinyang": "양|음", "branch_hanja": "", "branch_kor": "", "branch_animal": "", "branch_element": "목|화|토|금|수", "branch_yinyang": "양|음", "ganji_hanja": "", "ganji_kor": "" },
      "hour": null
    },
    "notes": []
  },
  "sections": {
    "overall": "총운(2~3문장, 짧게)",
    "money": "금전운(2~3문장, 짧게)",
    "love": "애정운(2~3문장, 짧게)",
    "health": "건강운(2~3문장, 짧게)"
  },
  "section_evidence": {
    "overall": ["근거 1(짧게)", "근거 2(짧게)"],
    "money": ["근거 1(짧게)", "근거 2(짧게)"],
    "love": ["근거 1(짧게)", "근거 2(짧게)"],
    "health": ["근거 1(짧게)", "근거 2(짧게)"]
  },
  "spine_chill": {
    "prediction": "오늘 실제로 벌어질 가능성이 높은 관찰 1문장(20~45자)",
    "time_window": "오전|점심|오후|저녁 중 하나",
    "verification": "사용자가 오늘 확인할 체크포인트 1개"
  },
  "saju_brief": "사주 요약 2~3문장(짧게)",
  "astro_brief": "별자리 요약 2~3문장(짧게)",
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
  "scores": { "overall": 0, "money": 0, "love": 0, "health": 0 }
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
- saju_chart는 반드시 위 구조를 유지해 출력해(값은 서버에서 최종 보정된다).
- sections 4개는 각각 2~3문장만. 짧고 단정하게.
- section_evidence는 각 섹션당 2개씩:
  - 반드시 '사주 요약(연주/오행/띠/리듬/집중)' 또는 '별자리 요약(강점/주의 키워드)' 중 최소 1개 요소를 포함해.
  - "왜 그렇게 말하는지"가 보이게 원인→현상 형태로.
- spine_chill은 반드시 포함:
  - prediction: 오늘 실제로 겪을 법한 구체 상황 1개(연락/일정/지출/실수/만남 중 하나).
  - time_window: 오전/점심/오후/저녁 중 하나로 고정.
  - verification: 사용자가 오늘 "맞았다/아니다" 판단 가능한 체크포인트 1개.
- 흔한 문장("긍정적으로 생각해"류) 금지. 더 구체적으로.
- today_keys.value는 1~8단어로 짧게. why는 1문장.
- today_keys.why는 사주/별자리 키워드(예: 꾸준함/도전/과신/리듬/집중 등) 중 최소 1개 포함.
- 금기: 오늘 하루 "하지 말아야 할 구체 행동"으로.
- 실천: 5~15분 안에 가능한 행동으로.
- 귀인: 사람유형 + 등장 장면(짧게)로.
- 점수는 0~100 정수.
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
          max_tokens: 700,
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
      // 서버 계산 사주 표(연/월/일/시) 주입
      if (sajuChart) {
        result_summary = result_summary ?? {};
        result_summary.saju_chart = sajuChart;
      }
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
