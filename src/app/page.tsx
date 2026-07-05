import Link from "next/link";
import { 예산_위젯 } from "../presentation/components/예산_위젯";

const 페르소나 = [
  {
    아이콘: "🏡",
    제목: "신혼부부 첫 집",
    설명: "실거래 기반으로 무리 없는 첫 집을 찾습니다.",
    요약: "서울 20평대 · 10년이내 · 6.5억↓",
    경로: "/picks?region=서울&area=66-99&age=10&price=0-65000&perspective=종합",
  },
  {
    아이콘: "🔁",
    제목: "학군 갈아타기",
    설명: "지금 집을 팔고 학군지로 넓혀 갈아탈 후보.",
    요약: "서울 30평대 · 15억↓ · 안정성",
    경로: "/picks?region=서울&area=99-132&price=0-150000&perspective=안정성",
  },
  {
    아이콘: "📈",
    제목: "투자 · 갭",
    설명: "전세가율과 상승 모멘텀으로 갭 후보를 봅니다.",
    요약: "수도권 상승 모멘텀 · 전세가율",
    경로: "/picks?region=수도권&perspective=모멘텀",
  },
] as const;

const 뷰_그룹들 = [
  {
    그룹: "탐색",
    뷰들: [
      {
        아이콘: "🏢",
        제목: "단지추천",
        설명: "조건별 아파트 단지 추천",
        경로: "/picks",
      },
      {
        아이콘: "⭐",
        제목: "관심",
        설명: "저장한 단지 시세·메모",
        경로: "/favorites",
      },
    ],
  },
  {
    그룹: "지역·시장",
    뷰들: [
      {
        아이콘: "🗺️",
        제목: "서울지도",
        설명: "자치구 히트맵",
        경로: "/seoul-map",
      },
      {
        아이콘: "🏙️",
        제목: "수도권",
        설명: "권역 매수 순위",
        경로: "/buyzone",
      },
      {
        아이콘: "🧭",
        제목: "권역비교",
        설명: "시군구 가성비 비교",
        경로: "/region",
      },
      {
        아이콘: "📊",
        제목: "전세가율",
        설명: "전세가율 히트맵",
        경로: "/jeonse",
      },
    ],
  },
  {
    그룹: "상세·이벤트",
    뷰들: [
      {
        아이콘: "💰",
        제목: "예산매물",
        설명: "예산별 매물 분포",
        경로: "/budget",
      },
      {
        아이콘: "📈",
        제목: "단지추이",
        설명: "단지 월별 흐름",
        경로: "/trend",
      },
      {
        아이콘: "📅",
        제목: "분양캘린더",
        설명: "분양·입주권 일정",
        경로: "/presale",
      },
    ],
  },
] as const;

export default function 홈_페이지() {
  return (
    <div>
      {/* 히어로 */}
      <section className="border-b hairline bg-[var(--color-bg)]">
        <div className="mx-auto max-w-[1240px] px-6 pt-16 pb-14 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-12 items-start">
          <div>
            <div className="text-[13px] font-bold text-[var(--color-brand)] mb-4">
              2026 · 국토교통부 실거래 기반
            </div>
            <h1 className="text-[42px] md:text-[60px] leading-[1.02] font-extrabold tracking-[-0.03em]">
              호가는 잊고,
              <br />
              <span className="text-[var(--color-brand)]">실거래</span>로
              <br />첫 집을 본다.
            </h1>
            <p className="mt-7 max-w-[54ch] text-[16px] md:text-[17px] text-[var(--color-ink-2)] leading-[1.7] font-medium">
              한지는 정부에 신고된 실거래만으로 집을 판단하는 데이터
              도구입니다. 광고·호가가 아니라 진짜 거래된 값으로,
              신혼부부부터 갈아타기·투자까지 각자의 관점에서 봅니다.
            </p>
          </div>
          <예산_위젯 />
        </div>
      </section>

      {/* 페르소나 선택 */}
      <section className="mx-auto max-w-[1240px] px-6 py-14">
        <div className="mb-6">
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">
            나는 어떤 집을 찾나요?
          </h2>
          <p className="mt-1 text-[14px] text-[var(--color-ink-3)] font-medium">
            상황을 고르면 딱 맞는 필터가 걸린 단지 추천으로 바로 이동합니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {페르소나.map((p) => (
            <Link
              key={p.제목}
              href={p.경로}
              className="toss-card p-6 flex flex-col gap-3 hover:border-[var(--color-brand)] group"
            >
              <div className="text-[32px] leading-none">{p.아이콘}</div>
              <div>
                <div className="text-[18px] font-extrabold tracking-[-0.02em] group-hover:text-[var(--color-brand)] transition-colors">
                  {p.제목}
                </div>
                <p className="mt-1 text-[13px] text-[var(--color-ink-2)] font-medium leading-relaxed">
                  {p.설명}
                </p>
              </div>
              <div className="mt-auto pt-1">
                <span className="pill pill-brand text-[12px]">{p.요약}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 뷰 바로가기 — 상단 네비 3그룹 구조 */}
      <section className="mx-auto max-w-[1240px] px-6 pb-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">
            바로 쓰는 뷰
          </h2>
          <span className="text-[13px] text-[var(--color-ink-3)] font-medium">
            의사결정 도구
          </span>
        </div>
        <div className="flex flex-col gap-9">
          {뷰_그룹들.map((g) => (
            <div key={g.그룹}>
              <div className="text-[12px] font-bold text-[var(--color-ink-3)] uppercase tracking-[0.04em] mb-3">
                {g.그룹}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.뷰들.map((v) => (
                  <Link
                    key={v.경로}
                    href={v.경로}
                    className="toss-card p-5 flex items-start gap-4 hover:border-[var(--color-brand)] group"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-[12px] bg-[var(--color-bg-mute)] flex items-center justify-center text-[20px]">
                      {v.아이콘}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-extrabold tracking-[-0.01em] group-hover:text-[var(--color-brand)] transition-colors">
                        {v.제목}
                      </div>
                      <p className="mt-1 text-[13px] text-[var(--color-ink-2)] font-medium leading-relaxed">
                        {v.설명}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 데이터 한계 */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20">
        <div className="toss-card-soft p-5 md:p-6">
          <div className="text-[13px] font-bold text-[var(--color-warn)] mb-1">
            데이터의 한계
          </div>
          <p className="text-[14px] text-[var(--color-ink-2)] font-medium leading-[1.7] max-w-[80ch]">
            계약일과 신고일은 최대 30일까지 차이날 수 있습니다. 가장 최근 한
            달의 데이터는 실제보다 적게 보일 수 있고, 정정·해제로 사라질 수도
            있습니다. 큰 흐름은 신뢰하되, 한 건의 신고가는 의심하십시오.
          </p>
        </div>
      </section>
    </div>
  );
}
