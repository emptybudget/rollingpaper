import { NextResponse } from "next/server";
import { redis, rollingKey, StoredMessage } from "@/lib/redis";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";

export const dynamic = "force-dynamic";

interface Body {
  // 단일 수신자 또는 여러 수신자(일괄 입력)를 모두 지원한다.
  recipientId?: number;
  recipientIds?: number[];
  writer?: string;
  content?: string;
  password?: string;
}

export async function POST(req: Request) {
  // 공개 시각 이후에는 더 이상 새 글을 받지 않는다.
  if (isReleased()) {
    return NextResponse.json(
      { error: "공개가 시작되어 더 이상 작성할 수 없어요." },
      { status: 403 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const writer = body.writer?.trim();
  const content = body.content?.trim();
  const password = body.password?.trim();

  if (!writer || !content || !password) {
    return NextResponse.json(
      { error: "작성자, 내용, 비밀번호를 모두 입력해 주세요." },
      { status: 400 }
    );
  }
  if (content.length > 1000) {
    return NextResponse.json(
      { error: "메시지는 1000자 이내로 작성해 주세요." },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(password)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주세요." },
      { status: 400 }
    );
  }

  const ids = body.recipientIds?.length
    ? body.recipientIds
    : body.recipientId != null
      ? [body.recipientId]
      : [];

  const validIds = ids.filter((id) => getMember(id));
  if (validIds.length === 0) {
    return NextResponse.json(
      { error: "받는 사람을 한 명 이상 선택해 주세요." },
      { status: 400 }
    );
  }

  const now = Date.now();
  await Promise.all(
    validIds.map((id, idx) => {
      const messageId = `${now}-${idx}`;
      const message: StoredMessage = {
        writer,
        content,
        password,
        createdAt: now,
      };
      return redis.hset(rollingKey(id), { [messageId]: JSON.stringify(message) });
    })
  );

  return NextResponse.json({ success: true, count: validIds.length });
}
