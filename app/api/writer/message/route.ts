import { NextResponse } from "next/server";
import { redis, rollingKey, pwKey, StoredMessage } from "@/lib/redis";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";

export const dynamic = "force-dynamic";

// POST /api/writer/message  { writerId, recipientId, content, password }
// 한 명에게 쓴 내용을 저장(자동 중간 저장). 내용이 비면 해당 메시지를 지운다.
export async function POST(req: Request) {
  if (isReleased()) {
    return NextResponse.json(
      { error: "공개가 시작되어 더 이상 작성할 수 없어요." },
      { status: 403 }
    );
  }

  let body: {
    writerId?: number;
    recipientId?: number;
    content?: string;
    password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const writerId = Number(body.writerId);
  const recipientId = Number(body.recipientId);
  const password = String(body.password ?? "").trim();
  const content = String(body.content ?? "");

  const writer = getMember(writerId);
  if (!writer || !getMember(recipientId)) {
    return NextResponse.json({ error: "존재하지 않는 이름이에요." }, { status: 404 });
  }
  if (writerId === recipientId) {
    return NextResponse.json(
      { error: "자기 자신에게는 쓸 수 없어요." },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(password)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주세요." },
      { status: 400 }
    );
  }
  if (content.length > 1000) {
    return NextResponse.json(
      { error: "메시지는 1000자 이내로 작성해 주세요." },
      { status: 400 }
    );
  }

  // 비밀번호 확인(없으면 이 값으로 등록)
  const existing = await redis.get<string | number>(pwKey(writerId));
  if (existing == null) {
    await redis.set(pwKey(writerId), password);
  } else if (String(existing) !== password) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않아요." },
      { status: 403 }
    );
  }

  if (content.trim() === "") {
    await redis.hdel(rollingKey(recipientId), String(writerId));
    return NextResponse.json({ ok: true, cleared: true });
  }

  const message: StoredMessage = {
    writerId,
    writer: writer.name,
    content,
    updatedAt: Date.now(),
  };
  await redis.hset(rollingKey(recipientId), {
    [String(writerId)]: JSON.stringify(message),
  });

  return NextResponse.json({ ok: true });
}
