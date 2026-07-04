import { molit_client } from "../molit/molit_client";
import { 단지_저장소_PG } from "../persistence/단지_저장소_구현";
import { 실거래_저장소_PG } from "../persistence/실거래_저장소_구현";
import { 지역_저장소_PG } from "../persistence/지역_저장소_구현";
import {
  수집_기록_저장소_PG,
  수집_설정_저장소_PG,
} from "../persistence/수집_저장소_구현";

export const 컨테이너 = {
  molit_client: new molit_client(),
  지역_저장소: new 지역_저장소_PG(),
  단지_저장소: new 단지_저장소_PG(),
  실거래_저장소: new 실거래_저장소_PG(),
  수집_설정_저장소: new 수집_설정_저장소_PG(),
  수집_기록_저장소: new 수집_기록_저장소_PG(),
};

export type 컨테이너_타입 = typeof 컨테이너;
