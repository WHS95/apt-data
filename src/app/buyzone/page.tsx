import { 수도권_매수추천_유스케이스 } from "../../application/수도권_매수추천_유스케이스";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 필터바 } from "../../presentation/components/필터바";
import { 매수추천_보드 } from "../../presentation/components/매수추천_보드";
import type { 면적_구간_코드 } from "../../domain/공통/코드";

export const dynamic = "force-dynamic";

const 면적_선택지 = [
  { 값: "전체", 라벨: "전체 평형" },
  { 값: "1", 라벨: "60㎡ 이하" },
  { 값: "2", 라벨: "60–85㎡" },
  { 값: "3", 라벨: "85–102㎡" },
  { 값: "4", 라벨: "102–135㎡" },
];

const 예산_선택지 = [
  { 값: "0", 라벨: "예산 무제한" },
  { 값: "50000", 라벨: "5억 이하" },
  { 값: "70000", 라벨: "7억 이하" },
  { 값: "90000", 라벨: "9억 이하" },
  { 값: "120000", 라벨: "12억 이하" },
];

const 권역_선택지 = [
  { 값: "수도권", 라벨: "수도권 (서울·경기·인천)" },
  { 값: "서울", 라벨: "서울만" },
  { 값: "경기", 라벨: "경기만" },
  { 값: "인천", 라벨: "인천만" },
];

const 권역_코드 = (v: string): string[] => {
  switch (v) {
    case "서울":
      return ["11000"];
    case "경기":
      return ["41000"];
    case "인천":
      return ["28000"];
    default:
      return ["11000", "41000", "28000"];
  }
};

export default async function 매수추천_페이지({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; area?: string; price?: string }>;
}) {
  const p = await searchParams;
  const 권역 = p.region ?? "수도권";
  const 면적 = (p.area ?? "전체") as 면적_구간_코드 | "전체";
  const 예산_만원 = Number(p.price ?? "0");

  const 유스 = new 수도권_매수추천_유스케이스();
  const 행들 = await 유스
    .실행({
      시도_코드_목록: 권역_코드(권역),
      면적_구간: 면적,
      예산_상한_만원: 예산_만원 > 0 ? 예산_만원 : undefined,
    })
    .catch(() => []);

  const 상위 = 행들.slice(0, 3);
  const 평균_점수 =
    행들.length > 0
      ? Math.round(행들.reduce((a, b) => a + b.종합_점수, 0) / 행들.length)
      : 0;

  return (
    <>
      <페이지_제목
        번호="00"
        도장_글자="買"
        제목="수도권 매수 추천"
        부제="WHERE TO BUY / 결국 어디"
        설명="서울·경기·인천 시군구를 한 줄씩 정렬해 '결국 어디가 살 만한가'를 한눈에 본다. 가격·모멘텀·전세가율·거래량을 합쳐 종합 점수로 환산. 점수 75↑(짙은 녹)은 매수 매력이 큰 권역."
      />
      <필터바
        필터들={[
          { 키: "region", 라벨: "권역", 선택지: 권역_선택지, 기본값: "수도권" },
          { 키: "area", 라벨: "평형", 선택지: 면적_선택지, 기본값: "전체" },
          { 키: "price", 라벨: "예산", 선택지: 예산_선택지, 기본값: "0" },
        ]}
      />
      {/* 상단 요약 카드 */}
      <section className="border-b hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-0 divide-x divide-[var(--color-line)]">
          <div className="px-6 first:pl-0">
            <div className="eyebrow mb-2">분석 시군구</div>
            <div className="text-[36px] font-bold tracking-tight num">
              {행들.length}
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)]">개</div>
          </div>
          <div className="px-6">
            <div className="eyebrow mb-2">평균 점수</div>
            <div className="text-[36px] font-bold tracking-tight num">
              {평균_점수}
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)]">/ 100</div>
          </div>
          <div className="px-6">
            <div className="eyebrow mb-2">TOP 3</div>
            <div className="space-y-1 text-[14px]">
              {상위.map((s, i) => (
                <div key={s.시군구_코드} className="flex items-baseline gap-2">
                  <span className="num text-[10px] text-[var(--color-ink-3)] w-3">
                    {i + 1}
                  </span>
                  <span className="font-medium">{s.시군구명}</span>
                  <span className="text-[var(--color-ink-3)] text-[11px] num ml-auto">
                    {s.종합_점수}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6">
            <div className="eyebrow mb-2">데이터 범위</div>
            <div className="text-[14px] num">최근 12개월</div>
            <div className="text-[11px] text-[var(--color-ink-3)] mt-1">
              매매·전세, 해제 제외
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight">
            시군구별 한 줄 비교
          </h2>
          <span className="eyebrow">정렬 · 종합 점수</span>
        </div>
        <매수추천_보드 행들={행들} />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-[12px] text-[var(--color-ink-2)] leading-relaxed">
          <div>
            <div className="eyebrow mb-2">점수 산식</div>
            가격 접근성 30% + 가격 모멘텀 30% + 전세가율 안정성 25% + 거래량 유동성 15%
          </div>
          <div>
            <div className="eyebrow mb-2">변화율 색</div>
            <span className="text-[var(--color-maemae)]">+</span>은 상승,
            <span className="text-[var(--color-jeonse)]"> −</span>은 하락. 너무 큰 상승은 과열 신호.
          </div>
          <div>
            <div className="eyebrow mb-2">전세가율</div>
            65–75%가 안정 구간. 80%↑은 갭투자 위험, 60%↓는 매매 부담.
          </div>
          <div>
            <div className="eyebrow mb-2">거래량 모멘텀</div>
            ×1.2 이상은 활발, ×0.8 미만은 침체. 모멘텀과 가격 변화가 함께 움직이는 곳을 주목.
          </div>
        </div>
      </section>
    </>
  );
}
