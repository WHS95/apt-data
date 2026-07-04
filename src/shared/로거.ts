type 레벨 = "info" | "warn" | "error" | "debug";

const 시간_문자열 = (): string => {
  const d = new Date();
  return d.toISOString();
};

const 출력 = (레벨_입력: 레벨, 메시지: string, 부가?: unknown): void => {
  const 표시 = `[${시간_문자열()}] [${레벨_입력.toUpperCase()}] ${메시지}`;
  if (부가 !== undefined) {
    console[레벨_입력 === "debug" ? "log" : 레벨_입력](표시, 부가);
  } else {
    console[레벨_입력 === "debug" ? "log" : 레벨_입력](표시);
  }
};

export const 로거 = {
  정보: (메시지: string, 부가?: unknown) => 출력("info", 메시지, 부가),
  경고: (메시지: string, 부가?: unknown) => 출력("warn", 메시지, 부가),
  오류: (메시지: string, 부가?: unknown) => 출력("error", 메시지, 부가),
  디버그: (메시지: string, 부가?: unknown) => 출력("debug", 메시지, 부가),
};
