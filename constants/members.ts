export interface Member {
  id: number;
  name: string;
}

// 35명 명단 고정. DB에 명단을 넣고 읽어오는 품을 줄이기 위해 상수로 관리한다.
export const MEMBERS: Member[] = [
  { id: 1, name: "지완" },
  { id: 2, name: "은형" },
  { id: 3, name: "정은" },
  { id: 4, name: "단비" },
  { id: 5, name: "리안" },
  { id: 6, name: "세라" },
  { id: 7, name: "석훈" },
  { id: 8, name: "경원" },
  { id: 9, name: "유진" },
  { id: 10, name: "연진" },
  { id: 11, name: "최정민" },
  { id: 12, name: "이정민" },
  { id: 13, name: "이은주" },
  { id: 14, name: "지연" },
  { id: 15, name: "주혁" },
  { id: 16, name: "보라" },
  { id: 17, name: "남영" },
  { id: 18, name: "서해" },
  { id: 19, name: "수빈" },
  { id: 20, name: "예은" },
  { id: 21, name: "현선" },
  { id: 22, name: "지원" },
  { id: 23, name: "유미" },
  { id: 24, name: "지혜" },
  { id: 25, name: "해인" },
  { id: 26, name: "서우" },
  { id: 27, name: "환희" },
  { id: 28, name: "멘토 박지윤" },
  { id: 29, name: "멘토 신현슬" },
  { id: 30, name: "멘토 김태희" },
  { id: 31, name: "멘토 이정호" },
  { id: 32, name: "멘토 방소라" },
  { id: 33, name: "멘토 정호진" },
  { id: 34, name: "스텔라 원장님" },
  { id: 35, name: "이현 원장님" },
];

export function getMember(id: number): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
