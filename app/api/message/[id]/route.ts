import { NextResponse } from "next/server";
import { redis, rollingKey, parseMessage, PublicMessage } from "@/lib/redis";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";

export const dynamic = "force-dynamic";

// GET /api/message/[id]
// 공개 후에만 사용: 이 사람에게 도착한 모든 메시지를 반환(비밀번호는 애초에 없음).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const recipientId = Number(params.id);
  if (!getMember(recipientId)) {
    return NextResponse.json({ error: "존재하지 않는 대상이에요." }, { status: 404 });
  }

  if (!isReleased()) {
    return NextResponse.json({ released: false });
  }

  const raw = await redis.hgetall<Record<string, unknown>>(
    rollingKey(recipientId)
  );
  const entries = raw ? Object.entries(raw) : [];

  const messages: PublicMessage[] = entries
    .map(([, value]) => {
      const parsed = parseMessage(value);
      if (!parsed || parsed.content.trim() === "") return null;
      return {
        writerId: parsed.writerId,
        writer: parsed.writer,
        content: parsed.content,
        updatedAt: parsed.updatedAt ?? 0,
      } satisfies PublicMessage;
    })
    .filter((m): m is PublicMessage => m !== null)
    .sort((a, b) => a.updatedAt - b.updatedAt);

  return NextResponse.json({ released: true, messages });
}
