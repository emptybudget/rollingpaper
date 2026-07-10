import Link from "next/link";
import { notFound } from "next/navigation";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";
import RecipientView from "./RecipientView";

export const dynamic = "force-dynamic";

export default function RecipientPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const member = getMember(id);
  if (!member) notFound();

  const released = isReleased();

  return (
    <main>
      <Link href="/" className="back">
        ← 명단으로 돌아가기
      </Link>
      <header className="hero" style={{ paddingTop: 8 }}>
        <h1>{member.name}</h1>
        <p>
          {released
            ? `${member.name}님에게 도착한 메시지예요`
            : "다른 분들께 한 명씩 마음을 남겨보세요"}
        </p>
      </header>

      <RecipientView
        recipientId={member.id}
        recipientName={member.name}
        released={released}
      />
    </main>
  );
}
