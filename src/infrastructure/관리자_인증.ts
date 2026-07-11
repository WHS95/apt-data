import crypto from "node:crypto";
import { cookies } from "next/headers";

// 단일 관리자 비밀번호(.env ADMIN_PASSWORD) 기반 서명 쿠키 세션.
// 서명 secret 은 ADMIN_SESSION_SECRET(권장, 강한 랜덤) 우선, 없으면 비번 파생.
// 핵심: 아무 비밀도 없으면 게이트가 항상 거부(fail-closed) — 빈 비번에서
// 파생 secret 이 상수화되어 토큰이 위조되는 구멍을 막는다.

export const 관리자_쿠키명 = "apt_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
export const 관리자_쿠키_TTL_초 = Math.floor(TTL_MS / 1000);

/** 서명 secret. 실제 비밀이 하나도 없으면 null → 게이트/발급 모두 거부. */
function 서명_비밀(): string | null {
  const sec = process.env.ADMIN_SESSION_SECRET;
  if (sec && sec.length >= 16) return sec;
  const pw = process.env.ADMIN_PASSWORD;
  if (pw && pw.length > 0) return `pw:${pw}`; // 전용 secret 없을 때 비번 파생
  return null; // fail-closed
}

const sha256 = (s: string): Buffer =>
  crypto.createHash("sha256").update(s, "utf8").digest();

/** timingSafeEqual 은 길이 다르면 throw → 고정길이 digest 로 비교(길이 누출·throw 방지). */
function 상수시간_동일(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

const 서명 = (secret: string, msg: string): string =>
  crypto.createHmac("sha256", secret).update(msg).digest("hex");

/** 로그인 성공 시 발급할 세션 토큰(exp.hmac). 비밀 없으면 null. */
export function 세션_토큰_생성(): string | null {
  const secret = 서명_비밀();
  if (!secret) return null;
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${서명(secret, exp)}`;
}

/** 토큰 유효성: 형식·만료·서명. 어떤 예외/미설정도 false(fail-closed). */
function 토큰_유효(token: string): boolean {
  try {
    const secret = 서명_비밀();
    if (!secret) return false;
    const dot = token.indexOf(".");
    if (dot <= 0) return false;
    const exp = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || expNum < Date.now()) return false;
    if (!sig) return false;
    return 상수시간_동일(sig, 서명(secret, exp));
  } catch {
    return false;
  }
}

/** 로그인 시 입력 비번 검증. ADMIN_PASSWORD 미설정이면 항상 false. */
export function 비밀번호_확인(입력: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length === 0) return false;
  if (typeof 입력 !== "string" || 입력.length === 0) return false;
  return 상수시간_동일(입력, pw);
}

/** 서버사이드 인증 상태. 관리자 페이지/라우트 핸들러 본문 최상단에서 호출. */
export async function 관리자_인증됨(): Promise<boolean> {
  try {
    const 쿠키 = (await cookies()).get(관리자_쿠키명)?.value;
    return 쿠키 ? 토큰_유효(쿠키) : false;
  } catch {
    return false;
  }
}
