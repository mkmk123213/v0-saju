import { createClient } from "@/lib/supabase/client"; // 너 프로젝트 경로에 맞춰 필요시 수정

export async function apiCreateSummary(payload: {
  profile_id: string;
  type: string;
  target_date?: string | null;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("NO_SESSION");

  const res = await fetch("/api/readings/create-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "CREATE_SUMMARY_FAILED");
  }

  return res.json() as Promise<{ reading_id: string; result_summary: any }>;
}

export async function apiGenerateDetail(payload: { reading_id: string }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("NO_SESSION");

  const res = await fetch("/api/readings/generate-detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // unlock_failed(402) 같은 케이스 처리용
    const e = new Error(err?.error ?? "GENERATE_DETAIL_FAILED") as any;
    e.detail = err;
    e.status = res.status;
    throw e;
  }

  return res.json() as Promise<{ reading_id: string; result_detail: any; cached?: boolean }>;
}
