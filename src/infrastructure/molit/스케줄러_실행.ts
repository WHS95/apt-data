import { 연속_수집_유스케이스 } from "../../application/연속_수집_유스케이스";
import { molit_client } from "./molit_client";
import { 지역_저장소_PG } from "../persistence/지역_저장소_구현";
import { 실거래_저장소_PG } from "../persistence/실거래_저장소_구현";
import {
  수집_기록_저장소_PG,
  수집_설정_저장소_PG,
} from "../persistence/수집_저장소_구현";
import { 로거 } from "../../shared/로거";

const 메인 = async () => {
  const 유스케이스 = new 연속_수집_유스케이스(
    new molit_client(),
    new 지역_저장소_PG(),
    new 실거래_저장소_PG(),
    new 수집_설정_저장소_PG(),
    new 수집_기록_저장소_PG(),
  );
  await 유스케이스.워커_시작();
};

메인().catch((e) => {
  로거.오류("스케줄러 치명적 오류", e);
  process.exit(1);
});

// 종료 시그널 그레이스풀 처리
process.on("SIGINT", () => {
  로거.정보("SIGINT 수신, 종료");
  process.exit(0);
});
process.on("SIGTERM", () => {
  로거.정보("SIGTERM 수신, 종료");
  process.exit(0);
});
