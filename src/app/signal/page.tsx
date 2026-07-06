import { 서울_골든크로스_유스케이스 } from "../../application/서울_골든크로스_유스케이스";
import { 상승신호_뷰 } from "../../presentation/components/상승신호_뷰";

export const dynamic = "force-dynamic";

export default async function 상승신호_페이지() {
  const 구들 = await new 서울_골든크로스_유스케이스().실행().catch(() => []);
  const 골든수 = 구들.filter((g) => g.현재_상태 === "골든").length;

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            SIGNAL · 서울 · 골든크로스 · 주간 8/24주 이동평균
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">상승 신호</h1>
            <div className="text-[12px] text-[var(--color-ink-3)] font-medium">
              현재 골든크로스{" "}
              <span className="num font-bold text-[var(--color-up)]">{골든수}</span> / 25 구
            </div>
          </div>
          <p className="text-[13px] text-[var(--color-ink-2)] mt-2 max-w-[720px] leading-relaxed font-medium">
            자치구 아파트 평당가에 단기(8주)·장기(24주) 이동평균선을 그어, 단기선이 장기선을 뚫고
            올라가는 <b>골든크로스</b>로 상승 진입 시점을 포착합니다. 주식차트처럼 구를 골라 흐름을
            보세요.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-4">
        {구들.length === 0 ? (
          <div className="toss-card p-12 text-center text-[var(--color-ink-3)]">
            신호를 계산할 데이터가 없습니다.
          </div>
        ) : (
          <상승신호_뷰 구들={구들} />
        )}
      </section>
    </>
  );
}
