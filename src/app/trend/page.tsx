import { 단지_가격추이_유스케이스 } from "../../application/단지_가격추이_유스케이스";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 단지_라인차트 } from "../../presentation/components/단지_라인차트";
import { 단지_검색_입력 } from "../../presentation/components/단지_검색_입력";

export const dynamic = "force-dynamic";

export default async function 단지추이_페이지({
  searchParams,
}: {
  searchParams: Promise<{ 단지?: string }>;
}) {
  const p = await searchParams;
  const 단지명 = (p.단지 ?? "").trim();

  const 종료 = new Date();
  const 시작 = new Date();
  시작.setFullYear(시작.getFullYear() - 2);

  const 데이터 = 단지명
    ? await new 단지_가격추이_유스케이스()
        .실행({
          단지명,
          계약_시작일: 시작.toISOString().slice(0, 10),
          계약_종료일: 종료.toISOString().slice(0, 10),
        })
        .catch(() => [])
    : [];

  return (
    <>
      <페이지_제목
        번호="03"
        도장_글자="推"
        제목="단지 가격 추이"
        부제="WATCH / 관심 단지"
        설명="단지명을 입력하면 최근 2년 매매·전세 중위 거래가를 동시에 본다. 실선은 매매, 점선은 전세. 두 선이 가까워질수록 갭이 좁아진다."
      />
      <div className="border-y hairline bg-[var(--color-paper-deep)]">
        <div className="mx-auto max-w-[1200px] px-6 py-4">
          <단지_검색_입력 기본값={단지명} />
        </div>
      </div>
      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[18px] font-medium">
            {단지명 || "단지를 입력하세요"}
          </h2>
          <span className="eyebrow">최근 24개월 · 월별 중위값</span>
        </div>
        <단지_라인차트 데이터={데이터} />
        <p className="mt-6 text-[12px] text-[var(--color-ink-2)] max-w-[60ch] leading-relaxed">
          동일 단지명 매칭은 표기 차이에 민감합니다. 검색이 비어 있다면 “래미안”·“푸르지오” 같은
          시리즈명 한 단어부터 시작해 좁혀 보세요.
        </p>
      </section>
    </>
  );
}
