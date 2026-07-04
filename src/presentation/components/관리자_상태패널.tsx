"use client";

import { useEffect, useState } from "react";
import type { 관리자_현황 } from "../../application/관리자_현황_유스케이스";
import { 만원_표시 } from "./숫자_표시";

const 상태_배지 = (상태: string) => {
  switch (상태) {
    case "success":
      return { 라벨: "저장됨", 색: "bg-[var(--color-up-soft)] text-[var(--color-up)]" };
    case "empty":
      return { 라벨: "거래 없음", 색: "bg-[var(--color-bg-mute)] text-[var(--color-ink-3)]" };
    case "blocked":
      return { 라벨: "MOLIT 차단", 색: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]" };
    case "error":
      return { 라벨: "오류", 색: "bg-[var(--color-down-soft)] text-[var(--color-down)]" };
    default:
      return { 라벨: 상태, 색: "bg-[var(--color-bg-mute)] text-[var(--color-ink-3)]" };
  }
};

const 시도_이름: Record<string, string> = {
  "11000": "서울특별시",
  "26000": "부산광역시",
  "27000": "대구광역시",
  "28000": "인천광역시",
  "29000": "광주광역시",
  "30000": "대전광역시",
  "31000": "울산광역시",
  "36000": "세종특별자치시",
  "41000": "경기도",
  "43000": "충청북도",
  "44000": "충청남도",
  "46000": "전라남도",
  "47000": "경상북도",
  "48000": "경상남도",
  "50000": "제주특별자치도",
  "51000": "강원특별자치도",
  "52000": "전북특별자치도",
};

const 물건_이름: Record<string, string> = {
  A: "아파트",
  B: "연립·다세대",
  C: "단독·다가구",
  D: "오피스텔",
  E: "분양·입주권",
  F: "상업·업무용",
  G: "토지",
  H: "공장·창고",
};

const 거래_이름: Record<string, string> = {
  "1": "매매",
  "2": "전·월세",
};

const 청크_요약 = (시작: string, 끝: string): string => {
  // "2024-07-02" → "24.07"
  const 시작_짧 = 시작.slice(2, 7).replace("-", ".");
  const 끝_짧 = 끝.slice(2, 7).replace("-", ".");
  return `${시작_짧} → ${끝_짧}`;
};

const 소요_요약 = (ms: number): string => {
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}분`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}초`;
  return `${ms}ms`;
};

// DB의 timestamp(without TZ) 컬럼은 KST 벽시계로 저장되어 있는데
// Node Date가 UTC로 파싱하면 +9시간 오차가 남 → ISO 문자열을 그대로 KST로 해석해서 표시.
const 시간_표시 = (d: Date | string | null): string => {
  if (!d) return "—";
  const iso = typeof d === "string" ? d : d.toISOString();
  const 순수 = iso.replace(/Z$/, "").replace(/\+\d{2}:?\d{2}$/, "");
  const [날짜부, 시각부 = "00:00:00"] = 순수.split("T");
  const [년, 월, 일] = 날짜부.split("-").map(Number);
  const [시, 분] = 시각부.split(":");
  return `${년}. ${월}. ${일}. ${시}시 ${분}분 (KST)`;
};

interface 속성 {
  초기_현황: 관리자_현황;
}

