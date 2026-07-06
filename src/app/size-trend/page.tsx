import { 평형별_상승률_유스케이스 } from "../../application/평형별_상승률_유스케이스";
import { 평형_상승률_뷰 } from "../../presentation/components/평형_상승률_뷰";

export const dynamic = "force-dynamic";

const 권역_시도 = (v: string): string[] =>
  v === "서울"
    ? ["11000"]
    : v === "경기"
      ? ["41000"]
      : v === "인천"
        ? ["28000"]
        : ["11000", "41000", "28000"];

export default async function 평형상승률_페이지({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const p = await searchParams;
  const 권역 = p.region ?? "서울";
  const 밴드들 = await new 평형별_상승률_유스케이스()
    .실행({ 시도_코드_목록: 권역_시도(권역), 기간_개월: 36 })
    .catch(() => []);

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            SIZE · 아파트 · 평형대별 매매 상승률 · 최근 36개월
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">평형대별 상승률</h1>
          </div>
          <p className="text-[13px] text-[var(--color-ink-2)] mt-2 max-w-[720px] leading-relaxed font-medium">
            같은 지역이라도 <b>20평대·30평대·40평대</b>가 다르게 움직입니다. 평형대별 평당가 지수로
            어느 평형이 상승을 주도하는지 봅니다. (자치구 고정가중으로 구 구성 편향 제거)
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-4">
        <평형_상승률_뷰 밴드들={밴드들} 권역={권역} />
      </section>
    </>
  );
}
