import Link from "next/link";

const 결정_흐름 = [
  {
    번호: "01",
    도장: "傳",
    제목: "전세가율 히트맵",
    경로: "/jeonse",
    한줄: "전세에서 매매로 갈아탈 골든 타임을 본다.",
    설명: "동일 구·동일 평형의 전세가율이 80%를 넘으면 매매 매력이 크게 올라간다. 60% 미만이면 매매 부담이 크다.",
  },
  {
    번호: "02",
    도장: "豫",
    제목: "예산별 매물 분포",
    경로: "/budget",
    한줄: "내 6억으로 어디까지 살 수 있는지.",
    설명: "총 가용 자금을 입력하면 시도→시군구→평형 순으로 매물 분포가 드릴다운된다.",
  },
  {
    번호: "03",
    도장: "推",
    제목: "단지 가격 추이",
    경로: "/trend",
    한줄: "관심 단지의 매매·전세 동시 흐름.",
    설명: "단지명 검색으로 월별 중위 거래가를 라인으로 본다. 호가가 아닌 실거래만으로 판단한다.",
  },
  {
    번호: "04",
    도장: "權",
    제목: "권역 비교",
    경로: "/region",
    한줄: "직장 1시간 권역의 가성비 순위.",
    설명: "선택한 시군구를 매매가·전세가율·거래량으로 비교해 가성비 점수를 매긴다.",
  },
  {
    번호: "05",
    도장: "分",
    제목: "분양·입주권 캘린더",
    경로: "/presale",
    한줄: "신혼특공·생애최초 노릴 단지의 거래 일정.",
    설명: "분양/입주권 카테고리만 일자별로 모아 본다. 거래 급증은 분양가 적정성의 신호다.",
  },
] as const;

export default function 홈_페이지() {
  return (
    <div>
      <section className="border-b hairline">
        <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7">
            <div className="eyebrow mb-4">2026 · 국토교통부 실거래 기반</div>
            <h1 className="text-[64px] md:text-[88px] leading-[0.95] font-bold tracking-[-0.03em]">
              호가는 잊고,<br />
              <span className="text-[var(--color-maemae)]">실거래</span>로<br />
              첫 집을 본다.
            </h1>
            <p className="mt-8 max-w-[52ch] text-[16px] text-[var(--color-ink-2)] leading-[1.7]">
              한지(韓地)는 신혼부부가 첫 집을 정할 때 보는 다섯 가지 질문에 직답하는 데이터 도구입니다.
              부동산 앱이 보여주는 호가·광고가 아니라, 정부에 신고된 거래만으로 안 속고 판단합니다.
            </p>
          </div>
          <aside className="col-span-12 md:col-span-5 md:pl-8 md:border-l hairline">
            <div className="eyebrow mb-4">결정의 다섯 질문</div>
            <ol className="space-y-3">
              {결정_흐름.map((q) => (
                <li key={q.번호} className="flex items-baseline gap-3">
                  <span className="num text-[11px] text-[var(--color-ink-3)] w-6">{q.번호}</span>
                  <span className="text-[14px]">
                    <span className="font-medium">{q.제목}</span>
                    <span className="text-[var(--color-ink-2)]"> — {q.한줄}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="flex items-baseline justify-between mb-8 border-b hairline pb-4">
          <h2 className="text-[24px] font-bold tracking-tight">다섯 개의 뷰</h2>
          <span className="eyebrow">의사결정 순서대로</span>
        </div>
        <ul className="grid-lines border-y hairline">
          {결정_흐름.map((q) => (
            <li key={q.경로}>
              <Link
                href={q.경로}
                className="group grid grid-cols-12 gap-6 py-8 hover:bg-[var(--color-paper-deep)] px-4 -mx-4 transition-colors"
              >
                <div className="col-span-2 md:col-span-1 flex items-start gap-3">
                  <span className="num text-[11px] text-[var(--color-ink-3)] mt-1">{q.번호}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="stamp stamp-sm">{q.도장}</span>
                </div>
                <div className="col-span-8 md:col-span-7">
                  <h3 className="text-[28px] md:text-[32px] font-bold leading-tight tracking-tight">
                    {q.제목}
                  </h3>
                  <p className="mt-2 text-[14px] text-[var(--color-ink-2)] leading-relaxed max-w-[60ch]">
                    {q.설명}
                  </p>
                </div>
                <div className="hidden md:flex col-span-3 items-start justify-end">
                  <span className="text-[13px] text-[var(--color-ink-2)] group-hover:text-[var(--color-maemae)] transition-colors">
                    보기 →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="eyebrow mb-3">왜 한지인가</div>
          <p className="text-[15px] text-[var(--color-ink-2)] leading-[1.8]">
            한지(韓地)는 한국 부동산을 신혼부부의 시선으로 다시 발라내는 작업입니다.
            중개 앱은 매물을 팔기 위해 설계되어 있지만, 신혼부부는 평생에 한두 번 결정합니다.
            그래서 광고 없이, 신고된 거래만으로 답해야 한다고 믿습니다.
          </p>
        </div>
        <div className="md:pl-8 md:border-l hairline">
          <div className="eyebrow mb-3">데이터의 한계</div>
          <p className="text-[15px] text-[var(--color-ink-2)] leading-[1.8]">
            계약일과 신고일은 최대 30일까지 차이날 수 있습니다.
            가장 최근 한 달의 데이터는 본 자료보다 실제로 더 많을 수 있고,
            정정·해제로 사라질 수도 있습니다. 큰 흐름은 신뢰하되, 한 건의 신고가는 의심하십시오.
          </p>
        </div>
      </section>
    </div>
  );
}
