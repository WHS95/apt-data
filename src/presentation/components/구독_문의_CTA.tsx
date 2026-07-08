import { 카카오_채널_URL, 카카오_채널_활성 } from "../../config/수익화";

// "광고 없이 이용하기" 구독 문의 → 카카오톡 채널.
// 채널 URL이 설정되지 않으면(미배포/미개설) 죽은 링크 대신 렌더를 생략합니다.
export const 구독_문의_CTA = ({
  변형 = "버튼",
}: {
  변형?: "버튼" | "링크";
}) => {
  if (!카카오_채널_활성) return null;

  if (변형 === "링크") {
    return (
      <a
        href={카카오_채널_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)] underline underline-offset-2 decoration-[var(--color-line-strong)]"
      >
        광고 없이 이용 · 구독 문의
      </a>
    );
  }

  return (
    <a
      href={카카오_채널_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--color-brand)] text-white text-[13px] font-bold px-3.5 py-2 hover:brightness-95 transition"
    >
      <span aria-hidden>💬</span>
      광고 없이 이용하기
    </a>
  );
};
