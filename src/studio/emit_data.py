#!/usr/bin/env python3
"""실거래 CSV → 카드 데이터 JSON 방출 (single source of truth).
카드는 이 JSON의 '키'만 참조한다. 손으로 숫자를 쓰지 않는다.
사용: python3 src/studio/emit_data.py  → src/studio/data.json"""
import csv, io, json, re, statistics as st, sys, os
from collections import defaultdict

CSV = "참고자료/아파트(매매)_실거래가_20260707185724.csv"
OUT = "src/studio/data.json"

def load():
    with open(CSV, encoding="cp949") as f: lines = f.readlines()
    hi = next(i for i, l in enumerate(lines) if l.startswith('"NO"'))
    rows = list(csv.reader(io.StringIO("".join(lines[hi:]))))[1:]
    R = []
    for r in rows:
        if len(r) < 15: continue
        try: area = float(r[6]); amt = int(r[9].replace(",", ""))
        except (ValueError, IndexError): continue
        gu = r[1].split()[1] if len(r[1].split()) > 1 else r[1]
        ym, day = r[7].strip(), r[8].strip()
        date = f"{ym}{day.zfill(2)}" if ym.isdigit() and day.isdigit() else None
        R.append(dict(gu=gu, name=r[5], area=area, amt=amt,
                      yr=int(r[14]) if r[14].isdigit() else None,
                      date=date,
                      해제=len(r) > 16 and r[16].strip() not in ("", "-"),
                      직거래=len(r) > 17 and r[17].strip() == "직거래"))
    return R

def med_eok(v): return round(st.median(v) / 10000, 1)

def main():
    R = load()
    small = [x for x in R if 55 <= x["area"] < 66]   # 24평형
    big   = [x for x in R if 80 <= x["area"] < 90]    # 34평형
    def by_gu(pool, thr=15):
        d = defaultdict(list)
        for x in pool: d[x["gu"]].append(x["amt"])
        return {g: med_eok(v) for g, v in d.items() if len(v) >= thr}
    gu24, gu34 = by_gu(small), by_gu(big)

    # 예산 티어(24평 중위 ≤ cap 인 구)
    budget = {str(c): sorted([g for g, m in gu24.items() if m <= c], key=lambda g: gu24[g])
              for c in (6, 7, 9, 10)}
    # 최저가 단지(24평, 거래 15건+)
    u = defaultdict(list)
    for x in small: u[(x["gu"], x["name"])].append(x["amt"])
    cheapest = [{"name": nm, "gu": g, "median": med_eok(v)}
                for (g, nm), v in u.items() if len(v) >= 15]
    cheapest = sorted(cheapest, key=lambda z: z["median"])[:5]

    # 20평대(전용 49.5~66㎡ ≈ 공급 20평대) 예산밴드별 최신 실거래 단지
    # — 해제·직거래 제외, 기간 내 5건+ 단지만, '가장 최근 실거래일' 순 상위 3곳.
    def 가격_라벨(만원):
        억, 나머지 = 만원 // 10000, 만원 % 10000
        return f"{억}억 {나머지:,}만" if 나머지 else f"{억}억"
    def 날짜_라벨(d):  # "20260628" → "2026.6.28"
        return f"{d[:4]}.{int(d[4:6])}.{int(d[6:8])}"
    p20 = defaultdict(list)
    for x in R:
        if 49.5 <= x["area"] < 66 and x["date"] and not x["해제"] and not x["직거래"]:
            p20[(x["gu"], x["name"])].append(x)
    band20 = {}
    for b in (6, 7, 8):
        후보 = []
        for (g, nm), xs in p20.items():
            if len(xs) < 5: continue
            최신 = max(xs, key=lambda z: z["date"])
            if b * 10000 <= 최신["amt"] < (b + 1) * 10000:
                표시명 = re.sub(r"\(\d+[-\d]*\)$", "", nm).strip()  # 번지 꼬리표 제거
                후보.append({"name": 표시명, "gu": g, "price": 가격_라벨(최신["amt"]),
                             "date": 날짜_라벨(최신["date"]), "n": len(xs),
                             "_d": 최신["date"]})
        후보.sort(key=lambda z: (z["_d"], z["n"]), reverse=True)
        band20[str(b)] = [{k: v for k, v in c.items() if k != "_d"} for c in 후보[:3]]

    data = {
        "meta": {"period": "2025.7–2026.7",
                 "source": "출처: APT DATA · 국토교통부 실거래가(서울 아파트 매매) 2025.7–2026.7",
                 "handle": "@apt.data", "brand": "APT·DATA",
                 "generated_from": os.path.basename(CSV), "rows": len(R)},
        "seoul": {"m24": med_eok([x["amt"] for x in small]),
                  "m34": med_eok([x["amt"] for x in big])},
        "gu24": dict(sorted(gu24.items(), key=lambda z: -z[1])),
        "gu34": dict(sorted(gu34.items(), key=lambda z: -z[1])),
        "budget24": budget,
        "cheapest24": cheapest,
        "band20": band20,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ {OUT} 방출: {len(R)}행 · gu24 {len(gu24)}구 · 최저단지 {cheapest[0]['name']} {cheapest[0]['median']}억")

if __name__ == "__main__":
    main()
