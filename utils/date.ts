// 작성 마감: 2026년 7월 13일(월) 자정 = 7월 14일 00:00 (KST)
// 공개(열람 시작): 2026년 7월 14일(화) 오전 9시 (KST)
// 필요하면 환경변수로 덮어쓸 수 있게 해두어 테스트가 편하다.
export const WRITE_CLOSE_AT =
  process.env.NEXT_PUBLIC_WRITE_CLOSE_AT ?? "2026-07-14T00:00:00+09:00";
export const RELEASE_AT =
  process.env.NEXT_PUBLIC_RELEASE_AT ?? "2026-07-14T09:00:00+09:00";

export function writeCloseDate(): Date {
  return new Date(WRITE_CLOSE_AT);
}
export function releaseDate(): Date {
  return new Date(RELEASE_AT);
}

// 작성 가능 여부(마감 전인가)
export function isWritingOpen(now: Date = new Date()): boolean {
  return now < writeCloseDate();
}
// 공개(열람) 여부
export function isReleased(now: Date = new Date()): boolean {
  return now >= releaseDate();
}
