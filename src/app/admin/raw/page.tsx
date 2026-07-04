import Link from "next/link";
import { 컨테이너 } from "../../../infrastructure/di/컨테이너";
import { 필터바 } from "../../../presentation/components/필터바";
import { 만원_표시 } from "../../../presentation/components/숫자_표시";
import type {
  거래_유형_코드,
  물건_유형_코드,
  면적_구간_코드,
} from "../../../domain/공통/코드";
import { 거래_유형, 물건_유형 } from "../../../domain/공통/코드";

export const dynamic = "force-dynamic";

const 시도_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "11000", 라벨: "서울" },
  { 값: "41000", 라벨: "경기" },
  { 값: "28000", 라벨: "인천" },
  { 값: "26000", 라벨: "부산" },
];

const 물건_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "A", 라벨: "아파트" },
  { 값: "B", 라벨: "연립·다세대" },
  { 값: "D", 라벨: "오피스텔" },
  { 값: "E", 라벨: "분양권" },
];

const 거래유형_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "1", 라벨: "매매" },
  { 값: "2", 라벨: "전·월세" },
];

const 정렬_선택지 = [
  { 값: "최신순", 라벨: "최신순" },
  { 값: "오래된순", 라벨: "오래된순" },
  { 값: "금액_높은순", 라벨: "금액↓" },
  { 값: "금액_낮은순", 라벨: "금액↑" },
];

const 사이즈_선택지 = [
  { 값: "50", 라벨: "50건" },
  { 값: "100", 라벨: "100건" },
  { 값: "200", 라벨: "200건" },
];

const 평형_선택지 = [
  { 값: "전체", 라벨: "전체" },
  { 값: "1", 라벨: "60↓" },
  { 값: "2", 라벨: "60–85" },
  { 값: "3", 라벨: "85–102" },
  { 값: "4", 라벨: "102–135" },
  { 값: "5", 라벨: "135↑" },
];

