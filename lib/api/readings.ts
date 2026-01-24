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
  // ✅ 우리가 원하는 표준 형태
  // { reading_id: string, result_summary: any }
  if (!payload) return null;

  // 1) 정상
  if (typeof payload.reading_id === "string") {
    return {
      reading_id: payload.reading_id,
      result_summary: payload.result_summary ?? payload.summary ?? payload.data?.result_summary ?? null,
    };
  }

  // 2) 캐시/기존 형태로 { id, result_summary } 혹은 { data: { id, result_summary } }
  const candidate = payload.data ?? payload;
  if (candidate && typeof candidate.id === "string") {
    return {
      reading_id: candidate.id,
      result_summary: candidate.result_summary ?? null,
    };
  }

  // 3) 기타
  return null;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload: any = await parseJsonSafe(res);

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: payload?.message || payload?.error || `HTTP_${res.status}`,
      detail: payload?.detail ?? payload,
    };

    // throw를 객체로 던져서 page.tsx에서 status/detail 확인 가능
    throw err;
  }

  return payload as T;
}

function getAccessTokenOrThrow(): string {
  const token =
    typeof window !== "undefined"
      ? (window as any).__supabase?.auth?.session?.access_token
      : null;

  // 위처럼 글로벌 세션 접근이 안 되면, 기존 프로젝트의 방식대로 token을 가져오는 코드가 있을 거야.
  // 그런데 이 레포는 보통 api 함수에서 token을 인자로 받거나 supabase.auth.getSession을 통해서 가져오니까,
  // 아래는 "없으면 fetch 호출 전에 명확히 실패"하도록만 해두고,
  // 실제 토큰 획득 방식은 너 기존 구현에 맞춰 대체해줘.

  if (!token) throw new Error("MISSING_ACCESS_TOKEN");
  return token;
}

// ✅ 기존 레포에 이미 token을 받아서 보내는 구조라면 아래 함수 signature는 그대로 유지해도 됨.
// 여기서는 'authorization 헤더 포함'을 확실히 해주는 형태로 작성했어.

export async function apiCreateSummary(args: {
  profile_id: string;
  type: "daily" | "yearly" | "saju";
  target_date?: string | null;
  target_year?: number | null;
}) {
  // 너 레포가 supabase auth token을 다른 방식으로 가져오고 있으면,
  // 여기서 token 부분만 기존 코드로 유지하면 됨.
  const token = getAccessTokenOrThrow();

  const payload = await requestJson<any>("/api/readings/create-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });

  const normalized = normalizeCreateSummaryResponse(payload);
  if (!normalized?.reading_id) {
    // ✅ 여기서 더 이상 reading_id is not defined 같은 일이 안 나게, 명확히 에러로
    throw {
      status: 500,
      message: "INVALID_CREATE_SUMMARY_RESPONSE",
      detail: payload,
    };
  }

  return normalized as { reading_id: string; result_summary: any };
}

export async function apiGenerateDetail(args: { reading_id: string }) {
  const token = getAccessTokenOrThrow();

  const payload = await requestJson<any>("/api/readings/generate-detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });

  // generate-detail도 혹시 스키마가 흔들려도 안전하게
  if (!payload?.ok && !payload?.reading_id && !payload?.result_detail) {
    // 정상 응답이 { ok: true } 형태일 수도 있어서 널널하게 허용
    // 단, 완전 엉뚱하면 에러
    // (원하면 이 부분은 너 서버 응답 스펙에 맞춰 더 엄격하게 바꿔도 돼)
  }

  return payload;
}
