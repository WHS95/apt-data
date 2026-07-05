import Link from "next/link";
import {
  단지_상세_유스케이스,
} from "../../../application/단지_상세_유스케이스";
import { 페이지_제목 } from "../../../presentation/components/페이지_제목";
import { 단지_상세_차트 } from "../../../presentation/components/단지_상세_차트";
import { 단지_상세_컨트롤 } from "../../../presentation/components/단지_상세_컨트롤";
import { 만원_표시, 비율_표시 } from "../../../presentation/components/숫자_표시";
import { 검색바 } from "../../../presentation/components/검색바";
import { DB } from "../../../infrastructure/persistence/접속";
import { 시군구_테이블, 시도_테이블, 실거래_테이블 } from "../../../infrastructure/persistence/스키마";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import type { 면적_구간_코드 } from "../../../domain/공통/코드";

export const dynamic = "force-dynamic";

const 검색_결과_조회 = async (검색어: string) => {
  const 행들 = await DB.select({
    시군구_코드: 실거래_테이블.시군구_코드,
    시도명: 시도_테이블.이름,
    시군구명: 시군구_테이블.이름,
    단지명: 실거래_테이블.단지명,
    거래수: sql<number>`count(*)::int`,
  })
    .from(실거래_테이블)
    .leftJoin(시군구_테이블, eq(시군구_테이블.코드, 실거래_테이블.시군구_코드))
    .leftJoin(시도_테이블, eq(시도_테이블.코드, 실거래_테이블.시도_코드))
    .where(
      and(
        ilike(실거래_테이블.단지명, `%${검색어}%`),
        eq(실거래_테이블.해제_여부, false),
        sql`${실거래_테이블.단지명} IS NOT NULL`,
      ),
    )
    .groupBy(
      실거래_테이블.시군구_코드,
      시도_테이블.이름,
      시군구_테이블.이름,
      실거래_테이블.단지명,
    )
    .orderBy(desc(sql`count(*)`))
    .limit(20);
  return 행들;
};

