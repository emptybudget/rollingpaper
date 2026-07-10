import { NextResponse } from "next/server";
import { redis, pwKey, getWriterDrafts } from "@/lib/redis";
import { getMember } from "@/constants/members";

export const dynamic = "force-dynamic";

// POST /api/writer  { writerId, password }
// 작성자 "로그인/이어쓰기" 진입점.
// - 비밀번호가 처음이면 그 값으로 등록되고
// - 이미 등록돼 있으면 일치해야 통과한다.
// 통과하면 이 작성자가 지금까지 써 둔 초안(수신자별 내용)을 함께 반환한다.
export async function POST(req: Request) {
  let body: { writerId?: number; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const writerId = Number(body.writerId);
  const password = String(body.password ?? "").trim();

  const member = getMember(writerId);
  if (!member) {
    return NextResponse.json({ error: "존재하지 않는 이름이에요." }, { status: 404 });
  }
  if (!/^\d{4}$/.test(password)) {
    return NextResponse.json(
      { error: "비밀번호는 숫자 4자리로 입력해 주세요." },
      { status: 400 }
    );
  }

  const existing = await redis.get<string | number>(pwKey(writerId));
  if (existing == null) {
    await redis.set(pwKey(writerId), password);
  } else if (String(existing) !== password) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않아요. (처음이라면 새 비밀번호를 정해 주세요)" },
      { status: 403 }
    );
  }

  const drafts = await getWriterDrafts(writerId);
  return NextResponse.json({ ok: true, name: member.name, drafts });
}
