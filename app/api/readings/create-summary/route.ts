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

async function openaiJson(prompt: string) {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
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
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
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
    return NextResponse.json({ error: msg, detail: e?.detail ?? null }, { status });
  }
}