export default async function 단지상세_페이지({
  searchParams,
}: {
  searchParams: Promise<{
    sgg?: string;
    name?: string;
    q?: string;
    deal?: string;
    areaband?: string;
    cleanonly?: string;
    months?: string;
  }>;
}) {
  const p = await searchParams;

  if (p.q && (!p.sgg || !p.name)) {
    const 결과들 = await 검색_결과_조회(p.q);
    return (
      <>
        <페이지_제목
          제목="단지 검색"
          부제="SEARCH"
          설명={`"${p.q}" 검색 결과 — 거래 건수 기준 상위 ${결과들.length}건`}
        />
        <div className="border-b hairline">
          <div className="mx-auto max-w-[1240px] px-6 py-4">
            <검색바 />
          </div>
        </div>
        <section className="mx-auto max-w-[1240px] px-6 py-10">
          {결과들.length === 0 ? (
            <div className="toss-card p-12 text-center text-[var(--color-ink-3)]">
              일치하는 단지가 없습니다. 다른 키워드를 시도해보세요.
            </div>
          ) : (
            <ul className="toss-card overflow-hidden divide-y divide-[var(--color-line)]">
              {결과들.map((r, i) => (
                <li key={`${r.시군구_코드}_${r.단지명}`}>
                  <Link
                    href={`/picks/detail?sgg=${r.시군구_코드}&name=${encodeURIComponent(r.단지명!)}`}
                    className="grid grid-cols-12 gap-4 py-4 px-5 items-baseline hover:bg-[var(--color-bg-soft)] transition-colors"
                  >
                    <span className="col-span-1 num text-[12px] text-[var(--color-ink-4)] font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="col-span-6 font-bold text-[15px]">{r.단지명}</span>
                    <span className="col-span-3 text-[13px] text-[var(--color-ink-2)]">
                      {r.시도명} {r.시군구명}
                    </span>
                    <span className="col-span-2 text-right num text-[13px] font-bold">
                      {r.거래수}건
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  if (!p.sgg || !p.name) {
    return (
      <>
        <페이지_제목
          제목="단지 검색"
          부제="SEARCH"
          설명="단지명을 입력해 가격 추이와 거래 내역을 봅니다."
        />
        <div className="border-b hairline">
          <div className="mx-auto max-w-[1240px] px-6 py-4">
            <검색바 />
          </div>
        </div>
      </>
    );
  }

  const 거래_유형 = (p.deal ?? "전체") as "전체" | "1" | "2";
  const 평형 = (p.areaband ?? "전체") as 면적_구간_코드 | "전체";
  const 정상만 = p.cleanonly === "1";
  const 기간_연수 = Number(p.months ?? "3");

  const 결과 = await new 단지_상세_유스케이스().실행({
    시군구_코드: p.sgg,
    단지명: p.name,
    거래_유형,
    면적_구간: 평형,
    이상치_제외: 정상만,
  });

  if (!결과) {
    return (
      <>
        <페이지_제목
          제목={p.name}
          부제="단지 상세"
          설명="해당 조건의 거래 데이터가 없습니다."
        />
      </>
    );
  }

  const 메타 = 결과.메타;
  const 나이 = 메타.건축_연도 ? 2026 - 메타.건축_연도 : null;
  const 직거래_수 = 메타.경위_분포["직거래"] ?? 0;
  const 중개_수 = 메타.경위_분포["중개거래"] ?? 0;
  const 총_거래 = Object.values(메타.경위_분포).reduce((a, b) => a + b, 0);
  const 직거래_비율 = 총_거래 > 0 ? Math.round((직거래_수 / 총_거래) * 1000) / 10 : 0;

  return (
    <>
      <section className="bg-[var(--color-bg-soft)] border-b hairline">
        <div className="mx-auto max-w-[1240px] px-6 pt-10 pb-8">
          <div className="text-[13px] font-bold text-[var(--color-brand)] mb-2">
            단지 상세
          </div>
          <div className="flex items-end justify-between flex-wrap gap-y-4">
            <div>
              <h1 className="text-[40px] leading-tight font-extrabold tracking-[-0.025em]">
                {메타.단지명}
              </h1>
              <div className="text-[14px] text-[var(--color-ink-2)] mt-2 flex items-center gap-2 font-medium">
                <span>{메타.시도명} {메타.시군구명}</span>
                {메타.건축_연도 && (
                  <>
                    <span className="text-[var(--color-ink-4)]">·</span>
                    <span className="num">
                      {메타.건축_연도}년{나이 ? ` (${나이}년차)` : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Link href="/picks" className="btn-ghost">
              ← 추천 리스트
            </Link>
          </div>
        </div>
      </section>

      {/* 컨트롤 */}
      <div className="bg-[var(--color-bg)] border-b hairline">
        <div className="mx-auto max-w-[1240px] px-6 py-4">
          <단지_상세_컨트롤
            평형_옵션={메타.평형_옵션}
            현재_평형={평형}
            현재_거래유형={거래_유형}
            정상만={정상만}
          />
        </div>
      </div>

      {/* 4 카드 요약 */}
      <section className="bg-[var(--color-bg-soft)]">
        <div className="mx-auto max-w-[1240px] px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="toss-card p-5">
            <div className="label mb-2">최근 1개월 매매</div>
            <div>
              <만원_표시 만원={메타.최근_매매.평균_만원} 강조 />
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)] num mt-1 font-medium">
              {메타.최근_매매.건수}건
            </div>
          </div>
          <div className="toss-card p-5">
            <div className="label mb-2">최근 1개월 전세</div>
            <div>
              <만원_표시 만원={메타.최근_전세.평균_만원} 강조 />
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)] num mt-1 font-medium">
              {메타.최근_전세.건수}건
            </div>
          </div>
          <div className="toss-card p-5">
            <div className="label mb-2">전세가율</div>
            <div className="text-[24px] font-extrabold">
              <비율_표시 값={메타.전세가율} />
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)] mt-1 font-medium">
              최근 30일 평균
            </div>
          </div>
          <div className="toss-card p-5">
            <div className="label mb-2">역대 최고가</div>
            <div className="text-[var(--color-up)]">
              <만원_표시 만원={메타.역대_최고가_만원} 강조 />
            </div>
            <div className="text-[11px] text-[var(--color-ink-3)] mt-1 num font-medium">
              {메타.역대_최고가_월?.replace("-", ". ")}
            </div>
          </div>
        </div>
      </section>

      {/* 차트 — 토스부동산 스타일 */}
      <section className="mx-auto max-w-[1240px] px-6 py-8">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-[20px] font-extrabold tracking-tight">가격 추이</h2>
          {/* 기간 탭 */}
          <div className="flex items-center gap-1">
            {[
              { 값: "3", 라벨: "최근 3년" },
              { 값: "1", 라벨: "최근 1년" },
              { 값: "5", 라벨: "최근 5년" },
              { 값: "0", 라벨: "전체 기간" },
            ].map((옵션) => {
              const sp = new URLSearchParams();
              if (p.sgg) sp.set("sgg", p.sgg);
              if (p.name) sp.set("name", p.name);
              if (p.deal) sp.set("deal", p.deal);
              if (p.areaband) sp.set("areaband", p.areaband);
              if (p.cleanonly) sp.set("cleanonly", p.cleanonly);
              sp.set("months", 옵션.값);
              const 활성 = String(기간_연수) === 옵션.값;
              return (
                <Link
                  key={옵션.값}
                  href={`?${sp.toString()}`}
                  className={`pill ${활성 ? "pill-active" : ""}`}
                >
                  {옵션.라벨}
                </Link>
              );
            })}
          </div>
        </div>
        <단지_상세_차트
          결과={결과}
          거래_유형={거래_유형}
          기간_연수={기간_연수}
        />
      </section>

      {/* 거래 신뢰도 — 직거래 / 이상치 안내 */}
      <section className="mx-auto max-w-[1240px] px-6 pb-6">
        <div className="toss-card p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[16px] font-extrabold tracking-tight">거래 신뢰도</h2>
            <span className="label">중개·직거래 분포 + 가격 이상치</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="label">중개거래</div>
              <div className="text-[22px] font-extrabold num mt-1">
                {중개_수.toLocaleString("ko-KR")}
                <span className="text-[12px] text-[var(--color-ink-3)] font-bold ml-1">건</span>
              </div>
            </div>
            <div>
              <div className="label">직거래 <span className="text-[var(--color-warn)]">(가족간 의심)</span></div>
              <div className="text-[22px] font-extrabold num mt-1 text-[var(--color-warn)]">
                {직거래_수.toLocaleString("ko-KR")}
                <span className="text-[12px] text-[var(--color-ink-3)] font-bold ml-1">건 · {직거래_비율}%</span>
              </div>
            </div>
            <div>
              <div className="label">가격 이상치 의심</div>
              <div className="text-[22px] font-extrabold num mt-1 text-[var(--color-warn)]">
                {메타.이상치_건수.toLocaleString("ko-KR")}
                <span className="text-[12px] text-[var(--color-ink-3)] font-bold ml-1">건</span>
              </div>
              <div className="text-[10px] text-[var(--color-ink-3)] mt-1">
                중위가 ±35% 벗어남
              </div>
            </div>
            <div>
              <div className="label">표시 모드</div>
              <div className="text-[14px] font-bold mt-2">
                {정상만 ? "정상 거래만 (이상치 제외)" : "전체 거래"}
              </div>
              <div className="text-[10px] text-[var(--color-ink-3)] mt-1">
                상단 토글로 변경
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 최근 거래 내역 */}
      <section className="mx-auto max-w-[1240px] px-6 pb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[20px] font-extrabold tracking-tight">최근 거래 내역</h2>
          <span className="label">최신 40건 · 의심 거래는 표시</span>
        </div>
        <div className="toss-card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b hairline">
                <th className="text-left py-3 px-4 label">계약일</th>
                <th className="text-left py-3 px-4 label">구분</th>
                <th className="text-right py-3 px-4 label">면적</th>
                <th className="text-right py-3 px-4 label">층</th>
                <th className="text-right py-3 px-4 label">금액</th>
                <th className="text-left py-3 px-4 label">경위</th>
                <th className="text-left py-3 px-4 label">의심</th>
              </tr>
            </thead>
            <tbody>
              {결과.거래들
                .slice(-40)
                .reverse()
                .map((t, i) => (
                  <tr
                    key={i}
                    className={`border-b hairline last:border-b-0 ${t.이상치_의심 ? "bg-[var(--color-warn-soft)]/30" : ""}`}
                  >
                    <td className="py-3 px-4 num text-[var(--color-ink-2)] font-medium">
                      {t.계약_일자}
                    </td>
                    <td className="py-3 px-4">
                      {t.거래_유형 === "1" ? (
                        <span className="text-[var(--color-up)] font-bold">매매</span>
                      ) : (
                        <span className="text-[var(--color-down)] font-bold">전·월세</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right num font-medium">
                      {t.전용_면적_제곱미터.toFixed(1)}㎡
                    </td>
                    <td className="py-3 px-4 text-right num text-[var(--color-ink-3)] font-medium">
                      {t.층 ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right num font-bold">
                      {t.거래_유형 === "1" ? (
                        <만원_표시 만원={t.거래_금액_만원} />
                      ) : (
                        <span>
                          보 <만원_표시 만원={t.보증금_만원} />
                          {t.월세_만원 ? (
                            <>
                              <span className="text-[var(--color-ink-3)]"> / 월 </span>
                              <만원_표시 만원={t.월세_만원} />
                            </>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {t.거래_경위 === "직거래" ? (
                        <span className="delta-pill delta-pill-flat text-[var(--color-warn)] bg-[var(--color-warn-soft)]">
                          직거래
                        </span>
                      ) : t.거래_경위 === "중개거래" ? (
                        <span className="text-[11px] text-[var(--color-ink-3)] font-medium">중개</span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-ink-4)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {t.이상치_의심 ? (
                        <span
                          className="text-[11px] text-[var(--color-warn)] font-bold cursor-help"
                          title={t.의심_사유 ?? undefined}
                        >
                          ⚠ {t.의심_사유?.slice(0, 16)}…
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--color-ink-4)]">정상</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
