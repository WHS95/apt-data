import Link from "next/link";
import type { 단지_추천_행 } from "../../domain/통계/단지추천";
import { 만원_표시 } from "./숫자_표시";
import { 미니_레이더 } from "./미니_레이더";
import { 스파크라인 } from "./스파크라인";

interface 속성 {
  단지: 단지_추천_행;
  순위: number;
}

const 점수_색 = (점수: number): string => {
  if (점수 >= 75) return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
  if (점수 >= 55) return "bg-[var(--color-bg-mute)] text-[var(--color-ink)]";
  return "bg-[var(--color-warn-soft)] text-[var(--color-warn)]";
};

const 시도_색 = (코드: string): string => {
  switch (코드) {
    case "11000": return "bg-[var(--color-up-soft)] text-[var(--color-up)]";
    case "41000": return "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";
    case "28000": return "bg-[var(--color-down-soft)] text-[var(--color-down)]";
    default: return "bg-[var(--color-bg-mute)] text-[var(--color-ink-2)]";
  }
};

const 시도_약칭 = (코드: string): string => {
  switch (코드) {
    case "11000": return "서울";
    case "41000": return "경기";
    case "28000": return "인천";
    case "26000": return "부산";
    default: return 코드;
  }
};

const 평형_라벨 = (제곱미터: number): string => {
  const 평 = Math.round(제곱미터 / 3.305785);
  return `${Math.round(제곱미터)}㎡·${평}평`;
};

export const 단지_추천_카드 = ({ 단지, 순위 }: 속성) => {
  const 상세_경로 = `/picks/detail?sgg=${단지.시군구_코드}&name=${encodeURIComponent(단지.단지명)}`;

  return (
    <Link href={상세_경로} className="block toss-card overflow-hidden">
      {/* 헤더 - 콤팩트 */}
      <header className="px-4 pt-3 pb-3 flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${시도_색(단지.시도_코드)}`}
        >
          {시도_약칭(단지.시도_코드)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-extrabold leading-tight tracking-tight truncate flex items-baseline gap-1.5">
            <span className="num text-[11px] text-[var(--color-ink-4)] font-bold">
              {String(순위).padStart(2, "0")}
            </span>
            <span>{단지.단지명}</span>
          </h3>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-0.5 font-medium truncate">
            {단지.시군구명} · {평형_라벨(단지.평균_면적_제곱미터)}
            {단지.건축_연도 && ` · ${단지.건축_연도}년`}
          </div>
        </div>
        <div className={`text-[14px] font-extrabold px-2 py-0.5 rounded-md ${점수_색(단지.종합_점수)}`}>
          {단지.종합_점수}
        </div>
      </header>

      {/* 본문 - 콤팩트 가격 + 미니 레이더 + 스파크라인 */}
      <div className="px-4 pb-3 grid grid-cols-5 gap-3 items-center">
        <div className="col-span-3">
          <div className="leading-tight">
            <만원_표시 만원={단지.현재_평균가_만원} 강조 />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {단지.가성비_퍼센트 != null && 단지.가성비_퍼센트 > 0.5 && (
              <span className="text-[10px] font-bold text-[var(--color-down)] num">
                구평균 −{Math.abs(단지.가성비_퍼센트).toFixed(0)}%
              </span>
            )}
            {단지.가성비_퍼센트 != null && 단지.가성비_퍼센트 < -0.5 && (
              <span className="text-[10px] font-bold text-[var(--color-up)] num">
                구평균 +{Math.abs(단지.가성비_퍼센트).toFixed(0)}%
              </span>
            )}
            {단지.변화_6개월_퍼센트 != null && Math.abs(단지.변화_6개월_퍼센트) >= 0.5 && (
              <span
                className={`text-[10px] font-bold num ${단지.변화_6개월_퍼센트 > 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}
              >
                {단지.변화_6개월_퍼센트 > 0 ? "▲" : "▼"}
                {Math.abs(단지.변화_6개월_퍼센트).toFixed(1)}%
              </span>
            )}
            <span className="text-[10px] text-[var(--color-ink-3)] num font-medium">
              {단지.거래_건수}건
            </span>
          </div>
          <div className="mt-1.5 -ml-1">
            <스파크라인
              값들={단지.월별_평균가.map((m) => m.평균_만원)}
              너비={150}
              높이={24}
              색={
                (단지.변화_6개월_퍼센트 ?? 0) >= 0
                  ? "var(--color-up)"
                  : "var(--color-down)"
              }
            />
          </div>
        </div>
        <div className="col-span-2 flex justify-center">
          <미니_레이더
            점수들={[
              단지.점수_가성비,
              단지.점수_모멘텀,
              단지.점수_유동성,
              단지.점수_안정성,
              단지.점수_신축도,
            ]}
            라벨들={["가성", "모멘", "거래", "안정", "신축"]}
            크기={108}
            색="var(--color-brand)"
          />
        </div>
      </div>

      {/* 강점만 짧게 */}
      {단지.강점들.length > 0 && (
        <div className="px-4 py-2.5 border-t hairline bg-[var(--color-bg-soft)]">
          <ul className="space-y-0.5">
            {단지.강점들.slice(0, 2).map((s, i) => (
              <li key={i} className="text-[11px] font-medium text-[var(--color-ink-2)] flex items-start gap-1">
                <span className="text-[var(--color-up)]">✓</span>
                <span className="truncate">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Link>
  );
};
