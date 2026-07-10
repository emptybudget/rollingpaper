import { NextResponse } from "next/server";
import { checkPassword, getReceived } from "@/lib/redis";
import { getMember } from "@/constants/members";
import { isReleased } from "@/utils/date";

export const dynamic = "force-dynamic";

// POST /api/inbox  { personId, password }
// 공개 후, 본인 비밀번호를 확인한 뒤 자기에게 도착한 메시지를 반환한다.
export async function POST(req: Request) {
  if (!isReleased()) {
    return NextResponse.json(
      { error: "아직 공개 전이에요." },
      { status: 403 }
    );
  }

  let body: { personId?: number; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const personId = Number(body.personId);
  const password = String(body.password ?? "").trim();

  if (!getMember(personId)) {
    return NextResponse.json({ error: "존재하지 않는 이름이에요." }, { status: 404 });
  }
  if (!/^\d{4}$/.test(password)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주세요." },
      { status: 400 }
    );
  }

  if (!(await checkPassword(personId, password))) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않아요." },
      { status: 403 }
    );
  }

  const messages = await getReceived(personId);
  return NextResponse.json({ ok: true, messages });
}
