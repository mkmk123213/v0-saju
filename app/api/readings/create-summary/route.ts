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
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
}

function getSupabaseAdmin() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
  const key = getServiceRoleKey();
  if (!url) throw new Error("SUPABASE_URL_MISSING");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAIKey() {
  return env("OPENAI_API_KEY") || env("OPENAI_API_KEY");
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
    if (res.ok) return res;
    lastRes = res;
    const t = await res.clone().text().catch(() => "");
    // quota 부족은 재시도해도 해결되지 않음
    if (res.status === 429 && t.includes("insufficient_quota")) return res;
    if (res.status === 429 || res.status >= 500) {
      await sleep(500 * Math.pow(2, i));
      continue;
    }
    return res;
  }
  return lastRes ?? (await fetcher());
}

async function openaiJson(system: string, user: string) {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");

  const res = await fetchWithRetry(
    () =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
            { role: "user", content: user },
          ],
        }),
      }),
    { retries: 3, baseMs: 500 }
  );

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 429 && text.includes("insufficient_quota")) {
      const err: any = new Error("OPENAI_INSUFFICIENT_QUOTA");
      err.status = 402;
      err.detail = text;
      throw err;
    }
    const err: any = new Error("OPENAI_CALL_FAILED");
    err.status = res.status;
    err.detail = text;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    const err: any = new Error("OPENAI_JSON_PARSE_FAILED");
    err.status = 500;
    err.detail = text;
    throw err;
  }
}


