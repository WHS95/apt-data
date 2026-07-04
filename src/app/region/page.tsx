import { 권역_비교_유스케이스 } from "../../application/권역_비교_유스케이스";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 만원_표시, 비율_표시 } from "../../presentation/components/숫자_표시";

export const dynamic = "force-dynamic";

const 기본_시군구 = [
  "11680", // 강남구
  "11710", // 송파구
  "11440", // 마포구
  "11200", // 성동구
  "41131", // 수원시 영통구
  "41280", // 고양시 일산서구
  "28245", // 인천 연수구
];

export default async function 권역비교_페이지() {
  const 종료 = new Date();
  const 시작 = new Date();
  시작.setMonth(시작.getMonth() - 6);

  const 유스케이스 = new 권역_비교_유스케이스();
  const 결과 = await 유스케이스
    .실행({
      시군구_코드_목록: 기본_시군구,
      면적_최소: 60,
      면적_최대: 102,
      계약_시작일: 시작.toISOString().slice(0, 10),
      계약_종료일: 종료.toISOString().slice(0, 10),
    })
    .catch(() => []);

  const 색칠 = (점수: number): string => {
    if (점수 >= 70) return "bg-[#DDE6D6]";
    if (점수 >= 50) return "bg-[#EDEAD8]";
    return "bg-[#F1DBC1]";
  };

  return (
    <>
      <페이지_제목
        번호="04"
        도장_글자="權"
        제목="권역 비교"
        부제="COMPARE / 가성비 순위"
        설명="선택한 시군구를 평균 매매가·전세가율·거래량으로 한 줄에 모아 본다. 가성비 점수는 가격과 전세가율의 균형(70% 부근에서 가장 안정)으로 환산."
      />
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[18px] font-medium">아파트 60–102㎡, 최근 6개월</h2>
          <span className="eyebrow">정렬 · 가성비 점수</span>
        </div>
        {결과.length === 0 ? (
          <div className="border hairline p-12 text-center text-[var(--color-ink-3)]">
            비교할 거래가 없습니다. 시드 데이터를 먼저 적재하세요.
          </div>
        ) : (
          <ul className="border-y hairline divide-y divide-[var(--color-line)]">
            <li className="grid grid-cols-12 gap-4 py-3 px-2 eyebrow">
              <span className="col-span-1">순위</span>
              <span className="col-span-3">시군구</span>
              <span className="col-span-2 text-right">평균 매매가</span>
              <span className="col-span-2 text-right">전세가율</span>
              <span className="col-span-2 text-right">거래량</span>
              <span className="col-span-2 text-right">가성비</span>
            </li>
            {결과.map((r, i) => (
              <li
                key={r.시군구_코드}
                className="grid grid-cols-12 gap-4 py-5 px-2 items-baseline"
              >
                <span className="col-span-1 num text-[14px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="col-span-3 font-medium text-[16px]">{r.시군구명}</span>
                <span className="col-span-2 text-right">
                  <만원_표시 만원={r.평균_매매가_만원} 강조 />
                </span>
                <span className="col-span-2 text-right">
                  <비율_표시 값={r.전세가율} />
                </span>
                <span className="col-span-2 text-right num text-[14px]">
                  {r.거래_건수.toLocaleString("ko-KR")}
                  <span className="text-[var(--color-ink-3)] text-[11px] ml-1">건</span>
                </span>
                <span className="col-span-2 flex items-center justify-end">
                  <span
                    className={`num text-[14px] px-3 py-1 ${색칠(r.가성비_점수)}`}
                  >
                    {r.가성비_점수}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-[12px] text-[var(--color-ink-2)] max-w-[60ch] leading-relaxed">
          가성비 점수는 평균가가 낮을수록·전세가율이 70%에 가까울수록 높게 산출됩니다. 단순 가격
          비교가 아니라 실거주 안정성과 매수 매력의 균형을 함께 반영합니다.
        </p>
      </section>
    </>
  );
}
