export const 하단_푸터 = () => (
  <footer className="bg-[var(--color-bg-soft)] border-t hairline mt-20">
    <div className="mx-auto max-w-[1240px] px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] text-[var(--color-ink-3)] leading-relaxed">
      <div>
        <div className="text-[var(--color-ink)] font-bold mb-1.5">출처</div>
        국토교통부 실거래가공개시스템. 신고 정보의 정정·해제로 수치가 바뀔 수 있습니다.
      </div>
      <div>
        <div className="text-[var(--color-ink)] font-bold mb-1.5">고지</div>
        법적 효력 없는 참고 데이터. 의사결정 전 공식 통계와 직접 확인 권장.
      </div>
      <div>
        <div className="text-[var(--color-ink)] font-bold mb-1.5">갱신</div>
        스케줄러가 안전 페이스로 매일 자동 수집. 직전 신고분은 누락될 수 있습니다.
      </div>
    </div>
  </footer>
);