export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
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

    const cachedRes = isDaily && target_date
      ? await cacheBase.eq("target_date", target_date).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : isYearlyLike && target_year
      ? await cacheBase.eq("target_year", target_year).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : await cacheBase.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (cachedRes?.data?.id && cachedRes.data.result_summary) {
      return NextResponse.json({ reading_id: cachedRes.data.id, result_summary: cachedRes.data.result_summary });
    }

    // ✅ 서버에서 계산/요약(짧게)해 프롬프트에 주입
    const astro_summary = buildAstroSummary(profile.birth_date);
    const saju_summary = buildSajuLiteSummary(profile.birth_date, profile.birth_time_code);

    let system = "너는 \"사주(동양) + 서양 점성술(별자리)\"을 결합해\n짧고 단정한 한국어 운세를 쓰는 전문가다.\n\n목표:\n- 읽는 사람이 \"소름\"이라고 느낄 만큼 구체적이고 정확해 보이게 쓴다.\n- 공포 조장/단정적 불행 예언/의학·법률 단정은 금지.\n- 오늘 하루에 초점을 맞춘 실천 조언을 준다.\n\n재현성 규칙(매우 중요):\n- 입력이 완전히 같으면 결과 문장/표현/선택을 최대한 동일하게 유지한다.\n- 동의어 바꿔치기/말투 변주/랜덤 예시 변경 금지.\n- JSON 키 순서와 필드 구조를 절대 바꾸지 마라.\n- JSON만 출력(설명문/마크다운/코드블록 금지).\n";
    let userPrompt: string;

    if (type === "daily") {
      userPrompt = "아래 입력으로 \"오늘의 운세\"를 작성해라.\n\n[프로필]\n이름: ${name}\n생년월일(양력): ${birth_date}\n출생시간: ${birth_time_code}\n관계: ${relationship}\n\n[사주 요약(서버 제공)]\n${saju_summary}\n\n[별자리 요약(서버 제공)]\n${astro_summary}\n\n[운세 날짜]\n${target_date}\n\n[출력(JSON 고정 스키마)]\n{\n  \"daily_summary\": \"5~7문장. 단정한 톤. 소름 포인트 1개 포함(일상에서 바로 확인 가능한 관찰).\",\n  \"saju_brief\": \"2~3문장.\",\n  \"astro_brief\": \"2~3문장.\",\n  \"evidence\": {\n    \"saju\": [\"근거 1(짧게)\", \"근거 2(짧게)\"],\n    \"astro\": [\"근거 1(짧게)\", \"근거 2(짧게)\"],\n    \"today\": [\"오늘 날짜/요일/흐름 기반 근거 1(짧게)\"]\n  },\n  \"today_keys\": {\n    \"color\": { \"value\": \"오늘의 색깔\", \"why\": \"한 줄 근거\" },\n    \"taboo\": { \"value\": \"오늘의 금기\", \"why\": \"한 줄 근거\" },\n    \"talisman\": { \"value\": \"오늘의 부적\", \"why\": \"한 줄 근거\" },\n    \"lucky_spot\": { \"value\": \"럭키 스팟\", \"why\": \"한 줄 근거\" },\n    \"number\": { \"value\": \"오늘의 숫자\", \"why\": \"한 줄 근거\" },\n    \"food\": { \"value\": \"오늘의 음식\", \"why\": \"한 줄 근거\" },\n    \"item\": { \"value\": \"오늘의 소지품\", \"why\": \"한 줄 근거\" },\n    \"action\": { \"value\": \"오늘의 실천\", \"why\": \"한 줄 근거\" },\n    \"helper\": { \"value\": \"오늘의 귀인(사람유형)\", \"why\": \"한 줄 근거\" }\n  },\n  \"scores\": { \"overall\": 0, \"love\": 0, \"money\": 0, \"health\": 0 }\n}\n\n세부 규칙:\n- 점수는 0~100 정수.\n- 전부 한국어.\n- 흔한 문장(“긍정적으로 생각하세요” 류) 금지.\n- 근거는 짧고 명확하게.\n- 귀인은 \"직군/관계/분위기\"로 제시(예: '말이 짧은 선배', '침착한 동료', '늦은 시간에 연락오는 친구').\n- 금기는 오늘 하루에 적용 가능한 행동으로.\n- 부적은 과장 주술 대신 '상징물/패턴/짧은 문구'로.\n- JSON 외 텍스트 출력 금지.\n"
        .replace("${name}", String(profile.name ?? ""))
        .replace("${birth_date}", String(profile.birth_date ?? ""))
        .replace("${birth_time_code}", String(profile.birth_time_code ?? "모름"))
        .replace("${relationship}", String(profile.relationship ?? "본인"))
        .replace("${saju_summary}", saju_summary)
        .replace("${astro_summary}", astro_summary)
        .replace("${target_date}", String(target_date ?? ""));
    } else {
      // 다른 타입은 기존 라이트 JSON 스키마(호환)
      system = "You are an assistant that generates Korean fortune-telling content. Output ONLY valid JSON.";
      userPrompt = `다음 입력으로 운세 요약을 생성해줘.\n- 타입: ${type}\n- 날짜: ${target_date ?? ""}\n- 연도: ${target_year ?? ""}\n\n입력 JSON:\n${JSON.stringify(
        input_snapshot
      )}\n\n요청: 오늘의 조언, 핵심 테마, 주의점 위주로 한국어로 작성.\n\nJSON 스키마: {"summary_text": string, "scores": {"overall": 0-100, "love": 0-100, "money": 0-100, "health": 0-100}, "lucky": {"color": string, "number": string, "direction": string, "food": string}}`;
    }

    const result_summary = await openaiJson(system, userPrompt);

    // ✅ 중복 방지: daily는 (user_id, profile_id, type, target_date) 유니크일 수 있음const reading_id = crypto.randomUUID();
    const now = new Date().toISOString();

    const upsertPayload: any = {
      id: reading_id,
      user_id,
      profile_id,
      type,
      target_date,
      target_year,
      input_snapshot,
      result_summary,
      result_detail: null,
      created_at: now,
    };

    const { data: saved, error: saveErr } = await supabaseAdmin
      .from("readings")
      .upsert(upsertPayload, {
        onConflict: "user_id,profile_id,type,target_date",
      })
      .select("id,result_summary")
      .single();

    if (saveErr) {
      // 다른 타입/인덱스 조합 프로젝트도 있을 수 있어 fallback: 단순 insert
      const { data: ins, error: insErr } = await supabaseAdmin
        .from("readings")
        .insert(upsertPayload)
        .select("id,result_summary")
        .single();
      if (insErr || !ins) return NextResponse.json({ error: "db_insert_failed", detail: insErr?.message }, { status: 500 });
      return NextResponse.json({ reading_id: ins.id, result_summary: ins.result_summary });
    }

    return NextResponse.json({ reading_id: saved.id, result_summary: saved.result_summary });
  } catch (e: any) {
    const msg = e?.message ?? "unknown";
    const status = typeof e?.status === "number" ? e.status : 500;
    if (msg === "OPENAI_INSUFFICIENT_QUOTA") {
      return NextResponse.json(
        {
          error: "OPENAI_INSUFFICIENT_QUOTA",
          message:
            "OpenAI API 크레딧/결제 한도가 부족해요. OpenAI 콘솔에서 Billing/Usage 한도를 확인해주세요.",
          detail: e?.detail ?? null,
        },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: msg, detail: e?.detail ?? null }, { status });
  }
}
