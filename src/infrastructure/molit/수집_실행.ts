import { 실거래_수집_유스케이스 } from "../../application/실거래_수집_유스케이스";
import { 컨테이너 } from "../di/컨테이너";
import { 로거 } from "../../shared/로거";

interface 파싱_결과 {
  모드: "full" | "incremental";
  년수?: number;
  시도들?: string[];
  물건들?: string[];
  거래들?: string[];
}

const 인수값 = (인수: string[], 키: string): string | undefined => {
  const i = 인수.indexOf(키);
  return i >= 0 ? 인수[i + 1] : undefined;
};

const 인수_파싱 = (): 파싱_결과 => {
  const 인수 = process.argv.slice(2);
  const 모드: "full" | "incremental" =
    인수값(인수, "--mode") === "full" ? "full" : "incremental";
  const 년수_텍스트 = 인수값(인수, "--years");
  const 시도들_텍스트 = 인수값(인수, "--sido");
  const 물건들_텍스트 = 인수값(인수, "--things");
  const 거래들_텍스트 = 인수값(인수, "--delng");
  return {
    모드,
    년수: 년수_텍스트 ? Number(년수_텍스트) : undefined,
    시도들: 시도들_텍스트 ? 시도들_텍스트.split(",") : undefined,
    물건들: 물건들_텍스트 ? 물건들_텍스트.split(",") : undefined,
    거래들: 거래들_텍스트 ? 거래들_텍스트.split(",") : undefined,
  };
};

const 메인 = async () => {
  const { 모드, 년수, 시도들, 물건들, 거래들 } = 인수_파싱();
  로거.정보(`수집 시작: 모드=${모드} 년수=${년수 ?? "-"}`);

  const 시작_일자_강제 = 년수
    ? (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 년수);
        return d.toISOString().slice(0, 10);
      })()
    : undefined;

  const 유스케이스 = new 실거래_수집_유스케이스(
    컨테이너.molit_client,
    컨테이너.지역_저장소,
    컨테이너.실거래_저장소,
  );
  const 결과 = await 유스케이스.실행({
    모드,
    시작_일자_강제,
    대상_시도: 시도들,
    대상_물건: 물건들 as Array<"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H"> | undefined,
    대상_거래: 거래들 as Array<"1" | "2"> | undefined,
  });
  로거.정보(`수집 완료: 총 ${결과.저장_건수}건 저장`);
};

메인().catch((오류) => {
  로거.오류("수집 실패", 오류);
  process.exit(1);
});
