import { Redis } from "@upstash/redis";
import { MEMBERS } from "@/constants/members";

// 환경변수 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 을 자동으로 읽는다.
export const redis = Redis.fromEnv();

// 수신자별 메시지 모음: field 는 "작성자 id" → 한 작성자당 한 메시지(덮어쓰기=수정/이어쓰기)
export const rollingKey = (recipientId: number | string) =>
  `rollingpaper:${recipientId}`;

// 작성자별 비밀번호(이어쓰기용 열쇠)
export const pwKey = (writerId: number | string) => `writerpw:${writerId}`;

export interface StoredMessage {
  writerId: number;
  writer: string;
  content: string;
  updatedAt: number;
}

// 클라이언트로 내려줄 때 쓰는 형태(비밀번호는 애초에 메시지에 저장하지 않는다)
export interface PublicMessage {
  writerId: number;
  writer: string;
  content: string;
  updatedAt: number;
}

// 비밀번호 확인: 아직 없으면 이 값으로 등록하고 통과, 있으면 일치해야 통과.
// 작성(이어쓰기)과 공개 후 열람에서 공통으로 쓴다.
export async function checkPassword(
  personId: number,
  password: string
): Promise<boolean> {
  const existing = await redis.get<string | number>(pwKey(personId));
  if (existing == null) {
    await redis.set(pwKey(personId), password);
    return true;
  }
  return String(existing) === password;
}

export function parseMessage(value: unknown): StoredMessage | null {
  if (value == null) return null;
  try {
    const o =
      typeof value === "string"
        ? (JSON.parse(value) as StoredMessage)
        : (value as StoredMessage);
    if (!o || typeof o.content !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

// 한 작성자가 여러 수신자에게 써 둔 초안을 한 번에 모아온다(이어쓰기용).
// 전체 명단 수만큼 hget 을 파이프라인으로 묶어 한 번의 왕복으로 처리.
export async function getWriterDrafts(
  writerId: number
): Promise<Record<number, string>> {
  const ids = MEMBERS.map((m) => m.id);
  const pipe = redis.pipeline();
  ids.forEach((rid) => pipe.hget(rollingKey(rid), String(writerId)));
  const res = (await pipe.exec()) as unknown[];

  const drafts: Record<number, string> = {};
  res.forEach((val, i) => {
    const parsed = parseMessage(val);
    if (parsed && parsed.content.trim() !== "") {
      drafts[ids[i]] = parsed.content;
    }
  });
  return drafts;
}

// 한 사람에게 도착한 메시지 전체(공개 후 열람용).
export async function getReceived(
  recipientId: number
): Promise<PublicMessage[]> {
  const raw = await redis.hgetall<Record<string, unknown>>(
    rollingKey(recipientId)
  );
  const entries = raw ? Object.entries(raw) : [];
  return entries
    .map(([, value]) => {
      const p = parseMessage(value);
      if (!p || p.content.trim() === "") return null;
      return {
        writerId: p.writerId,
        writer: p.writer,
        content: p.content,
        updatedAt: p.updatedAt ?? 0,
      } satisfies PublicMessage;
    })
    .filter((m): m is PublicMessage => m !== null)
    .sort((a, b) => a.updatedAt - b.updatedAt);
}
