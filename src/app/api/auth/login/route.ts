import { NextResponse } from "next/server";
import {
  비밀번호_확인,
  세션_토큰_생성,
  관리자_쿠키명,
  관리자_쿠키_TTL_초,
} from "../../../../infrastructure/관리자_인증";

// 관리자 로그인. Server Action 대신 일반 라우트 핸들러 — 폼 POST → 쿠키 설정 후 리다이렉트.
// /api/auth/* 는 게이트 없는 공개 경로(로그인/로그아웃).
export const dynamic = "force-dynamic";

export async function POST(요청: Request) {
  const base = new URL(요청.url).origin;
  const 폼 = await 요청.formData();

  if (!비밀번호_확인(폼.get("password"))) {
    return NextResponse.redirect(new URL("/admin/login?error=1", base), 303);
  }
  const 토큰 = 세션_토큰_생성();
  if (!토큰) {
    return NextResponse.redirect(new URL("/admin/login?error=config", base), 303);
  }

  const 응답 = NextResponse.redirect(new URL("/admin", base), 303);
  응답.cookies.set(관리자_쿠키명, 토큰, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // 로컬 http 에서도 로그인되게
    sameSite: "lax",
    path: "/",
    maxAge: 관리자_쿠키_TTL_초,
  });
  return 응답;
}
