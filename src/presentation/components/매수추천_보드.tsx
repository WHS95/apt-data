import type { 매수추천_행 } from "../../domain/통계/매수추천";
import { 만원_표시, 비율_표시 } from "./숫자_표시";
import { 스파크라인 } from "./스파크라인";

interface 속성 {
  행들: 매수추천_행[];
}

const 변화_표시 = (값: number | null) => {
  if (값 == null)
    return <span className="num text-[var(--color-ink-3)]">—</span>;
  const 색 =
    값 > 1
      ? "text-[var(--color-maemae)]"
      : 값 < -1
        ? "text-[var(--color-jeonse)]"
        : "text-[var(--color-ink-2)]";
  const 부호 = 값 > 0 ? "+" : "";
  return (
    <span className={`num ${색} font-medium`}>
      {부호}
      {값.toFixed(1)}%
    </span>
  );
};

const 모멘텀_표시 = (값: number | null) => {
  if (값 == null)
    return <span className="num text-[var(--color-ink-3)]">—</span>;
  const 색 =
    값 >= 1.2
      ? "text-[var(--color-maemae)]"
      : 값 < 0.8
        ? "text-[var(--color-jeonse)]"
        : "text-[var(--color-ink-2)]";
  return <span className={`num ${색}`}>×{값.toFixed(2)}</span>;
};

const 점수_배지 = (점수: number) => {
  const 색 =
    점수 >= 75
      ? "bg-[#DDE6D6] text-[var(--color-jeonse)]"
      : 점수 >= 55
        ? "bg-[#EDEAD8] text-[var(--color-ink)]"
        : "bg-[#F1DBC1] text-[var(--color-warn)]";
  return (
    <span className={`num text-[14px] font-bold px-2.5 py-1 ${색}`}>
      {점수}
    </span>
  );
};

export const 매수추천_보드 = ({ 행들 }: 속성) => {
  if (행들.length === 0) {
    return (
      <div className="border hairline p-12 text-center text-[var(--color-ink-3)]">
        조건에 맞는 시군구가 없습니다. 면적·예산 필터를 조정해보세요.
      </div>
    );
  }
  return (
    <div className="border hairline overflow-x-auto bg-[var(--color-surface)]">
      <table className="w-full min-w-[1080px] text-[13px]">
        <thead>
          <tr className="border-b hairline-strong eyebrow">
            <th className="text-left py-3 px-3 w-10">#</th>
            <th className="text-left py-3 px-3">시군구</th>
            <th className="text-right py-3 px-3">평균 매매</th>
            <th className="text-right py-3 px-3">3개월</th>
            <th className="text-right py-3 px-3">6개월</th>
            <th className="text-right py-3 px-3">전세가율</th>
            <th className="text-right py-3 px-3">거래량</th>
            <th className="text-center py-3 px-3">12개월 추이</th>
            <th className="text-right py-3 px-3">점수</th>
          </tr>
        </thead>
        <tbody>
          {행들.map((r, i) => {
            const 시도_라벨 =
              r.시도_코드 === "11000"
                ? "서울"
                : r.시도_코드 === "41000"
                  ? "경기"
                  : r.시도_코드 === "28000"
                    ? "인천"
                    : r.시도명;
            return (
              <tr
                key={r.시군구_코드}
                className="border-b hairline hover:bg-[var(--color-paper-deep)] transition-colors"
              >
                <td className="py-4 px-3 num text-[var(--color-ink-3)] text-[11px] align-middle">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-4 px-3 align-middle">
                  <div className="font-medium text-[15px]">{r.시군구명}</div>
                  <div className="text-[10px] text-[var(--color-ink-3)] eyebrow mt-0.5">
                    {시도_라벨}
                  </div>
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  <만원_표시 만원={r.평균_매매가_만원} 강조 />
                  <div className="text-[10px] text-[var(--color-ink-3)] mt-0.5 num">
                    {r.거래_최근_3개월}건
                  </div>
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  {변화_표시(r.변화_3개월_퍼센트)}
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  {변화_표시(r.변화_6개월_퍼센트)}
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  <비율_표시 값={r.전세가율_퍼센트} />
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  {모멘텀_표시(r.거래량_모멘텀)}
                </td>
                <td className="py-4 px-3 text-center align-middle">
                  <div className="inline-block">
                    <스파크라인
                      값들={r.월별_평균가.map((m) => m.평균_만원)}
                    />
                  </div>
                </td>
                <td className="py-4 px-3 text-right align-middle">
                  {점수_배지(r.종합_점수)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
