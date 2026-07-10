import { NextResponse } from "next/server";
import {
  redis,
  rollingKey,
  StoredMessage,
  PublicMessage,
} from "@/lib/redis";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";

export const dynamic = "force-dynamic";

function parse(value: unknown): StoredMessage | null {
  try {
    const obj =
      typeof value === "string"
        ? (JSON.parse(value) as StoredMessage)
        : (value as StoredMessage);
    if (!obj || typeof obj.content !== "string") return null;
    return obj;
  } catch {
    return null;
  }
}

// GET: 공개 전이면 개수만, 공개 후면 전체 메시지(비밀번호 제외) 반환
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const recipientId = Number(params.id);
  if (!getMember(recipientId)) {
    return NextResponse.json({ error: "존재하지 않는 대상이에요." }, { status: 404 });
  }

  const raw = await redis.hgetall<Record<string, unknown>>(
    rollingKey(recipientId)
  );
  const entries = raw ? Object.entries(raw) : [];

  if (!isReleased()) {
    return NextResponse.json({ released: false, count: entries.length });
  }

  const messages: PublicMessage[] = entries
    .map(([id, value]) => {
      const parsed = parse(value);
      if (!parsed) return null;
      // 비밀번호는 절대 클라이언트로 내려보내지 않는다.
      return {
        id,
        writer: parsed.writer,
        content: parsed.content,
        createdAt: parsed.createdAt ?? 0,
      } satisfies PublicMessage;
    })
    .filter((m): m is PublicMessage => m !== null)
    .sort((a, b) => a.createdAt - b.createdAt);

  return NextResponse.json({ released: true, messages });
}

// DELETE: 비밀번호를 서버에서 대조한 뒤 일치할 때만 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const recipientId = Number(params.id);
  if (!getMember(recipientId)) {
    return NextResponse.json({ error: "존재하지 않는 대상이에요." }, { status: 404 });
  }

  let body: { messageId?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const { messageId, password } = body;
  if (!messageId || !password) {
    return NextResponse.json(
      { error: "삭제할 메시지와 비밀번호가 필요해요." },
      { status: 400 }
    );
  }

  const value = await redis.hget<unknown>(rollingKey(recipientId), messageId);
  const stored = parse(value);
  if (!stored) {
    return NextResponse.json({ error: "메시지를 찾을 수 없어요." }, { status: 404 });
  }

  if (stored.password !== password.trim()) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않아요." },
      { status: 403 }
    );
  }

  await redis.hdel(rollingKey(recipientId), messageId);
  return NextResponse.json({ success: true });
}
