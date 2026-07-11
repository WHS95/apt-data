import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { 페이지_제목 } from "../../../presentation/components/페이지_제목";
import { 카드_스튜디오_패널 } from "../../../presentation/components/카드_스튜디오_패널";
import { redirect } from "next/navigation";
import { 관리자_인증됨 } from "../../../infrastructure/관리자_인증";

export const dynamic = "force-dynamic";

type 스펙 = { id: string; template: string; type?: string; headlineTpl?: string };

export default async function 카드_스튜디오_페이지() {
  if (!(await 관리자_인증됨())) redirect("/admin/login");
  const specs = JSON.parse(
    readFileSync(join(process.cwd(), "src/studio/cards.json"), "utf8"),
  ) as 스펙[];
  const 카드목록 = specs.map((s) => ({
    id: s.id,
    template: s.template,
    type: s.type ?? "data",
    headline: (s.headlineTpl ?? "").replace(/<br\s*\/?>/g, " "),
  }));

  return (
    <>
      <페이지_제목
        제목="카드 스튜디오"
        부제="ADMIN · 인스타 카드뉴스"
        설명="실거래 데이터로 카드뉴스를 렌더하고 PNG로 내보냅니다. 가드레일(오버플로우·숫자/서술 조작·브랜드·정책)을 통과한 카드만 나갑니다."
      />
      <div className="border-b hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center gap-2">
          <Link href="/admin" className="pill">현황 / 설정</Link>
          <Link href="/admin/raw" className="pill">로우 데이터</Link>
          <Link href="/admin/cards" className="pill pill-active">카드 스튜디오</Link>
        </div>
      </div>
      <카드_스튜디오_패널 카드목록={카드목록} />
    </>
  );
}
