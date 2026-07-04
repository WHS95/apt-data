import iconv from "iconv-lite";
import { 로거 } from "../../shared/로거";

const 기본_URL = "https://rt.molit.go.kr";
const 메인_URL = `${기본_URL}/pt/xls/xls.do?mobileAt=`;
const 시도_URL = `${기본_URL}/data/sido.do`;
const 시군구_URL = `${기본_URL}/data/sgg.do`;
const CSV_URL = `${기본_URL}/pt/xls/ptXlsCSVDown.do`;

const 헤더_기본 = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: 메인_URL,
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: 기본_URL,
};

export interface 다운로드_파라미터 {
  시도_코드: string;
  시군구_코드?: string;
  읍면동_코드?: string;
  물건_유형: string;
  거래_유형: string;
  시작_일자: string;
  종료_일자: string;
}

export class molit_client {
  private 쿠키: string = "";

  async 세션_초기화(): Promise<void> {
    const 응답 = await fetch(메인_URL, {
      method: "GET",
      headers: 헤더_기본,
    });
    this.쿠키 = (응답.headers.get("set-cookie") ?? "")
      .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    로거.정보("MOLIT 세션 초기화 완료");
  }

  private 요청_헤더(): Record<string, string> {
    return this.쿠키 ? { ...헤더_기본, Cookie: this.쿠키 } : 헤더_기본;
  }

  async 시도_목록_조회(): Promise<Array<{ 코드: string; 이름: string }>> {
    const 응답 = await fetch(시도_URL, {
      method: "POST",
      headers: this.요청_헤더(),
    });
    const 데이터 = (await 응답.json()) as Array<{
      signguCode: string;
      ctprvnNm: string;
    }>;
    return 데이터.map((d) => ({ 코드: d.signguCode, 이름: d.ctprvnNm }));
  }

  async 시군구_목록_조회(
    시도_코드: string,
  ): Promise<Array<{ 코드: string; 이름: string; 시도_코드: string }>> {
    const 본문 = new URLSearchParams({ signguCode: 시도_코드.slice(0, 2) });
    const 응답 = await fetch(시군구_URL, {
      method: "POST",
      headers: this.요청_헤더(),
      body: 본문,
    });
    const 데이터 = (await 응답.json()) as Array<{
      signguCode: string;
      signguNm: string;
    }>;
    return 데이터.map((d) => ({
      코드: d.signguCode,
      이름: d.signguNm,
      시도_코드: 시도_코드,
    }));
  }

  async CSV_다운로드(파라미터: 다운로드_파라미터): Promise<string | null> {
    return this.CSV_다운로드_재시도(파라미터, 0);
  }

  private async CSV_다운로드_재시도(
    파라미터: 다운로드_파라미터,
    시도_횟수: number,
  ): Promise<string | null> {
    const 본문 = new URLSearchParams({
      srhThingNo: 파라미터.물건_유형,
      srhDelngSecd: 파라미터.거래_유형,
      srhAddrGbn: "1",
      srhLfstsSecd: "1",
      srhFromDt: 파라미터.시작_일자,
      srhToDt: 파라미터.종료_일자,
      srhSidoCd: 파라미터.시도_코드,
      srhSggCd: 파라미터.시군구_코드 ?? "",
      srhEmdCd: 파라미터.읍면동_코드 ?? "",
      srhHsmpCd: "",
      srhArea: "",
      srhFromAmount: "",
      srhToAmount: "",
      sidoNm: "",
      sggNm: "",
      emdNm: "",
      areaNm: "",
      hsmpNm: "",
      loadNm: "",
      mobileAt: "",
    });

    let 응답: Response;
    try {
      응답 = await fetch(CSV_URL, {
        method: "POST",
        headers: this.요청_헤더(),
        body: 본문,
      });
    } catch (오류) {
      로거.경고(`CSV 요청 네트워크 오류 (시도 ${시도_횟수 + 1})`, 오류);
      if (시도_횟수 >= 3) return null;
      await new Promise((r) => setTimeout(r, 5000 * (시도_횟수 + 1)));
      return this.CSV_다운로드_재시도(파라미터, 시도_횟수 + 1);
    }

    const 컨텐츠_타입 = 응답.headers.get("content-type") ?? "";

    // HTML 응답 = 세션 만료 또는 rate-limit. 세션 재초기화 + 백오프 후 재시도.
    if (컨텐츠_타입.includes("text/html")) {
      if (시도_횟수 >= 3) {
        로거.경고(
          `HTML 응답 지속 (${시도_횟수}회). 데이터 없음으로 판단: ${파라미터.시도_코드}/${파라미터.물건_유형}/${파라미터.거래_유형}`,
        );
        return null;
      }
      const 대기_초 = 10 * (시도_횟수 + 1);
      로거.경고(
        `HTML 응답 — 세션 재초기화 후 ${대기_초}s 대기 (시도 ${시도_횟수 + 1}/3)`,
      );
      await new Promise((r) => setTimeout(r, 대기_초 * 1000));
      await this.세션_초기화();
      return this.CSV_다운로드_재시도(파라미터, 시도_횟수 + 1);
    }

    const 바이트 = new Uint8Array(await 응답.arrayBuffer());
    if (바이트.length < 100) return null;
    return iconv.decode(Buffer.from(바이트), "cp949");
  }
}
