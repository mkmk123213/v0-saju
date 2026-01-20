import { supabase } from "@/lib/supabaseClient";

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("NO_SESSION");
  return token;
}

export async function apiCreateSummary(payload: {
  profile_id: string;
  type: string;
  target_date?: string | null;
  target_year?: number | null;
}) {
  const token = await getAccessToken();

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
    const e: any = new Error(err?.error ?? "CREATE_SUMMARY_FAILED");
    e.detail = err;
    e.status = res.status;
    throw e;
  }

  return (await res.json()) as { reading_id: string; result_summary: any };
}

export async function apiGenerateDetail(payload: { reading_id: string }) {
  const token = await getAccessToken();

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
    const e: any = new Error(err?.error ?? "GENERATE_DETAIL_FAILED");
    e.detail = err;
    e.status = res.status;
    throw e;
  }

  return (await res.json()) as { reading_id: string; result_detail: any; cached?: boolean };
}
