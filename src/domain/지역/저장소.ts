import type { 시도, 시군구, 읍면동 } from "./엔티티";

export interface 지역_저장소 {
  시도_목록_조회(): Promise<시도[]>;
  시군구_목록_조회(시도_코드: string): Promise<시군구[]>;
  읍면동_목록_조회(시군구_코드: string): Promise<읍면동[]>;
  시도_저장(시도_목록: 시도[]): Promise<void>;
  시군구_저장(시군구_목록: 시군구[]): Promise<void>;
}
