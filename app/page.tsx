import Link from "next/link";
import { MEMBERS } from "@/constants/members";
import { isReleased, isWritingOpen } from "@/utils/date";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const released = isReleased();
  const writingOpen = isWritingOpen();

  const banner = released
    ? "🎉 공개됐어요! 내 이름을 누르면 나에게 온 메시지를 볼 수 있어요."
    : writingOpen
      ? "내 이름을 고르면 다른 분들께 편지를 남길 수 있어요. 월요일 자정까지 작성 · 화요일 오전 9시 공개 🔒"
      : "✍️ 작성이 마감됐어요. 화요일 오전 9시에 다 함께 공개돼요 🔒";

  return (
    <main>
      <header className="hero">
        <h1>💌 우리들의 롤링페이퍼</h1>
        <p>{released ? "내 이름을 눌러 확인해 보세요" : "내 이름을 골라주세요"}</p>
      </header>

      <div className="banner">{banner}</div>

      <div className="grid">
        {MEMBERS.map((m) => (
          <Link key={m.id} href={`/${m.id}`} className="member-card">
            {m.name}
          </Link>
        ))}
      </div>

      <footer className="footer">
        <Link href="/admin">관리자</Link>
      </footer>
    </main>
  );
}
