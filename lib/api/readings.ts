import { supabase } from "@/lib/supabaseClient";

type CreateSummaryPayload = {
  profile_id: string;
  type: string;
  target_date?: string | null;
  target_year?: number | null;
};

type ApiError = {
  status?: number;
  message?: string;
  detail?: any;
};

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

function normalizeCreateSummaryResponse(payload: any) {
  if (!payload) return null;

  // ✅ 표준 형태: { reading_id, result_summary }
  if (typeof payload.reading_id === "string") {
    return {
      reading_id: payload.reading_id,
      result_summary:
        payload.result_summary ??
        payload.summary ??
        payload.data?.result_summary ??
        null,
    };
  }

  // 혹시 서버가 { id, result_summary } or { data: { id, result_summary } } 형태로 내려줘도 대응
  const candidate = payload.data ?? payload;
  if (candidate && typeof candidate.id === "string") {
    return {
      reading_id: candidate.id,
      result_summary: candidate.result_summary ?? null,
    };
  }

  return null;
}

async function requestJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const payload: any = await parseJsonSafe(res);

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: payload?.message || payload?.error || `HTTP_${res.status}`,
      detail: payload?.detail ?? payload,
    };
    throw err;
  }

  return payload;
}

export async function apiCreateSummary(payload: CreateSummaryPayload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("NO_SESSION");

  const raw = await requestJson("/api/readings/create-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const normalized = normalizeCreateSummaryResponse(raw);

  if (!normalized?.reading_id) {
    // 🔥 여기서 명확하게 막아줌 → 이후 코드에서 undefined 변수 안 터짐
    const e: any = new Error("INVALID_CREATE_SUMMARY_RESPONSE");
    e.detail = raw;
    e.status = 500;
    throw e;
  }

  return normalized as { reading_id: string; result_summary: any };
}

export async function apiGenerateDetail(payload: { reading_id: string }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("NO_SESSION");

  return requestJson("/api/readings/generate-detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
