"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  비밀번호_확인,
  세션_토큰_생성,
  관리자_쿠키명,
  관리자_쿠키_TTL_초,
} from "../../infrastructure/관리자_인증";

export async function 로그인_처리(formData: FormData) {
  if (!비밀번호_확인(formData.get("password"))) {
    redirect("/admin/login?error=1");
  }
  const 토큰 = 세션_토큰_생성();
  if (!토큰) {
    redirect("/admin/login?error=config");
  }
  (await cookies()).set(관리자_쿠키명, 토큰, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // 로컬 http 에서도 로그인되게
    sameSite: "lax",
    path: "/",
    maxAge: 관리자_쿠키_TTL_초,
  });
  redirect("/admin");
}

export async function 로그아웃() {
  (await cookies()).delete(관리자_쿠키명);
  redirect("/admin/login");
}
