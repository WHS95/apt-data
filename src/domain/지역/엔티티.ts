export interface 시도 {
  코드: string;
  이름: string;
}

export interface 시군구 {
  코드: string;
  이름: string;
  시도_코드: string;
}

export interface 읍면동 {
  코드: string;
  이름: string;
  시군구_코드: string;
}
