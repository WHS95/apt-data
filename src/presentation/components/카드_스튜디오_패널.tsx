"use client";

import { useState } from "react";

type 이슈 = { rule: string; level: string; msg: string };
type 결과 = {
  id: string;
  template: string;
  type: string;
  pass: boolean;
  height: number | null;
  png: string | null;
  issues: 이슈[];
};
type 응답 = { ok: boolean; out?: string; results?: 결과[]; error?: string };

type 카드요약 = { id: string; template: string; type: string; headline: string };

export function 카드_스튜디오_패널({ 카드목록 }: { 카드목록: 카드요약[] }) {
  const [결과, set결과] = useState<결과[] | null>(null);
  const [로딩, set로딩] = useState(false);
  const [에러, set에러] = useState<string | null>(null);
  const [ts, setTs] = useState(0);

  async function 빌드(cardsFile: string) {
    set로딩(true);
    set에러(null);
    try {
      const res = await fetch("/admin/cards/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardsFile }),
      });
      const json: 응답 = await res.json();
      if (!json.results) throw new Error(json.error || "빌드 실패");
      set결과(json.results);
      setTs(Date.now());
    } catch (e) {
      set에러(e instanceof Error ? e.message : String(e));
    } finally {
      set로딩(false);
    }
  }

  const 통과 = 결과?.filter((r) => r.pass).length ?? 0;
  const 차단 = 결과?.filter((r) => !r.pass).length ?? 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      {/* 액션 바 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => 빌드("src/studio/cards.json")}
          disabled={로딩}
          className="pill pill-active disabled:opacity-50"
        >
          {로딩 ? "빌드 중…" : "카드 빌드 · 내보내기"}
        </button>
        <button
          onClick={() => 빌드("src/studio/cards.bad.json")}
          disabled={로딩}
          className="pill disabled:opacity-50"
          title="일부러 잘못 만든 카드로 가드레일이 차단하는지 확인"
        >
          가드레일 시연(나쁜 카드)
        </button>
        {결과 && (
          <span className="text-sm text-[color:var(--color-ink-3)]">
            통과 {통과} · <span className="text-[color:var(--color-up)]">차단 {차단}</span> · 검증 숫자는{" "}
            <code>data.json</code>(실거래) 단일 소스
          </span>
        )}
      </div>

      {에러 && (
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[color:var(--color-up)] p-3 text-sm text-[color:var(--color-up)]">
          {에러}
        </pre>
      )}

      {/* 초기 안내(빌드 전): 카드 목록 */}
      {!결과 && (
        <div className="mt-6">
          <p className="text-sm text-[color:var(--color-ink-3)]">
            {카드목록.length}개 카드 스펙(<code>src/studio/cards.json</code>). ‘빌드’를 누르면 실거래 데이터로 렌더하고,
            가드레일(오버플로우·조작·브랜드·정책)을 통과한 카드만 PNG로 내보냅니다.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {카드목록.map((c) => (
              <li key={c.id} className="rounded-lg border hairline px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="pill">{c.template}</span>
                  {c.type === "policy" && <span className="pill">정책</span>}
                  <span className="font-semibold">{c.id}</span>
                </div>
                <div className="mt-1 text-sm text-[color:var(--color-ink-3)]" dangerouslySetInnerHTML={{ __html: c.headline }} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 결과 그리드 */}
      {결과 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {결과.map((r) => (
            <div key={r.id} className="rounded-xl border hairline p-4">
              <div className="flex items-center gap-2">
                <span className={r.pass ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-up)]"}>
                  {r.pass ? "✓" : "✗ 차단"}
                </span>
                <span className="font-semibold">{r.id}</span>
                <span className="pill ml-auto">{r.template}</span>
              </div>

              {r.pass && r.png ? (
                <div className="mt-3">
                  <img
                    src={`/studio/${encodeURIComponent(r.id)}.png?t=${ts}`}
                    alt={r.id}
                    className="w-full rounded-lg border hairline"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[color:var(--color-ink-3)]">높이 {r.height}px</span>
                    <a
                      href={`/studio/${encodeURIComponent(r.id)}.png?t=${ts}`}
                      download={`${r.id}.png`}
                      className="pill pill-active"
                    >
                      PNG 다운로드
                    </a>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 space-y-1">
                  {r.issues.map((i, k) => (
                    <li key={k} className="text-sm text-[color:var(--color-up)]">
                      <b>{i.rule}</b> — {i.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
