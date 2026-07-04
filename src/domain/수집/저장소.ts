import type { 수집_기록, 수집_상태, 수집_설정 } from "./엔티티";

export interface 수집_설정_저장소 {
  설정_조회(): Promise<수집_설정>;
  설정_갱신(부분: Partial<Omit<수집_설정, "키" | "갱신_시각">>): Promise<수집_설정>;
}

export interface 수집_기록_저장소 {
  기록_저장(기록: Omit<수집_기록, "ID" | "실행_시각"> & { ID?: string }): Promise<void>;
  최근_기록_조회(최대: number): Promise<수집_기록[]>;
  상태별_개수(): Promise<Record<수집_상태, number>>;
  완료_청크_목록(): Promise<Set<string>>;
  최근_차단_청크(시간_이내_MS: number): Promise<Set<string>>;
  시도별_누적_저장(): Promise<Array<{ 시도_코드: string; 저장_건수: number }>>;
}
