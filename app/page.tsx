import Link from "next/link";
import { MEMBERS } from "@/constants/members";
import { isReleased, releaseDate } from "@/utils/date";

export const dynamic = "force-dynamic";

function formatRelease(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function HomePage() {
  const released = isReleased();

  return (
    <main>
      <header className="hero">
        <h1>💌 우리들의 롤링페이퍼</h1>
        <p>{released ? "내 이름을 눌러 확인해 보세요" : "내 이름을 골라주세요"}</p>
      </header>

      <div className="banner">
        {released
          ? "🎉 공개됐어요! 내 이름을 누르면 나에게 온 메시지를 볼 수 있어요."
          : `내 이름을 고르면 다른 분들께 편지를 남길 수 있어요. ${formatRelease(
              releaseDate()
            )}에 다 함께 공개돼요 🔒`}
      </div>

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
