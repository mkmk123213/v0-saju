import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

async function openaiJson(prompt: string) {
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
          temperature: 0.7,
          max_tokens: 600,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that generates Korean fortune-telling content. Output ONLY valid JSON with keys: summary_text (string), scores (object with overall,money,love,health 0-100 ints), rokIt (object with saju_hint, astro_hint, combined_hint strings). Keep it concise and friendly.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }),
    3
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    // quota 부족은 사용자에게 더 친절한 에러로 변환
    if (res.status === 429 && t.includes("insufficient_quota")) {
      const e: any = new Error("OPENAI_INSUFFICIENT_QUOTA");
      e.status = 402;
      e.detail = t;
      throw e;
    }
    const e: any = new Error("OPENAI_CALL_FAILED");
    e.status = res.status;
    e.detail = t;
    throw e;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("OPENAI_EMPTY");
  try {
    return JSON.parse(content);
  } catch {
    return {
      summary_text: content,
      scores: { overall: 70, money: 65, love: 68, health: 66 },
      rokIt: { saju_hint: "", astro_hint: "", combined_hint: "" },
    };
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

    const prompt = `다음 입력으로 운세 요약을 생성해줘.\n- 타입: ${type}\n- 날짜: ${target_date ?? ""}\n- 연도: ${target_year ?? ""}\n\n입력 JSON:\n${JSON.stringify(
      input_snapshot
    )}\n\n요청: 오늘의 조언, 핵심 테마, 주의점 위주로 한국어로 작성.`;

    const result_summary = await openaiJson(prompt);

    // ✅ 중복 방지: daily는 (user_id, profile_id, type, target_date) 유니크일 수 있음
    const reading_id = crypto.randomUUID();
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
