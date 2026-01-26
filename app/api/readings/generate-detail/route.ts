import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 프리미엄 상세보기 기능을 제거했어.
// 기존 클라이언트/캐시에서 이 엔드포인트를 호출할 수 있으므로 410으로 명확히 응답한다.
export async function POST() {
  return NextResponse.json(
    {
      error: "detail_removed",
      message: "상세보기 기능이 제거되었어. 요약 결과만 제공해.",
    },
    { status: 410 }
  );
}
