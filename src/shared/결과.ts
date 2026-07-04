export type 결과<T, E = Error> =
  | { 성공: true; 값: T }
  | { 성공: false; 오류: E };

export const 성공 = <T>(값: T): 결과<T, never> => ({ 성공: true, 값 });
export const 실패 = <E>(오류: E): 결과<never, E> => ({ 성공: false, 오류 });
