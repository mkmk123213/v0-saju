import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 401 });

  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const user_id = userData?.user?.id;
  if (!user_id) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  const body = await req.json();
  const { reading_id } = body ?? {};
  if (!reading_id) return NextResponse.json({ error: "missing_reading_id" }, { status: 400 });

  const { data: reading, error: rErr } = await supabaseAdmin
    .from("readings")
    .select("id,user_id,input_snapshot,result_detail")
    .eq("id", reading_id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (rErr || !reading) return NextResponse.json({ error: "reading_not_found" }, { status: 404 });

  // 이미 상세가 있으면 재사용 (비용 방어)
  if (reading.result_detail) {
    return NextResponse.json({ reading_id, result_detail: reading.result_detail, cached: true });
  }

  // ✅ auth.uid()가 필요한 RPC는 "유저 토큰으로 만든 anon client"로 호출
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { error: unlockErr } = await supabaseUser.rpc("rpc_unlock_detail", { reading_id });
  if (unlockErr) {
    return NextResponse.json({ error: "unlock_failed", detail: unlockErr.message }, { status: 402 });
  }

  const detailSchema = {
    name: "result_detail",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["combined","saju","astrology","sections","lucky","disclaimer"],
      properties: {
        combined: {
          type: "object",
          additionalProperties: false,
          required: ["core_theme","strengths","cautions","action_steps"],
          properties: {
            core_theme: { type: "string" },
            strengths: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
            cautions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
            action_steps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
          },
        },
        saju: {
          type: "object",
          additionalProperties: false,
          required: ["key_insights","confidence"],
          properties: {
            pillars: { type: "string" },
            five_elements: {
              type: "object",
              additionalProperties: false,
              required: ["wood","fire","earth","metal","water"],
              properties: {
                wood: { type: "integer", minimum: 0, maximum: 8 },
                fire: { type: "integer", minimum: 0, maximum: 8 },
                earth:{ type: "integer", minimum: 0, maximum: 8 },
                metal:{ type: "integer", minimum: 0, maximum: 8 },
                water:{ type: "integer", minimum: 0, maximum: 8 }
              }
            },
            key_insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
        astrology: {
          type: "object",
          additionalProperties: false,
          required: ["sun_sign","key_insights","confidence"],
          properties: {
            sun_sign: { type: "string" },
            moon_sign: { type: "string" },
            rising_sign: { type: "string" },
            key_insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
        sections: {
          type: "object",
          additionalProperties: false,
          required: ["love","career","money","health"],
          properties: {
            love: { type: "object", additionalProperties: false, required: ["text","tips"], properties: {
              text: { type: "string" }, tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
            }},
            career: { type: "object", additionalProperties: false, required: ["text","tips"], properties: {
              text: { type: "string" }, tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
            }},
            money: { type: "object", additionalProperties: false, required: ["text","tips"], properties: {
              text: { type: "string" }, tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
            }},
            health: { type: "object", additionalProperties: false, required: ["text","tips"], properties: {
              text: { type: "string" }, tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 }
            }},
          },
        },
        lucky: {
          type: "object",
          additionalProperties: false,
          required: ["colors","numbers","times","avoid"],
          properties: {
            colors: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
            numbers: { type: "array", items: { type: "integer" }, minItems: 1, maxItems: 4 },
            times: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
            avoid: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
          },
        },
        disclaimer: { type: "string" },
      },
    },
  };

  const ai = await openai.responses.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_schema", json_schema: detailSchema },
    input: [
      { role: "system", content: [{ type: "text", text:
`너는 사주+점성술 결합 "상세 운세"를 생성한다.
반드시 JSON만 출력. 단정/공포 조장 금지. 실행 가능한 조언 중심.
출생시간이 없으면 moon_sign/rising_sign은 "unknown"으로, confidence를 낮춰라.` }]},
      { role: "user", content: [{ type: "text", text:
`입력:
${JSON.stringify(reading.input_snapshot)}

요청:
- combined(core_theme/강점/주의/실행계획)을 가장 사용자친화적으로.
- love/career/money/health는 현실적인 팁 포함.
- lucky는 색/숫자/시간대/피할 것.` }]}
    ],
  });

  const result_detail = JSON.parse(ai.output_text);

  const { error: upErr } = await supabaseAdmin
    .from("readings")
    .update({ result_detail })
    .eq("id", reading_id)
    .eq("user_id", user_id);

  if (upErr) return NextResponse.json({ error: "db_update_failed", detail: upErr.message }, { status: 500 });

  return NextResponse.json({ reading_id, result_detail, cached: false });
}
