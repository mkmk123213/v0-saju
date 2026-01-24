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
    if (res.status === 429 && t.includes("insufficient_quota")) return res;
    if (res.status === 429 || res.status >= 500) {
      await sleep(500 * Math.pow(2, i));
      continue;
    }
    return res;
  }
  return lastRes ?? (await fetcher());
}

async function openaiDetailJson(prompt: string) {
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
          temperature: 0.8,
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You generate detailed Korean fortune content. Output ONLY valid JSON with keys: combined{core_theme,strengths[],cautions[],action_steps[]}, sections{love{ text, tips[] }, career{ text, tips[] }, money{ text, tips[] }, health{ text, tips[] }}, lucky{colors[],numbers[],times[],avoid[]} . Keep arrays short.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }),
    3
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
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
    return { combined: {}, sections: {}, lucky: {} };
  }
}

async function rpcUnlockDetail(supabaseUser: any, reading_id: string) {
  const tryUnlock = async (args: Record<string, any>) => {
    const { error } = await supabaseUser.rpc("rpc_unlock_detail", args);
    return error;
  };
  let unlockErr = await tryUnlock({ reading_id });
  if (unlockErr && /p_reading_id|parameter|unknown/i.test(unlockErr.message)) {
    unlockErr = await tryUnlock({ p_reading_id: reading_id });
  }
  return unlockErr;
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
    const { reading_id } = body ?? {};
    if (!reading_id) return NextResponse.json({ error: "missing_reading_id" }, { status: 400 });

    // user-context client (RLS 적용) for rpc_unlock_detail
    const url = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
    const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
    if (!url || !anonKey) return NextResponse.json({ error: "SUPABASE_PUBLIC_ENV_MISSING" }, { status: 500 });
    const supabaseUser = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

    const unlockErr = await rpcUnlockDetail(supabaseUser, reading_id);
    if (unlockErr) {
      return NextResponse.json({ error: "unlock_failed", detail: unlockErr.message }, { status: 402 });
    }

    // read reading + profile (admin)
    const { data: reading, error: rErr } = await supabaseAdmin
      .from("readings")
      .select("id,user_id,profile_id,type,target_date,target_year,input_snapshot")
      .eq("id", reading_id)
      .eq("user_id", user_id)
      .single();

    if (rErr || !reading) return NextResponse.json({ error: "reading_not_found" }, { status: 404 });

    const prompt = `다음 입력으로 운세 상세를 생성해줘.\n- 타입: ${reading.type}\n- 날짜: ${reading.target_date ?? ""}\n- 연도: ${reading.target_year ?? ""}\n\n입력 JSON:\n${JSON.stringify(
      reading.input_snapshot
    )}\n\n요청: 현실적인 조언 + 실행 가능한 팁 위주로 한국어로 작성.`;

    const result_detail = await openaiDetailJson(prompt);

    const { error: uErr } = await supabaseAdmin
      .from("readings")
      .update({ result_detail })
      .eq("id", reading_id)
      .eq("user_id", user_id);

    if (uErr) return NextResponse.json({ error: "db_update_failed", detail: uErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, reading_id, result_detail });
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
