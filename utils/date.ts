// 공개(전체 오픈) 목표 시각: 2026년 7월 13일 월요일 오전 9시 (KST, 수료식 다음 날)
// 필요하면 환경변수 RELEASE_AT (ISO 문자열)로 덮어쓸 수 있게 해두어 테스트가 편하다.
export const RELEASE_AT =
  process.env.NEXT_PUBLIC_RELEASE_AT ?? "2026-07-13T09:00:00+09:00";

export function releaseDate(): Date {
  return new Date(RELEASE_AT);
}

export function isReleased(now: Date = new Date()): boolean {
  return now >= releaseDate();
}
