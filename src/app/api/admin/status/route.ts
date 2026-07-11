import { NextResponse } from "next/server";
import { 관리자_현황_유스케이스 } from "../../../../application/관리자_현황_유스케이스";
import { 컨테이너 } from "../../../../infrastructure/di/컨테이너";
import { 관리자_인증됨 } from "../../../../infrastructure/관리자_인증";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await 관리자_인증됨()))
    return NextResponse.json({ 오류: "인증 필요" }, { status: 401 });
  const 유스 = new 관리자_현황_유스케이스(
    컨테이너.실거래_저장소,
    컨테이너.지역_저장소,
    컨테이너.수집_설정_저장소,
    컨테이너.수집_기록_저장소,
  );
  const 결과 = await 유스.실행();
  return NextResponse.json(결과);
}