export const 관리자_상태패널 = ({ 초기_현황 }: 속성) => {
  const [현황, 현황_설정] = useState<관리자_현황>(초기_현황);
  const [편집, 편집_설정] = useState(false);
  const [저장중, 저장중_설정] = useState(false);
  const [폼, 폼_설정] = useState({
    요청_딜레이_MS: 초기_현황.설정.요청_딜레이_MS,
    청크_개월: 초기_현황.설정.청크_개월,
    쿨다운_HTML_MS: 초기_현황.설정.쿨다운_HTML_MS,
    년수_제한: 초기_현황.설정.년수_제한,
  });

  useEffect(() => {
    const id = setInterval(async () => {
      const 응답 = await fetch("/api/admin/status", { cache: "no-store" });
      if (응답.ok) 현황_설정(await 응답.json());
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const 활성_토글 = async () => {
    저장중_설정(true);
    const 응답 = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 활성: !현황.설정.활성 }),
    });
    if (응답.ok) {
      const 새_설정 = await 응답.json();
      현황_설정({ ...현황, 설정: 새_설정 });
    }
    저장중_설정(false);
  };

  const 폼_저장 = async () => {
    저장중_설정(true);
    const 응답 = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(폼),
    });
    if (응답.ok) {
      const 새_설정 = await 응답.json();
      현황_설정({ ...현황, 설정: 새_설정 });
      편집_설정(false);
    }
    저장중_설정(false);
  };

  const 시도_최대 = Math.max(1, ...현황.시도별_진행.map((s) => s.누적_저장));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 space-y-12">
      {/* 상태 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-0 border hairline divide-x divide-[var(--color-line)]">
        <div className="p-6">
          <div className="eyebrow mb-2">총 거래</div>
          <div className="text-[36px] font-bold tracking-tight num">
            {현황.총_거래_건수.toLocaleString("ko-KR")}
          </div>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-1">건 적재</div>
        </div>
        <div className="p-6">
          <div className="eyebrow mb-2">성공/차단</div>
          <div className="text-[36px] font-bold tracking-tight num">
            <span className="text-[var(--color-jeonse)]">{현황.상태별_개수.success ?? 0}</span>
            <span className="text-[var(--color-ink-3)] text-[20px]"> / </span>
            <span className="text-[var(--color-warn)]">{현황.상태별_개수.blocked ?? 0}</span>
          </div>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-1">청크 단위</div>
        </div>
        <div className="p-6">
          <div className="eyebrow mb-2">스케줄러</div>
          <button
            onClick={활성_토글}
            disabled={저장중}
            className={`text-[20px] font-bold tracking-tight transition-colors ${
              현황.설정.활성 ? "text-[var(--color-jeonse)]" : "text-[var(--color-warn)]"
            }`}
          >
            {현황.설정.활성 ? "● 가동중" : "■ 일시정지"}
          </button>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-1">
            클릭해서 전환
          </div>
        </div>
        <div className="p-6">
          <div className="eyebrow mb-2">최근 실행</div>
          <div className="text-[14px] font-medium num">
            {시간_표시(현황.마지막_실행_시각)}
          </div>
          <div className="text-[11px] text-[var(--color-ink-3)] mt-1">자동 새로고침 10초</div>
        </div>
      </section>

      {/* 설정 */}
      <section className="border hairline">
        <header className="flex items-baseline justify-between p-6 border-b hairline">
          <div>
            <div className="eyebrow mb-1">CADENCE</div>
            <h2 className="text-[20px] font-bold tracking-tight">수집 페이스 설정</h2>
          </div>
          {!편집 ? (
            <button
              onClick={() => 편집_설정(true)}
              className="text-[13px] font-medium border border-[var(--color-ink)] px-4 py-1.5 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
            >
              편집
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  편집_설정(false);
                  폼_설정({
                    요청_딜레이_MS: 현황.설정.요청_딜레이_MS,
                    청크_개월: 현황.설정.청크_개월,
                    쿨다운_HTML_MS: 현황.설정.쿨다운_HTML_MS,
                    년수_제한: 현황.설정.년수_제한,
                  });
                }}
                className="text-[13px] border hairline-strong px-4 py-1.5"
              >
                취소
              </button>
              <button
                onClick={폼_저장}
                disabled={저장중}
                className="text-[13px] font-medium bg-[var(--color-maemae)] text-[var(--color-paper)] px-4 py-1.5 hover:opacity-90"
              >
                저장
              </button>
            </div>
          )}
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-[var(--color-line)]">
          {(
            [
              {
                키: "요청_딜레이_MS",
                라벨: "요청 간 대기",
                단위: "ms",
                힌트: "1000-60000",
                값: 폼.요청_딜레이_MS,
              },
              {
                키: "청크_개월",
                라벨: "청크 크기",
                단위: "개월",
                힌트: "1-12",
                값: 폼.청크_개월,
              },
              {
                키: "쿨다운_HTML_MS",
                라벨: "차단 시 쿨다운",
                단위: "ms",
                힌트: "60000-3600000",
                값: 폼.쿨다운_HTML_MS,
              },
              {
                키: "년수_제한",
                라벨: "수집 범위",
                단위: "년",
                힌트: "1-20",
                값: 폼.년수_제한,
              },
            ] as const
          ).map((f) => (
            <div key={f.키} className="p-6">
              <div className="eyebrow mb-2">{f.라벨}</div>
              {편집 ? (
                <>
                  <input
                    type="number"
                    value={f.값}
                    onChange={(e) =>
                      폼_설정({ ...폼, [f.키]: Number(e.target.value) })
                    }
                    className="w-full bg-transparent border-0 border-b border-b-[var(--color-ink)] py-1 text-[20px] font-bold num focus:outline-none focus:border-b-[var(--color-maemae)]"
                  />
                  <div className="text-[10px] text-[var(--color-ink-3)] mt-1">
                    {f.단위} · {f.힌트}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[24px] font-bold num">
                    {f.값.toLocaleString("ko-KR")}
                  </div>
                  <div className="text-[10px] text-[var(--color-ink-3)] mt-1">{f.단위}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 시도별 진행 */}
      <section>
        <div className="flex items-baseline justify-between mb-4 border-b hairline pb-3">
          <h2 className="text-[20px] font-bold tracking-tight">시도별 누적</h2>
          <span className="eyebrow">저장된 거래 수</span>
        </div>
        <ul className="grid-lines border-y hairline">
          {현황.시도별_진행.map((s, i) => (
            <li
              key={s.시도_코드}
              className="grid grid-cols-12 gap-4 items-center py-3 px-2"
            >
              <span className="num text-[10px] text-[var(--color-ink-3)] col-span-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="col-span-3 font-medium text-[14px]">{s.시도명}</span>
              <div className="col-span-6 relative h-3 bg-[var(--color-paper-deep)]">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
                  style={{ width: `${(s.누적_저장 / 시도_최대) * 100}%` }}
                />
              </div>
              <span className="col-span-2 text-right num text-[13px]">
                {s.누적_저장.toLocaleString("ko-KR")}
                <span className="text-[var(--color-ink-3)] text-[10px] ml-1">건</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 최근 기록 */}
      <section>
        <div className="flex items-baseline justify-between mb-4 border-b hairline pb-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight">최근 실행 기록</h2>
            <div className="text-[12px] text-[var(--color-ink-3)] font-medium mt-1">
              스케줄러가 실행한 각 청크(시도 × 물건 × 거래 × 기간)의 결과. MOLIT 서버가 CSV를 응답하지 않으면 <span className="text-[var(--color-warn)] font-bold">차단</span>, 응답했지만 거래가 없으면 <span className="text-[var(--color-ink-2)] font-bold">거래 없음</span>.
            </div>
          </div>
          <span className="text-[12px] font-bold text-[var(--color-ink-3)]">최신 40건</span>
        </div>
        <div className="toss-card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b hairline-strong bg-[var(--color-bg-soft)]">
                <th className="text-left py-3 px-4 label">시각</th>
                <th className="text-left py-3 px-4 label">시도</th>
                <th className="text-left py-3 px-4 label">물건 · 거래</th>
                <th className="text-left py-3 px-4 label">수집 기간</th>
                <th className="text-right py-3 px-4 label">파싱 건수</th>
                <th className="text-right py-3 px-4 label">DB 저장</th>
                <th className="text-right py-3 px-4 label">소요</th>
                <th className="text-left py-3 px-4 label">결과</th>
              </tr>
            </thead>
            <tbody>
              {현황.최근_기록.map((r) => {
                const 배지 = 상태_배지(r.상태);
                return (
                  <tr key={r.ID} className="border-b hairline">
                    <td className="py-2.5 px-4 num text-[var(--color-ink-2)] font-medium">
                      {시간_표시(r.실행_시각).slice(5, 19)}
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      {시도_이름[r.시도_코드] ?? r.시도_코드}
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <span className="text-[var(--color-ink)]">
                        {물건_이름[r.물건_유형] ?? r.물건_유형}
                      </span>
                      <span className="text-[var(--color-ink-3)] mx-1.5">·</span>
                      <span
                        className={
                          r.거래_유형 === "1"
                            ? "text-[var(--color-up)]"
                            : "text-[var(--color-down)]"
                        }
                      >
                        {거래_이름[r.거래_유형] ?? r.거래_유형}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 num text-[var(--color-ink-2)] font-medium">
                      {청크_요약(r.청크_시작, r.청크_종료)}
                    </td>
                    <td className="py-2.5 px-4 text-right num font-medium">
                      {r.파싱_건수 > 0
                        ? r.파싱_건수.toLocaleString("ko-KR")
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right num font-extrabold">
                      {r.저장_건수 > 0 ? (
                        <span className="text-[var(--color-up)]">
                          +{r.저장_건수.toLocaleString("ko-KR")}
                        </span>
                      ) : (
                        <span className="text-[var(--color-ink-4)]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right num text-[var(--color-ink-3)] font-medium">
                      {소요_요약(r.소요_MS)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold ${배지.색}`}
                      >
                        {배지.라벨}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
