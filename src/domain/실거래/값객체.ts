export class 금액 {
  private constructor(public readonly 만원: number) {}

  static 만원_생성(만원: number): 금액 {
    if (!Number.isFinite(만원) || 만원 < 0) {
      throw new Error(`금액은 0 이상의 유한값이어야 합니다: ${만원}`);
    }
    return new 금액(Math.round(만원));
  }

  static 원_생성(원: number): 금액 {
    return 금액.만원_생성(원 / 10000);
  }

  더하기(다른: 금액): 금액 {
    return new 금액(this.만원 + 다른.만원);
  }

  나누기(분모: 금액): number {
    if (분모.만원 === 0) return 0;
    return this.만원 / 분모.만원;
  }

  표시(): string {
    if (this.만원 >= 10000) {
      const 억 = Math.floor(this.만원 / 10000);
      const 천만 = Math.floor((this.만원 % 10000) / 1000);
      return 천만 === 0 ? `${억}억` : `${억}억 ${천만}천`;
    }
    return `${this.만원.toLocaleString("ko-KR")}만`;
  }
}

export class 계약일 {
  private constructor(public readonly ISO: string) {}

  static 생성(년: number, 월: number, 일: number): 계약일 {
    const 표시 = `${년}-${String(월).padStart(2, "0")}-${String(일).padStart(2, "0")}`;
    const 검증 = new Date(표시);
    if (Number.isNaN(검증.getTime())) {
      throw new Error(`유효하지 않은 계약일: ${표시}`);
    }
    return new 계약일(표시);
  }

  static ISO_생성(iso: string): 계약일 {
    return new 계약일(iso.slice(0, 10));
  }

  get 년(): number {
    return Number(this.ISO.slice(0, 4));
  }

  get 월(): number {
    return Number(this.ISO.slice(5, 7));
  }
}

export class 면적 {
  private constructor(public readonly 제곱미터: number) {}

  static 제곱미터_생성(제곱미터: number): 면적 {
    if (제곱미터 <= 0) throw new Error(`면적은 양수여야 합니다: ${제곱미터}`);
    return new 면적(제곱미터);
  }

  get 평(): number {
    return this.제곱미터 / 3.305785;
  }

  표시_평(): string {
    return `${this.평.toFixed(1)}평`;
  }
}
