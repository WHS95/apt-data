"use client";

import { useEffect, useState } from "react";

const KEY = "shinhon-budget";
const EVENT = "shinhon-budget-changed";

const 안전_로드 = (): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } catch {
    return null;
  }
};

export const use_예산 = () => {
  const [내_예산_만원, 예산_상태_설정] = useState<number | null>(null);
  const [초기화됨, 초기화_설정] = useState(false);

  useEffect(() => {
    const 로드 = () => 예산_상태_설정(안전_로드());
    로드();
    초기화_설정(true);
    window.addEventListener(EVENT, 로드);
    window.addEventListener("storage", 로드);
    return () => {
      window.removeEventListener(EVENT, 로드);
      window.removeEventListener("storage", 로드);
    };
  }, []);

  const 예산_설정 = (만원: number) => {
    if (typeof window === "undefined") return;
    if (!Number.isFinite(만원) || 만원 <= 0) return;
    localStorage.setItem(KEY, String(Math.round(만원)));
    window.dispatchEvent(new Event(EVENT));
  };

  const 예산_해제 = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  };

  return { 내_예산_만원, 예산_설정, 예산_해제, 초기화됨 };
};
