import { redirect } from "next/navigation";
import { 관리자_인증됨 } from "../../../infrastructure/관리자_인증";

export const dynamic = "force-dynamic";

export default async function 관리자_로그인_페이지({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await 관리자_인증됨()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-1 text-[22px] font-extrabold tracking-[-0.02em]">
        관리자 로그인
      </h1>
      <p className="mb-6 text-[13px] text-[var(--color-ink-3)]">
        APT DATA 관리자 영역입니다.
      </p>
      <form action="/api/auth/login" method="post" className="flex flex-col gap-3">
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="비밀번호"
          className="w-full rounded-xl border hairline bg-[var(--color-bg)] px-4 py-3 text-[15px] outline-none focus:border-[var(--color-brand)]"
        />
        {error === "1" && (
          <p className="text-[12px] font-medium text-[#e11d48]">
            비밀번호가 올바르지 않습니다.
          </p>
        )}
        {error === "config" && (
          <p className="text-[12px] font-medium text-[#e11d48]">
            서버에 ADMIN_PASSWORD 가 설정되지 않았습니다.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--color-brand)] py-3 text-[15px] font-bold text-white"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