export default async function 로우_데이터_페이지({
  searchParams,
}: {
  searchParams: Promise<{
    시도?: string;
    물건?: string;
    거래?: string;
    평형?: string;
    정렬?: string;
    사이즈?: string;
    페이지?: string;
    단지?: string;
    해제?: string;
    직거래?: string;
  }>;
}) {
  const p = await searchParams;
  const 시도 = p.시도 ?? "전체";
  const 물건 = p.물건 ?? "전체";
  const 거래 = p.거래 ?? "전체";
  const 평형 = p.평형 ?? "전체";
  const 정렬 = (p.정렬 ?? "최신순") as
    | "최신순"
    | "오래된순"
    | "금액_높은순"
    | "금액_낮은순";
  const 사이즈 = Number(p.사이즈 ?? "50");
  const 페이지 = Math.max(1, Number(p.페이지 ?? "1"));
  const 단지명 = (p.단지 ?? "").trim();
  const 해제포함 = p.해제 === "1";
  const 직거래제외 = p.직거래 === "1";

  const 조건 = {
    시도_코드: 시도 === "전체" ? undefined : 시도,
    물건_유형: 물건 === "전체" ? undefined : (물건 as 물건_유형_코드),
    거래_유형: 거래 === "전체" ? undefined : (거래 as 거래_유형_코드),
    면적_구간: 평형 === "전체" ? undefined : (평형 as 면적_구간_코드),
    포함_해제: 해제포함,
    직거래_제외: 직거래제외,
    단지명_부분: 단지명 || undefined,
    정렬,
    최대: 사이즈,
    건너뛰기: (페이지 - 1) * 사이즈,
  };

  const [거래들, 총_개수, 시도_목록] = await Promise.all([
    컨테이너.실거래_저장소.실거래_조회(조건),
    컨테이너.실거래_저장소.실거래_개수({ ...조건, 최대: undefined, 건너뛰기: undefined }),
    컨테이너.지역_저장소.시도_목록_조회(),
  ]);

  // 거래에 등장한 시도별로 시군구 목록 로드 (한 번에)
  const 등장_시도_코드 = Array.from(new Set(거래들.map((t) => t.시도_코드)));
  const 시군구_묶음 = await Promise.all(
    등장_시도_코드.map((코드) => 컨테이너.지역_저장소.시군구_목록_조회(코드)),
  );

  const 시도_이름_맵 = new Map(시도_목록.map((s) => [s.코드, s.이름]));
  const 시군구_이름_맵 = new Map<string, string>();
  for (const 리스트 of 시군구_묶음) {
    for (const s of 리스트) 시군구_이름_맵.set(s.코드, s.이름);
  }

  // 시도명 짧게
  const 시도_짧게 = (코드: string): string => {
    const 이름 = 시도_이름_맵.get(코드) ?? 코드;
    return 이름
      .replace("특별시", "")
      .replace("광역시", "")
      .replace("특별자치시", "")
      .replace("특별자치도", "")
      .replace("도", "");
  };

  const 총_페이지 = Math.max(1, Math.ceil(총_개수 / 사이즈));
  const 페이지_생성 = (n: number) => {
    const 다음 = new URLSearchParams();
    if (시도 !== "전체") 다음.set("시도", 시도);
    if (물건 !== "전체") 다음.set("물건", 물건);
    if (거래 !== "전체") 다음.set("거래", 거래);
    if (평형 !== "전체") 다음.set("평형", 평형);
    if (정렬 !== "최신순") 다음.set("정렬", 정렬);
    if (사이즈 !== 50) 다음.set("사이즈", String(사이즈));
    if (단지명) 다음.set("단지", 단지명);
    if (해제포함) 다음.set("해제", "1");
    if (직거래제외) 다음.set("직거래", "1");
    다음.set("페이지", String(n));
    return `?${다음.toString()}`;
  };

  return (
    <>
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-3">
          <div className="text-[12px] font-bold text-[var(--color-brand)] mb-1 flex items-center gap-2">
            <Link href="/admin" className="hover:underline">
              ADMIN
            </Link>
            <span>·</span>
            <span>로우 데이터</span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-2">
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
              거래 원본 테이블
            </h1>
            <div className="text-[12px] text-[var(--color-ink-3)] font-medium">
              총 <span className="num font-extrabold text-[var(--color-ink)]">{총_개수.toLocaleString("ko-KR")}</span>건 ·
              <span className="num font-bold ml-1">{페이지}</span> / {총_페이지} 페이지
            </div>
          </div>
        </div>
      </section>

      <필터바
        필터들={[
          { 키: "시도", 라벨: "시도", 선택지: 시도_선택지, 기본값: "전체" },
          { 키: "물건", 라벨: "물건", 선택지: 물건_선택지, 기본값: "전체" },
          { 키: "거래", 라벨: "거래", 선택지: 거래유형_선택지, 기본값: "전체" },
          { 키: "평형", 라벨: "평형", 선택지: 평형_선택지, 기본값: "전체" },
          { 키: "정렬", 라벨: "정렬", 선택지: 정렬_선택지, 기본값: "최신순" },
          { 키: "사이즈", 라벨: "페이지", 선택지: 사이즈_선택지, 기본값: "50" },
        ]}
      />

      <section className="mx-auto max-w-[1400px] px-6 py-4">
        <div className="toss-card overflow-x-auto">
          <table className="w-full text-[12px] min-w-[1200px]">
            <thead>
              <tr className="border-b hairline-strong bg-[var(--color-bg-soft)]">
                <th className="text-left py-2.5 px-3 label">계약일</th>
                <th className="text-left py-2.5 px-3 label">시도</th>
                <th className="text-left py-2.5 px-3 label">시군구</th>
                <th className="text-left py-2.5 px-3 label">단지명</th>
                <th className="text-left py-2.5 px-3 label">물건</th>
                <th className="text-left py-2.5 px-3 label">거래</th>
                <th className="text-right py-2.5 px-3 label">면적</th>
                <th className="text-right py-2.5 px-3 label">층</th>
                <th className="text-right py-2.5 px-3 label">건축</th>
                <th className="text-right py-2.5 px-3 label">금액</th>
                <th className="text-left py-2.5 px-3 label">경위</th>
                <th className="text-left py-2.5 px-3 label">상태</th>
              </tr>
            </thead>
            <tbody>
              {거래들.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-[var(--color-ink-3)]">
                    조건에 맞는 거래가 없습니다.
                  </td>
                </tr>
              ) : (
                거래들.map((t) => (
                  <tr
                    key={t.ID}
                    className={`border-b hairline ${t.해제_여부 ? "bg-[var(--color-bg-mute)]/50" : ""}`}
                  >
                    <td className="py-2 px-3 num text-[var(--color-ink-2)] font-medium">
                      {t.계약_일자}
                    </td>
                    <td className="py-2 px-3 font-medium text-[var(--color-ink-2)]">
                      {시도_짧게(t.시도_코드)}
                      <span className="ml-1 text-[10px] text-[var(--color-ink-4)] num font-normal">
                        {t.시도_코드}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {시군구_이름_맵.get(t.시군구_코드) ?? (
                        <span className="text-[var(--color-ink-4)]">{t.시군구_코드}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold max-w-[220px] truncate">
                      {t.단지명 ?? <span className="text-[var(--color-ink-4)]">—</span>}
                    </td>
                    <td className="py-2 px-3 font-medium text-[var(--color-ink-2)]">
                      {물건_유형[t.물건_유형] ?? t.물건_유형}
                    </td>
                    <td className="py-2 px-3">
                      {t.거래_유형 === "1" ? (
                        <span className="text-[var(--color-up)] font-bold">매매</span>
                      ) : (
                        <span className="text-[var(--color-down)] font-bold">전월세</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right num font-medium">
                      {t.전용_면적_제곱미터.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right num text-[var(--color-ink-2)] font-medium">
                      {t.층 ?? "—"}
                    </td>
                    <td className="py-2 px-3 text-right num text-[var(--color-ink-3)] font-medium">
                      {t.건축_연도 ?? "—"}
                    </td>
                    <td className="py-2 px-3 text-right num font-extrabold">
                      {t.거래_유형 === "1" ? (
                        <만원_표시 만원={t.거래_금액_만원} />
                      ) : (
                        <span>
                          <span className="text-[var(--color-ink-3)] text-[10px] font-bold">보 </span>
                          <만원_표시 만원={t.보증금_만원} />
                          {t.월세_만원 ? (
                            <>
                              <span className="text-[var(--color-ink-3)] text-[10px] font-bold"> 월 </span>
                              <만원_표시 만원={t.월세_만원} />
                            </>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {t.거래_경위 === "직거래" ? (
                        <span className="delta-pill delta-pill-flat text-[var(--color-warn)] bg-[var(--color-warn-soft)]">
                          직거래
                        </span>
                      ) : t.거래_경위 === "중개거래" ? (
                        <span className="text-[10px] text-[var(--color-ink-3)] font-bold">중개</span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-ink-4)]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {t.해제_여부 ? (
                        <span className="text-[10px] text-[var(--color-warn)] font-bold">해제</span>
                      ) : t.가격_이상치 ? (
                        <span className="text-[10px] text-[var(--color-warn)] font-bold">⚠ 이상</span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-ink-4)]">정상</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {총_페이지 > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-5">
            {페이지 > 1 && (
              <Link href={페이지_생성(페이지 - 1)} className="btn-ghost">
                ← 이전
              </Link>
            )}
            {(() => {
              const 시작 = Math.max(1, 페이지 - 3);
              const 끝 = Math.min(총_페이지, 시작 + 6);
              const 페이지들 = [];
              for (let n = 시작; n <= 끝; n++) 페이지들.push(n);
              return 페이지들.map((n) => (
                <Link
                  key={n}
                  href={페이지_생성(n)}
                  className={`pill ${n === 페이지 ? "pill-active" : ""}`}
                >
                  {n}
                </Link>
              ));
            })()}
            {페이지 < 총_페이지 && (
              <Link href={페이지_생성(페이지 + 1)} className="btn-ghost">
                다음 →
              </Link>
            )}
          </nav>
        )}

        <div className="mt-4 text-[11px] text-[var(--color-ink-3)] font-medium">
          기본은 신규 데이터만(해제·이상치 제외 가능). 시군구는 코드 표시 — 정확한 이름은 매핑 후 표시 예정.
        </div>
      </section>
    </>
  );
}
