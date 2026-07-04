import type { 예산별_분포_버킷 } from "../../domain/통계/지표";

interface 속성 {
  버킷_목록: 예산별_분포_버킷[];
}

export const 막대_분포 = ({ 버킷_목록 }: 속성) => {
  if (버킷_목록.length === 0) {
    return (
      <div className="border hairline p-12 text-center text-[var(--color-ink-3)] text-[14px]">
        예산 한도에 맞는 매물이 없습니다. 예산을 늘리거나 물건 유형을 변경해보세요.
      </div>
    );
  }
  const 최대 = Math.max(...버킷_목록.map((b) => b.매물_건수));
  return (
    <ul className="border-y hairline divide-y divide-[var(--color-line)]">
      {버킷_목록.map((b, i) => (
        <li key={b.시도_코드} className="grid grid-cols-12 gap-4 items-center py-4 px-2">
          <span className="num text-[11px] text-[var(--color-ink-3)] col-span-1">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="col-span-2 font-medium text-[14px]">{b.시도명}</span>
          <div className="col-span-7 relative h-5 bg-[var(--color-paper-deep)]">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
              style={{ width: `${(b.매물_건수 / 최대) * 100}%` }}
            />
          </div>
          <span className="col-span-2 text-right num text-[14px]">
            {b.매물_건수.toLocaleString("ko-KR")}
            <span className="text-[var(--color-ink-3)] text-[11px] ml-1">건</span>
          </span>
        </li>
      ))}
    </ul>
  );
};
