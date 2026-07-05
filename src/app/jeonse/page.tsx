import { 전세가율_히트맵_유스케이스 } from "../../application/전세가율_히트맵_유스케이스";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 필터바 } from "../../presentation/components/필터바";
import { 전세가율_히트맵 } from "../../presentation/components/전세가율_히트맵";

export const dynamic = "force-dynamic";

const 시도_선택지 = [
  { 값: "11000", 라벨: "서울특별시" },
  { 값: "41000", 라벨: "경기도" },
  { 값: "28000", 라벨: "인천광역시" },
  { 값: "26000", 라벨: "부산광역시" },
];

const 기간_선택지 = [
  { 값: "3", 라벨: "최근 3개월" },
  { 값: "6", 라벨: "최근 6개월" },
  { 값: "12", 라벨: "최근 12개월" },
];

const 기간_계산 = (개월_텍스트: string): { 시작: string; 종료: string } => {
  const 개월 = Number(개월_텍스트) || 6;
  const 종료 = new Date();
  const 시작 = new Date();
  시작.setMonth(시작.getMonth() - 개월);
  return {
    시작: 시작.toISOString().slice(0, 10),
    종료: 종료.toISOString().slice(0, 10),
  };
};

export default async function 전세가율_페이지({
  searchParams,
}: {
  searchParams: Promise<{ sido?: string; months?: string }>;
}) {
  const 파라미터 = await searchParams;
  const 시도_코드 = 파라미터.sido ?? "11000";
  const 기간 = 기간_계산(파라미터.months ?? "6");

  const 유스케이스 = new 전세가율_히트맵_유스케이스();
  const 셀_목록 = await 유스케이스
    .실행({
      시도_코드: 시도_코드,
      물건_유형: "A",
      계약_시작일: 기간.시작,
      계약_종료일: 기간.종료,
    })
    .catch(() => []);

  return (
    <>
      <페이지_제목
        번호="01"
        도장_글자="傳"
        제목="전세가율 히트맵"
        부제="WHEN / 매수 타이밍"
        설명="시군구·평형별로 매매가 대비 전세가 비율을 본다. 짙은 황토색일수록 전세가가 매매가에 근접해 갭이 작다 — 매매 매력이 크고, 동시에 깡통전세 위험도 높다."
      />
      <필터바
        필터들={[
          { 키: "sido", 라벨: "시도", 선택지: 시도_선택지, 기본값: "11000" },
          { 키: "months", 라벨: "기간", 선택지: 기간_선택지, 기본값: "6" },
        ]}
      />
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[18px] font-medium">아파트 매매·전세 비교</h2>
          <span className="eyebrow">
            {기간.시작} ~ {기간.종료}
          </span>
        </div>
        <전세가율_히트맵 셀_목록={셀_목록} />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-[var(--color-ink-2)]">
          <span className="eyebrow">읽는 법</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#C8D6C6]" /> ~55% (매매 부담)
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#EDEAD8]" /> 55–75% (균형)
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#F1DBC1]" /> 85%+ (전환 신호)
          </span>
        </div>
      </section>
    </>
  );
}
