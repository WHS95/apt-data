import Link from "next/link";

interface 일자_거래 {
  일자: string;
  단지_목록: Array<{
    단지명: string;
    시군구명: string;
    거래_건수: number;
    평균_금액_만원: number | null;
  }>;
  총_건수: number;
  평균_금액_만원: number | null;
}

interface 속성 {
  년: number;
  월: number;
  일자별: Map<string, 일자_거래>;
  선택_일자?: string;
  경로_생성: (월?: string, 일?: string) => string;
}

const 요일_라벨 = ["일", "월", "화", "수", "목", "금", "토"];

export const 달력_그리드 = ({
  년,
  월,
  일자별,
  선택_일자,
  경로_생성,
}: 속성) => {
  const 첫날 = new Date(년, 월 - 1, 1);
  const 마지막날 = new Date(년, 월, 0);
  const 시작_요일 = 첫날.getDay();
  const 일수 = 마지막날.getDate();

  const 칸들: Array<{ 일: number; 키: string } | null> = [];
  for (let i = 0; i < 시작_요일; i++) 칸들.push(null);
  for (let d = 1; d <= 일수; d++) {
    const 키 = `${년}-${String(월).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    칸들.push({ 일: d, 키 });
  }
  while (칸들.length % 7 !== 0) 칸들.push(null);

  const 오늘 = new Date();
  const 오늘_여부_체크 =
    오늘.getFullYear() === 년 && 오늘.getMonth() + 1 === 월;

  const 최대_거래 = Math.max(
    1,
    ...Array.from(일자별.values()).map((v) => v.총_건수),
  );

  return (
    <div className="toss-card overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b hairline bg-[var(--color-bg-soft)]">
        {요일_라벨.map((r, i) => (
          <div
            key={r}
            className={`text-center py-3 text-[12px] font-extrabold ${
              i === 0
                ? "text-[var(--color-up)]"
                : i === 6
                  ? "text-[var(--color-down)]"
                  : "text-[var(--color-ink-3)]"
            }`}
          >
            {r}
          </div>
        ))}
      </div>

      {/* 일자 칸 */}
      <div className="grid grid-cols-7">
        {칸들.map((칸, i) => {
          if (!칸) {
            return (
              <div
                key={`empty-${i}`}
                className="h-[120px] border-r border-b hairline last-of-type:border-r-0 bg-[var(--color-bg-soft)]/30"
              />
            );
          }
          const 거래 = 일자별.get(칸.키);
          const 요일 = i % 7;
          const 오늘_여부 = 오늘_여부_체크 && 칸.일 === 오늘.getDate();
          const 선택_여부 = 선택_일자 === 칸.키;
          const 거래있음 = !!거래;
          const 강도 = 거래있음 ? Math.min(1, 거래.총_건수 / 최대_거래) : 0;

          return (
            <Link
              key={칸.키}
              href={경로_생성(undefined, 칸.키)}
              scroll={false}
              className={`h-[120px] p-2 border-r border-b hairline last-of-type:border-r-0 relative flex flex-col text-left transition-colors ${
                선택_여부
                  ? "bg-[var(--color-brand-soft)] ring-2 ring-[var(--color-brand)] ring-inset z-10"
                  : 거래있음
                    ? "hover:bg-[var(--color-up-soft)]/40"
                    : "hover:bg-[var(--color-bg-soft)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[13px] font-extrabold num ${
                    오늘_여부
                      ? "bg-[var(--color-brand)] text-white w-6 h-6 flex items-center justify-center rounded-full"
                      : 요일 === 0
                        ? "text-[var(--color-up)]"
                        : 요일 === 6
                          ? "text-[var(--color-down)]"
                          : "text-[var(--color-ink)]"
                  }`}
                >
                  {칸.일}
                </span>
                {거래있음 && (
                  <span className="text-[11px] font-extrabold num text-[var(--color-up)] bg-[var(--color-up-soft)] px-1.5 py-0.5 rounded">
                    {거래.총_건수}
                  </span>
                )}
              </div>
              {거래있음 && (
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {거래.단지_목록.slice(0, 3).map((d, di) => (
                    <div
                      key={di}
                      className="text-[10px] font-bold text-[var(--color-ink-2)] truncate leading-tight"
                      title={`${d.단지명} (${d.시군구명}) · ${d.거래_건수}건`}
                    >
                      {d.단지명}
                    </div>
                  ))}
                  {거래.단지_목록.length > 3 && (
                    <div className="text-[10px] text-[var(--color-ink-3)] font-bold">
                      +{거래.단지_목록.length - 3}건
                    </div>
                  )}
                </div>
              )}
              {거래있음 && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-[var(--color-up)]"
                  style={{ width: `${강도 * 100}%` }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
