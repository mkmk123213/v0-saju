export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey: key });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL_MISSING");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return createClient(url, serviceKey);
}

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
    } catch (e: any) {
      const code = e?.message ?? "SUPABASE_ENV_MISSING";
      return NextResponse.json(
        {
          error: code,
          hint:
            code === "SUPABASE_SERVICE_ROLE_KEY_MISSING"
              ? "Vercel Environment Variables에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요."
              : "Vercel Environment Variables에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 확인하세요.",
        },
        { status: 500 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    const user_id = userData?.user?.id;
    if (userErr || !user_id) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

    const body = await req.json();
    // type: "daily" | "yearly" | "saju"
    const { profile_id, type = "daily", target_date = null, target_year = null } = body ?? {};
    if (!profile_id) return NextResponse.json({ error: "missing_profile_id" }, { status: 400 });

    // ✅ Idempotency / Unique constraint guard:
    // If a reading for the same (user_id, profile_id, type, target_date/target_year) already exists,
    // return it instead of inserting a duplicate (prevents readings_daily_unique violation).
    const baseQuery = supabaseAdmin
      .from("readings")
      .select("id,result_summary,input_snapshot")
      .eq("user_id", user_id)
      .eq("profile_id", profile_id)
      .eq("type", type);

    const existingQ =
      type === "yearly"
        ? baseQuery.eq("target_year", target_year ?? new Date().getFullYear())
        : baseQuery.eq("target_date", target_date ?? new Date().toISOString().slice(0, 10));

    const { data: existing, error: exErr } = await existingQ.order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (exErr) {
      // if query fails, continue (will surface insert error later)
      console.warn("existing check failed:", exErr.message);
    } else if (existing?.id) {
      // If summary already exists, return immediately.
      if (existing.result_summary) {
        return NextResponse.json({ reading_id: existing.id, result_summary: existing.result_summary, reused: true });
      }
      // else: we'll regenerate and update below using the existing id.
    }

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id,user_id,name,relationship,birth_date,birth_time,gender,calendar_type")
      .eq("id", profile_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (pErr || !profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

    const input_snapshot = existing?.input_snapshot ?? {
      profile: {
        name: profile.name,
        relationship: profile.relationship,
        birth_date: profile.birth_date,
        birth_time: profile.birth_time ?? null,
        gender: profile.gender,
        calendar_type: profile.calendar_type,
        timezone: "Asia/Seoul",
      },
      reading: { type, target_date, target_year },
    };

    const reading_id = existing?.id ?? crypto.randomUUID();

    const summarySchema = {
      name: "result_summary",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "subtitle", "scores", "rokIt", "summary_text", "disclaimer"],
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          scores: {
            type: "object",
            additionalProperties: false,
            required: ["overall", "money", "love", "health"],
            properties: {
              overall: { type: "integer", minimum: 0, maximum: 100 },
              money: { type: "integer", minimum: 0, maximum: 100 },
              love: { type: "integer", minimum: 0, maximum: 100 },
              health: { type: "integer", minimum: 0, maximum: 100 },
            },
          },
          rokIt: {
            type: "object",
            additionalProperties: false,
            required: ["saju_hint", "astro_hint", "combined_hint"],
            properties: {
              saju_hint: { type: "string" },
              astro_hint: { type: "string" },
              combined_hint: { type: "string" },
            },
          },
          summary_text: { type: "string" },
          disclaimer: { type: "string" },
        },
      },
    };

    let openai: OpenAI;
    try {
      openai = getOpenAI();
    } catch (e: any) {
      if (e?.message === "OPENAI_API_KEY_MISSING") {
        return NextResponse.json(
          { error: "OPENAI_API_KEY_MISSING", hint: "Vercel Environment Variables에 OPENAI_API_KEY를 추가하세요." },
          { status: 500 }
        );
      }
      throw e;
    }

    const ai = await openai.responses.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_schema", json_schema: summarySchema as any },
      input: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: `너는 사주(명리) + 서양 점성술(태양궁 중심, 출생시간 없으면 달/상승궁은 추정)을 조합해 운세 요약을 만든다.
반드시 JSON만 출력. 과장/단정 금지. 실용적 조언 중심.
scores는 0~100 정수. summary_text는 2~4문단.`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `입력:
${JSON.stringify(input_snapshot)}

출력 요구:
- title/subtitle은 화면에 바로 쓸 수 있게.
- rokIt(사주 힌트/점성술 힌트/조합 힌트)는 짧고 직관적으로.
- summary_text는 사용자 행동을 유도.`,
            },
          ],
        },
      ],
    });

    const result_summary = JSON.parse(ai.output_text);

    if (existing?.id) {
      const { error: upErr } = await supabaseAdmin
        .from("readings")
        .update({ result_summary, input_snapshot })
        .eq("id", reading_id)
        .eq("user_id", user_id);

      if (upErr) return NextResponse.json({ error: "db_update_failed", detail: upErr.message }, { status: 500 });

      return NextResponse.json({ reading_id, result_summary, reused: true });
    }

    const { error: insErr } = await supabaseAdmin.from("readings").insert({
      id: reading_id,
      user_id,
      profile_id,
      type,
      target_date: type === "yearly" ? null : (target_date ?? new Date().toISOString().slice(0, 10)),
      target_year: type === "yearly" ? (target_year ?? new Date().getFullYear()) : null,
      input_snapshot,
      result_summary,
      result_detail: null,
    });

    if (insErr) {
      // If we still hit a unique constraint, fall back to returning the existing row.
      if (/readings_daily_unique|duplicate key value/i.test(insErr.message)) {
        const { data: again } = await existingQ.order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (again?.id) {
          return NextResponse.json({ reading_id: again.id, result_summary: again.result_summary ?? result_summary, reused: true });
        }
      }
      return NextResponse.json({ error: "db_insert_failed", detail: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ reading_id, result_summary, reused: false });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "internal_error", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
