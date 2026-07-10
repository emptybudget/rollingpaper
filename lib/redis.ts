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
