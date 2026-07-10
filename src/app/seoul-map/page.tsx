import { 서울_지도_유스케이스 } from "../../application/서울_지도_유스케이스";
import { 서울_지도 } from "../../presentation/components/서울_지도";
import { 실거래_캐시 } from "../../infrastructure/캐시";

export const dynamic = "force-dynamic";

const 캐시_지도 = 실거래_캐시(
  "seoul-map",
  (옵션: { 기간_개월?: number }) => new 서울_지도_유스케이스().실행(옵션),
);

export default async function 서울지도_페이지({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; metric?: string }>;
}) {
  const p = await searchParams;
  const 기간_개월 = Number(p.months ?? "6");
  const 지표_기본 =
    p.metric === "전세가율" || p.metric === "변화율" || p.metric === "거래량"
      ? p.metric
      : "매매가";

  const 지표들 = await 캐시_지도({ 기간_개월 }).catch(() => []);

  const 시작 = new Date();
  시작.setMonth(시작.getMonth() - 기간_개월);
  const 종료 = new Date();

  const 매핑된 = 지표들.filter((r) => r.매매_평당_만원 != null).length;

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            MAP · 서울 아파트 · 자치구 히트맵 · {기간_개월}개월
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
              서울 아파트 지도
            </h1>
            <div className="text-[12px] text-[var(--color-ink-3)] font-medium num">
              {시작.toISOString().slice(0, 10)} ~ {종료.toISOString().slice(0, 10)}
              <span className="mx-2">·</span>
              {매핑된} / 25 자치구 매핑
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-4">
        <서울_지도
          지표들={지표들}
          기본_지표={지표_기본 as never}
        />
      </section>
    </>
  );
}
