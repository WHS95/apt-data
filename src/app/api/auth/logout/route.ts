import { NextResponse } from "next/server";
import { 관리자_쿠키명 } from "../../../../infrastructure/관리자_인증";

export const dynamic = "force-dynamic";

export async function POST(요청: Request) {
  const base = new URL(요청.url).origin;
  const 응답 = NextResponse.redirect(new URL("/admin/login", base), 303);
  응답.cookies.delete(관리자_쿠키명);
  return 응답;
}
