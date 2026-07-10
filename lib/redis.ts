import { Redis } from "@upstash/redis";

// 환경변수 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 을 자동으로 읽는다.
export const redis = Redis.fromEnv();

export const rollingKey = (recipientId: number | string) =>
  `rollingpaper:${recipientId}`;

export interface StoredMessage {
  writer: string;
  content: string;
  password: string;
  createdAt: number;
}

// 클라이언트로 내려줄 때는 삭제용 비밀번호를 절대 포함하지 않는다.
export interface PublicMessage {
  id: string;
  writer: string;
  content: string;
  createdAt: number;
}
