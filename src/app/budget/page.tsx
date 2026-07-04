import { 예산별_매물분포_유스케이스 } from "../../application/예산별_매물분포_유스케이스";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 필터바 } from "../../presentation/components/필터바";
import { 막대_분포 } from "../../presentation/components/막대_분포";

export const dynamic = "force-dynamic";

const 예산_선택지 = [
  { 값: "30000", 라벨: "3억" },
  { 값: "40000", 라벨: "4억" },
  { 값: "50000", 라벨: "5억" },
  { 값: "60000", 라벨: "6억" },
  { 값: "80000", 라벨: "8억" },
  { 값: "120000", 라벨: "12억" },
];

const 물건_선택지 = [
  { 값: "A", 라벨: "아파트" },
  { 값: "B", 라벨: "연립·다세대" },
  { 값: "D", 라벨: "오피스텔" },
];

const 기간_선택지 = [
  { 값: "3", 라벨: "최근 3개월" },
  { 값: "6", 라벨: "최근 6개월" },
  { 값: "12", 라벨: "최근 12개월" },
];

const 기간_계산 = (개월_텍스트: string) => {
  const 개월 = Number(개월_텍스트) || 6;
  const 종료 = new Date();
  const 시작 = new Date();
  시작.setMonth(시작.getMonth() - 개월);
  return {
    시작: 시작.toISOString().slice(0, 10),
    종료: 종료.toISOString().slice(0, 10),
  };
};

export default async function 예산매물_페이지({
  searchParams,
}: {
  searchParams: Promise<{ 예산?: string; 물건?: string; 기간?: string }>;
}) {
  const p = await searchParams;
  const 예산_만원 = Number(p.예산 ?? "60000");
  const 물건 = (p.물건 ?? "A") as "A" | "B" | "D";
  const 기간 = 기간_계산(p.기간 ?? "6");

  const 유스케이스 = new 예산별_매물분포_유스케이스();
  const 버킷_목록 = await 유스케이스
    .실행({
      예산_만원,
      허용_초과율: 0.05,
      물건_유형: 물건,
      계약_시작일: 기간.시작,
      계약_종료일: 기간.종료,
    })
    .catch(() => []);

  return (
    <>
      <페이지_제목
        번호="02"
        도장_글자="豫"
        제목="예산별 매물 분포"
        부제="WHERE / 갈 수 있는 곳"
        설명="가용 예산을 입력하면 그 가격대로 실제 거래된 매물이 어느 시도에 얼마나 있었는지 보여준다. 막대가 짧다면 그 지역은 그 예산으로는 사실상 들어가기 어렵다는 뜻."
      />
      <필터바
        필터들={[
          { 키: "예산", 라벨: "예산", 선택지: 예산_선택지, 기본값: "60000" },
          { 키: "물건", 라벨: "물건", 선택지: 물건_선택지, 기본값: "A" },
          { 키: "기간", 라벨: "기간", 선택지: 기간_선택지, 기본값: "6" },
        ]}
      />
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[18px] font-medium">
            {(예산_만원 / 10000).toLocaleString("ko-KR")}억 이내 매매 거래량
          </h2>
          <span className="eyebrow">
            {기간.시작} ~ {기간.종료}
          </span>
        </div>
        <막대_분포 버킷_목록={버킷_목록} />
        <p className="mt-6 text-[12px] text-[var(--color-ink-2)] max-w-[60ch] leading-relaxed">
          예산은 5% 초과까지 허용해 집계합니다. 막대가 길수록 그 가격대로 실제 살 만한 매물이 많다는
          뜻이지만, 거래량 자체가 적은 비수기·비주류 지역은 과소평가될 수 있습니다.
        </p>
      </section>
    </>
  );
}
