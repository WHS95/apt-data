"use client";

import { useEffect, useState } from "react";

const KEY = "shinhon-favorites";
const EVENT = "shinhon-favorites-changed";

export interface 관심_단지 {
  시도_코드: string;
  시군구_코드: string;
  시군구명: string;
  단지명: string;
  최근_거래가_만원?: number | null;
  메모?: string;
  추가_시각: number;
}

const 안전_로드 = (): 관심_단지[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as 관심_단지[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const 키 = (시군구_코드: string, 단지명: string) => `${시군구_코드}|${단지명}`;

export const use_관심_단지 = () => {
  const [목록, 목록_설정] = useState<관심_단지[]>([]);
  const [초기화됨, 초기화_설정] = useState(false);

  useEffect(() => {
    const 로드 = () => 목록_설정(안전_로드());
    로드();
    초기화_설정(true);
    window.addEventListener(EVENT, 로드);
    window.addEventListener("storage", 로드);
    return () => {
      window.removeEventListener(EVENT, 로드);
      window.removeEventListener("storage", 로드);
    };
  }, []);

  const 저장 = (새목록: 관심_단지[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(새목록));
    window.dispatchEvent(new Event(EVENT));
  };

  const 추가 = (d: Omit<관심_단지, "추가_시각">) => {
    const 현재 = 안전_로드();
    if (현재.some((x) => 키(x.시군구_코드, x.단지명) === 키(d.시군구_코드, d.단지명))) {
      return;
    }
    저장([{ ...d, 추가_시각: Date.now() }, ...현재]);
  };

  const 제거 = (시군구_코드: string, 단지명: string) => {
    const 현재 = 안전_로드();
    저장(현재.filter((x) => 키(x.시군구_코드, x.단지명) !== 키(시군구_코드, 단지명)));
  };

  const 토글 = (d: Omit<관심_단지, "추가_시각">) => {
    const 현재 = 안전_로드();
    if (현재.some((x) => 키(x.시군구_코드, x.단지명) === 키(d.시군구_코드, d.단지명))) {
      제거(d.시군구_코드, d.단지명);
    } else {
      추가(d);
    }
  };

  const 메모_설정 = (시군구_코드: string, 단지명: string, 메모: string) => {
    const 현재 = 안전_로드();
    const 업데이트 = 현재.map((x) =>
      키(x.시군구_코드, x.단지명) === 키(시군구_코드, 단지명)
        ? { ...x, 메모 }
        : x,
    );
    저장(업데이트);
  };

  const 포함 = (시군구_코드: string, 단지명: string): boolean =>
    목록.some((x) => 키(x.시군구_코드, x.단지명) === 키(시군구_코드, 단지명));

  return { 목록, 추가, 제거, 토글, 메모_설정, 포함, 초기화됨 };
};
