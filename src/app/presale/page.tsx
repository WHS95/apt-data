import Link from "next/link";
import { 분양_캘린더_유스케이스 } from "../../application/분양_캘린더_유스케이스";
import { 필터바 } from "../../presentation/components/필터바";
import { 달력_그리드 } from "../../presentation/components/달력_그리드";
import { 만원_표시 } from "../../presentation/components/숫자_표시";

export const dynamic = "force-dynamic";

const 시도_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "11000", 라벨: "서울" },
  { 값: "41000", 라벨: "경기" },
  { 값: "28000", 라벨: "인천" },
];

type 일자거래 = {
  일자: string;
  단지_목록: Array<{
    단지명: string;
    시군구명: string;
    거래_건수: number;
    평균_금액_만원: number | null;
  }>;
  총_건수: number;
  평균_금액_만원: number | null;
};

const 월_파싱 = (월키: string | undefined): { 년: number; 월: number } => {
  if (월키 && /^\d{4}-\d{2}$/.test(월키)) {
    const [y, m] = 월키.split("-").map(Number);
    return { 년: y, 월: m };
  }
  const d = new Date();
  return { 년: d.getFullYear(), 월: d.getMonth() + 1 };
};

const 월_이동 = (년: number, 월: number, 변화: number): string => {
  const d = new Date(년, 월 - 1 + 변화, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default async function 분양캘린더_페이지({
  searchParams,
}: {
  searchParams: Promise<{ 시도?: string; 월?: string; 일?: string }>;
}) {
  const p = await searchParams;
  const 시도 = p.시도 ?? "전체";
  const { 년, 월 } = 월_파싱(p.월);

  const 시작_d = new Date(년, 월 - 1, 1);
  const 종료_d = new Date(년, 월, 0);

  const 항목들 = await new 분양_캘린더_유스케이스()
    .실행({
      계약_시작일: 시작_d.toISOString().slice(0, 10),
      계약_종료일: 종료_d.toISOString().slice(0, 10),
      시도_코드: 시도 === "전체" ? undefined : 시도,
    })
    .catch(() => []);

  const 일자별: Map<string, 일자거래> = new Map();
  for (const it of 항목들) {
    const 기존 = 일자별.get(it.계약일) ?? {
      일자: it.계약일,
      단지_목록: [],
      총_건수: 0,
      평균_금액_만원: null as number | null,
    };
    기존.단지_목록.push({
      단지명: it.단지명 ?? "단지명 미공개",
      시군구명: it.시군구명,
      거래_건수: it.거래_건수,
      평균_금액_만원: it.평균_금액_만원,
    });
    기존.총_건수 += it.거래_건수;
    일자별.set(it.계약일, 기존);
  }
  for (const 거래 of 일자별.values()) {
    const 가격들 = 거래.단지_목록
      .map((d) => d.평균_금액_만원)
      .filter((v): v is number => v != null);
    if (가격들.length > 0) {
      거래.평균_금액_만원 = Math.round(
        가격들.reduce((a, b) => a + b, 0) / 가격들.length,
      );
    }
  }

  const 월_총_거래 = Array.from(일자별.values()).reduce(
    (a, b) => a + b.총_건수,
    0,
  );
  const 거래일수 = 일자별.size;
  const 단지수 = new Set(항목들.map((i) => i.단지명)).size;

  const 이전월 = 월_이동(년, 월, -1);
  const 다음월 = 월_이동(년, 월, 1);
  const 오늘월 = 월_이동(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  );

  const 경로_생성 = (월_파라미터?: string, 일_파라미터?: string) => {
    const sp = new URLSearchParams();
    if (시도 !== "전체") sp.set("시도", 시도);
    sp.set("월", 월_파라미터 ?? `${년}-${String(월).padStart(2, "0")}`);
    if (일_파라미터) sp.set("일", 일_파라미터);
    else if (p.일) sp.set("일", p.일);
    return `?${sp.toString()}`;
  };

  const 선택_일자 = p.일 ?? null;
  const 선택_거래 = 선택_일자 ? 일자별.get(선택_일자) : null;

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1">
            EVENTS · 분양·입주권
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
              분양 캘린더
            </h1>
          </div>
        </div>
      </section>

      <필터바
        필터들={[
          { 키: "시도", 라벨: "권역", 선택지: 시도_선택지, 기본값: "전체" },
        ]}
      />

      {/* 월 네비게이션 */}
      <section className="mx-auto max-w-[1400px] px-6 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={경로_생성(이전월)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-bg-mute)] hover:bg-[var(--color-bg-deep)] text-[var(--color-ink)] text-[18px] font-bold transition-colors"
            >
              ‹
            </Link>
            <div>
              <div className="text-[12px] font-bold text-[var(--color-ink-3)] num">
                {년}년
              </div>
              <h2 className="text-[32px] font-extrabold tracking-[-0.02em] leading-none">
                {월}월
              </h2>
            </div>
            <Link
              href={경로_생성(다음월)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-bg-mute)] hover:bg-[var(--color-bg-deep)] text-[var(--color-ink)] text-[18px] font-bold transition-colors"
            >
              ›
            </Link>
            <Link
              href={경로_생성(오늘월)}
              className="pill ml-2"
            >
              이번 달
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="label">총 거래</div>
              <div className="text-[18px] font-extrabold num text-[var(--color-up)]">
                {월_총_거래.toLocaleString("ko-KR")}
                <span className="text-[11px] text-[var(--color-ink-3)] font-bold ml-1">건</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label">거래일</div>
              <div className="text-[18px] font-extrabold num">
                {거래일수}
                <span className="text-[11px] text-[var(--color-ink-3)] font-bold ml-1">일</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label">고유 단지</div>
              <div className="text-[18px] font-extrabold num">
                {단지수}
                <span className="text-[11px] text-[var(--color-ink-3)] font-bold ml-1">단지</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {월_총_거래 === 0 && (
        <section className="mx-auto max-w-[1400px] px-6">
          <div className="toss-card p-5 bg-[var(--color-warn-soft)] border-[var(--color-warn)]/30 flex items-start gap-3">
            <span className="text-[var(--color-warn)] text-[18px] font-extrabold">ⓘ</span>
            <div className="flex-1 text-[13px] text-[var(--color-ink)] leading-relaxed">
              <div className="font-extrabold mb-1">
                {년}년 {월}월 분양·입주권 거래가 아직 없습니다
              </div>
              <div className="text-[var(--color-ink-2)] font-medium">
                국토교통부 실거래가는 <b>계약 후 최대 30일 이내 신고</b>되어, 현재 월 초에는 데이터가 비어 있는 것이 정상입니다.
                신고 유예가 지나면 자동으로 채워집니다.
              </div>
              <div className="mt-2">
                <Link
                  href={경로_생성(이전월)}
                  className="text-[var(--color-brand)] font-bold hover:underline"
                >
                  ← 데이터가 있는 전월({이전월.split("-")[1]}월) 보기
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 캘린더 + 사이드 상세 */}
      <section className="mx-auto max-w-[1400px] px-6 pb-12 pt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <달력_그리드
          년={년}
          월={월}
          일자별={일자별}
          선택_일자={선택_일자 ?? undefined}
          경로_생성={경로_생성}
        />

        {/* 우측 상세 패널 */}
        <aside className="toss-card p-5 h-fit lg:sticky lg:top-[80px]">
          {선택_거래 ? (
            <>
              <div className="border-b hairline pb-3 mb-3">
                <div className="text-[11px] font-bold text-[var(--color-brand)] mb-1">
                  {선택_일자}
                </div>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[18px] font-extrabold">
                    {선택_거래.총_건수.toLocaleString("ko-KR")}
                    <span className="text-[12px] text-[var(--color-ink-3)] font-bold ml-1">건 거래</span>
                  </h3>
                  <div className="text-[12px] text-[var(--color-ink-3)] font-medium">
                    {선택_거래.단지_목록.length}개 단지
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {선택_거래.단지_목록
                  .sort((a, b) => b.거래_건수 - a.거래_건수)
                  .map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 py-2 border-b hairline last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-extrabold truncate leading-tight">
                          {d.단지명}
                        </div>
                        <div className="text-[11px] text-[var(--color-ink-3)] mt-0.5 font-medium">
                          {d.시군구명} · {d.거래_건수}건
                        </div>
                      </div>
                      <div className="text-right num text-[13px] font-bold">
                        <만원_표시 만원={d.평균_금액_만원} />
                      </div>
                    </li>
                  ))}
              </ul>
              <Link
                href={경로_생성(undefined, "")}
                className="block text-center text-[12px] font-bold text-[var(--color-brand)] mt-4 py-2 rounded-lg hover:bg-[var(--color-brand-soft)]"
              >
                선택 해제
              </Link>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-[12px] font-bold text-[var(--color-ink-3)] mb-2">
                날짜를 선택하세요
              </div>
              <div className="text-[11px] text-[var(--color-ink-4)] leading-relaxed">
                캘린더 셀을 클릭하면
                <br />
                해당 날짜의 거래 단지 목록이 표시됩니다.
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
