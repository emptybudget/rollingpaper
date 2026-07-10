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
        <p>이름을 눌러 마음을 전해 주세요</p>
      </header>

      <div className="banner">
        {released
          ? "🎉 모든 메시지가 공개되었어요! 이름을 눌러 확인해 보세요."
          : `🔒 ${formatRelease(releaseDate())}에 다 함께 공개돼요`}
      </div>

      <div className="grid">
        {MEMBERS.map((m) => (
          <Link key={m.id} href={`/${m.id}`} className="member-card">
            {m.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
