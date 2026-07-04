interface 속성 {
  글자: string;
  크기?: "보통" | "작게";
}

export const 도장 = ({ 글자, 크기 = "보통" }: 속성) => (
  <span className={크기 === "작게" ? "stamp stamp-sm" : "stamp"} aria-hidden>
    {글자}
  </span>
);
