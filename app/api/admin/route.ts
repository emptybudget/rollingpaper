import { NextResponse } from "next/server";
import { redis, rollingKey, pwKey, getReceived } from "@/lib/redis";
import { MEMBERS, getMember } from "@/constants/members";

export const dynamic = "force-dynamic";

// POST /api/admin  { adminPassword, action, ... }
// action: "list" | "deleteMessage" | "resetPassword"
export async function POST(req: Request) {
  // 기본값 0710. Vercel 등에서 ADMIN_PASSWORD 를 설정하면 그 값으로 바뀐다.
  const admin = process.env.ADMIN_PASSWORD || "0710";

  let body: {
    adminPassword?: string;
    action?: string;
    recipientId?: number;
    writerId?: number;
    personId?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  if (String(body.adminPassword ?? "") !== admin) {
    return NextResponse.json(
      { error: "관리자 비밀번호가 틀렸어요." },
      { status: 403 }
    );
  }

  switch (body.action) {
    case "list": {
      const people = await Promise.all(
        MEMBERS.map(async (m) => {
          const [messages, pw] = await Promise.all([
            getReceived(m.id),
            redis.get(pwKey(m.id)),
          ]);
          return {
            id: m.id,
            name: m.name,
            hasPassword: pw != null,
            messages,
          };
        })
      );
      return NextResponse.json({ ok: true, people });
    }

    case "deleteMessage": {
      const recipientId = Number(body.recipientId);
      const writerId = Number(body.writerId);
      if (!getMember(recipientId) || !getMember(writerId)) {
        return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });
      }
      await redis.hdel(rollingKey(recipientId), String(writerId));
      return NextResponse.json({ ok: true });
    }

    case "resetPassword": {
      const personId = Number(body.personId);
      if (!getMember(personId)) {
        return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });
      }
      await redis.del(pwKey(personId));
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "알 수 없는 동작이에요." }, { status: 400 });
  }
}
