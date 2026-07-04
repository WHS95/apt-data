import Link from "next/link";
import { 관리자_현황_유스케이스 } from "../../application/관리자_현황_유스케이스";
import { 컨테이너 } from "../../infrastructure/di/컨테이너";
import { 페이지_제목 } from "../../presentation/components/페이지_제목";
import { 관리자_상태패널 } from "../../presentation/components/관리자_상태패널";

export const dynamic = "force-dynamic";

export default async function 관리자_페이지() {
  const 유스 = new 관리자_현황_유스케이스(
    컨테이너.실거래_저장소,
    컨테이너.지역_저장소,
    컨테이너.수집_설정_저장소,
    컨테이너.수집_기록_저장소,
  );
  const 현황 = await 유스.실행();

  return (
    <>
      <페이지_제목
        제목="관리자"
        부제="ADMIN · 스케줄러 운영"
        설명="수집 스케줄러의 페이스를 조정하고 진행 상황을 관찰합니다. 기본값은 MOLIT의 rate-limit에 걸리지 않는 보수적 값입니다."
      />
      <div className="border-b hairline">
        <div className="mx-auto max-w-[1200px] px-6 py-3 flex items-center gap-2">
          <Link href="/admin" className="pill pill-active">현황 / 설정</Link>
          <Link href="/admin/raw" className="pill">로우 데이터</Link>
        </div>
      </div>
      <관리자_상태패널 초기_현황={현황} />
    </>
  );
}
