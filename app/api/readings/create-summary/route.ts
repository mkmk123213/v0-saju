import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAstroSummary } from "@/lib/astro";
import { buildSajuLiteSummary } from "@/lib/saju-lite";

export const runtime = "nodejs";

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

function getServiceRoleKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

function getSupabaseAdmin() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
  const key = getServiceRoleKey();
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
 * NOTE: Do NOT retry on insufficient_quota.
 */
async function fetchWithRetry(fetcher: () => Promise<Response>, retries = 3) {
  let lastRes: Response | null = null;

  for (let i = 0; i < retries; i++) {
    const res = await fetcher();
    lastRes = res;

    if (res.ok) return res;

    const status = res.status;
    const text = await res.clone().text();

    // insufficient_quota는 재시도해도 해결 안 됨
    if (status === 429 && text.includes("insufficient_quota")) {
      return res;
    }

    if (status === 429 || status >= 500) {
      await sleep(500 * Math.pow(2, i)); // 0.5s, 1s, 2s
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
    };

    // ✅ 캐시(완전 동일 결과): 동일 프로필/타입/날짜(또는 연도)로 이미 생성된 요약이 있으면 OpenAI를 호출하지 않고 그대로 반환
    const cacheBase = supabaseAdmin
      .from("readings")
      .select("id,result_summary,created_at")
      .eq("user_id", user_id)
      .eq("profile_id", profile_id)
      .eq("type", type);

    const isDaily = type === "daily";
    const isYearlyLike = type === "yearly" || type === "saju";

    const cachedRes =
      isDaily && target_date
        ? await cacheBase.eq("target_date", target_date).order("created_at", { ascending: false }).limit(1).maybeSingle()
        : isYearlyLike && target_year
          ? await cacheBase.eq("target_year", target_year).order("created_at", { ascending: false }).limit(1).maybeSingle()
          : await cacheBase.order("created_at", { ascending: false }).limit(1).maybeSingle();

    // 🔥 핵심: 캐시 히트 시에도 프론트 계약( reading_id / result_summary )을 100% 맞춰서 반환
    if (cachedRes?.data?.id && cachedRes.data.result_summary) {
      return NextResponse.json({
        reading_id: cachedRes.data.id,
        result_summary: cachedRes.data.result_summary,
      });
    }

    // ✅ 서버에서 계산/요약(짧게)해 프롬프트에 주입
    const astro_summary = buildAstroSummary(profile.birth_date);
    const saju_summary = buildSajuLiteSummary(profile.birth_date, profile.birth_time_code);

    const system = `너는 "사주(동양) + 서양 점성술(별자리)"을 결합해
짧고 단정한 한국어 운세를 쓰는 전문가다.

목표:
- 읽는 사람이 "소름"이라고 느낄 만큼 구체적이고 정확해 보이게 쓴다.
- 공포 조장/단정적 불행 예언/의학·법률 단정은 금지.
- 오늘 하루에 초점을 맞춘 실천 조언을 준다.

재현성 규칙(매우 중요):
- 입력이 완전히 같으면 결과 문장/표현/선택을 최대한 동일하게 유지한다.
- 동의어 바꿔치기/말투 변주/랜덤 예시 변경 금지.
- JSON 키 순서와 필드 구조를 절대 바꾸지 마라.
- JSON만 출력(설명문/마크다운/코드블록 금지).
`;

    let userPrompt: string;

    if (type === "daily") {
      userPrompt = `아래 입력으로 "오늘의 운세"를 작성해라.

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
  "daily_summary": "5~7문장. 단정한 톤. 소름 포인트 1개 포함(일상에서 바로 확인 가능한 관찰).",
  "saju_brief": "2~3문장.",
  "astro_brief": "2~3문장.",
  "evidence": {
    "saju": ["근거 1(짧게)", "근거 2(짧게)"],
    "astro": ["근거 1(짧게)", "근거 2(짧게)"],
    "today": ["오늘 날짜/요일/흐름 기반 근거 1(짧게)"]
  },
  "today_keys": {
    "color": { "value": "오늘의 색깔", "why": "한 줄 근거" },
    "taboo": { "value": "오늘의 금기", "why": "한 줄 근거" },
    "talisman": { "value": "오늘의 부적", "why": "한 줄 근거" },
    "lucky_spot": { "value": "럭키 스팟", "why": "한 줄 근거" },
    "number": { "value": "오늘의 숫자", "why": "한 줄 근거" },
    "food": { "value": "오늘의 음식", "why": "한 줄 근거" },
    "item": { "value": "오늘의 소지품", "why": "한 줄 근거" },
    "action": { "value": "오늘의 실천", "why": "한 줄 근거" },
    "helper": { "value": "오늘의 귀인(사람유형)", "why": "한 줄 근거" }
  },
  "scores": { "overall": 0, "love": 0, "money": 0, "health": 0 }
}

세부 규칙:
- 점수는 0~100 정수.
- 전부 한국어.
- 흔한 문장(“긍정적으로 생각하세요” 류) 금지.
- 근거는 짧고 명확하게.
- 귀인은 "직군/관계/분위기"로 제시(예: '말이 짧은 선배', '침착한 동료', '늦은 시간에 연락오는 친구').
- 금기는 오늘 하루에 적용 가능한 행동으로.
- 부적은 과장 주술 대신 '상징물/패턴/짧은 문구'로.
- JSON 외 텍스트 출력 금지.
`;
    } else {
      // 기존 타입(예: yearly/saju)도 동작은 유지. (너가 지금은 daily 먼저 잡는 중이라 최소 변경)
      userPrompt = `아래 입력으로 운세 요약을 작성해라. JSON만 출력.
이름: ${profile.name}
생년월일: ${profile.birth_date}
출생시간: ${profile.birth_time_code ?? "모름"}
타입: ${type}
target_date: ${target_date ?? "없음"}
target_year: ${target_year ?? "없음"}

출력(JSON):
{
  "summary_text": "5~7문장 요약",
  "scores": { "overall": 0, "love": 0, "money": 0, "health": 0 }
}
`;
    }

    const openaiKey = getOpenAIKey();
    if (!openaiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY_MISSING" }, { status: 500 });
    }

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

      // quota 에러 친절 처리
      if (openaiRes.status === 429 && errText.includes("insufficient_quota")) {
        return NextResponse.json(
          {
            error: "OPENAI_INSUFFICIENT_QUOTA",
            message:
              "OpenAI API 크레딧/결제 한도가 부족해요. OpenAI 콘솔에서 Billing/Usage 한도를 확인해주세요.",
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
      // JSON 강제인데도 실패하면 그대로 저장
      result_summary = { raw: content };
    }

    // readings INSERT (SELECT 권한 이슈 피하려면 service role로 가능)
    const reading_id = crypto.randomUUID();

    const insertPayload: any = {
      id: reading_id,
      user_id,
      profile_id,
      type,
      target_date,
      target_year,
      input_snapshot,
      result_summary,
    };

    const { data: saved, error: insErr } = await supabaseAdmin
      .from("readings")
      .insert(insertPayload)
      .select("id,result_summary")
      .single();

    if (insErr) {
      // insert 실패 시에도 프론트 계약은 유지
      return NextResponse.json(
        { error: "DB_INSERT_FAILED", detail: String(insErr?.message ?? insErr) },
        { status: 500 }
      );
    }

    // ✅ 항상 동일한 응답 형태
    return NextResponse.json({
      reading_id: saved.id,
      result_summary: saved.result_summary,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "UNEXPECTED", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
