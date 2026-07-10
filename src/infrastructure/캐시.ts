import { unstable_cache } from "next/cache";

/**
 * 배치 수집 데이터(초 단위 신선도 불필요) 전용 캐시 래퍼.
 *
 * 모듈 스코프에서 1회 호출해 반환된 함수를 재사용한다 — 넘긴 인자가 캐시 키에 포함되므로
 * 파라미터(필터) 조합별로 결과가 분리 캐시된다. `이름`은 호출부를 구분하는 고정 키.
 * tags:["실거래"] 로 향후 수집 완료 시 revalidateTag 일괄 무효화 여지를 남긴다.
 *
 * 주의: unstable_cache 결과는 Vercel Data Cache 2MB 상한. 상위 N개로 슬라이스된
 * 결과(추천 ≤200행, 지도 25행 등)만 감싼다 — 대용량 원본 행 집합은 감싸지 않는다.
 */
export function 실거래_캐시<A extends unknown[], T>(
  이름: string,
  실행: (...인자: A) => Promise<T>,
  초 = 3600,
): (...인자: A) => Promise<T> {
  return unstable_cache(실행, [이름], { revalidate: 초, tags: ["실거래"] });
}
