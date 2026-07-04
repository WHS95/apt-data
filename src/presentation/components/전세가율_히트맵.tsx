import type { 전세가율_셀 } from "../../domain/통계/지표";
import { 면적_구간 } from "../../domain/공통/코드";
import { 비율_표시, 만원_표시 } from "./숫자_표시";

interface 속성 {
  셀_목록: 전세가율_셀[];
}

const 면적_헤더 = ["1", "2", "3", "4", "5"] as const;

const 셀_배경 = (비율: number | null): string => {
  if (비율 == null) return "bg-transparent";
  if (비율 >= 85) return "bg-[#F1DBC1]";
  if (비율 >= 75) return "bg-[#F1E5CC]";
  if (비율 >= 65) return "bg-[#EDEAD8]";
  if (비율 >= 55) return "bg-[#DDE6D6]";
  return "bg-[#C8D6C6]";
};

export const 전세가율_히트맵 = ({ 셀_목록 }: 속성) => {
  const 시군구_맵 = new Map<string, { 시군구명: string; 셀들: Map<string, 전세가율_셀> }>();
  for (const 셀 of 셀_목록) {
    if (!시군구_맵.has(셀.시군구_코드)) {
      시군구_맵.set(셀.시군구_코드, { 시군구명: 셀.시군구명, 셀들: new Map() });
    }
    시군구_맵.get(셀.시군구_코드)!.셀들.set(셀.면적_구간, 셀);
  }

  const 시군구_정렬 = Array.from(시군구_맵.entries()).sort((a, b) =>
    a[1].시군구명.localeCompare(b[1].시군구명, "ko"),
  );

  if (시군구_정렬.length === 0) {
    return (
      <div className="border hairline p-12 text-center text-[var(--color-ink-3)] text-[14px]">
        조건에 맞는 거래가 없습니다. 시도·기간 필터를 조정해보세요.
      </div>
    );
  }

  return (
    <div className="border hairline overflow-x-auto bg-[var(--color-surface)]">
      <table className="w-full border-collapse min-w-[720px]">
        <thead>
          <tr className="border-b hairline-strong">
            <th className="text-left p-4 eyebrow w-[160px]">시군구</th>
            {면적_헤더.map((코드) => (
              <th key={코드} className="p-3 eyebrow text-center">
                {면적_구간[코드].라벨}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {시군구_정렬.map(([코드, { 시군구명, 셀들 }]) => (
            <tr key={코드}>
              <th className="text-left p-4 font-medium text-[14px] border-r hairline">
                {시군구명}
              </th>
              {면적_헤더.map((면적_코드) => {
                const 셀 = 셀들.get(면적_코드);
                return (
                  <td
                    key={면적_코드}
                    className={`heat-cell ${셀_배경(셀?.전세가율 ?? null)}`}
                  >
                    {셀 ? (
                      <div className="flex flex-col gap-1">
                        <비율_표시 값={셀.전세가율} />
                        <span className="text-[10px] text-[var(--color-ink-3)]">
                          매매 <만원_표시 만원={셀.매매_평균_만원} />
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--color-ink-3)]">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
