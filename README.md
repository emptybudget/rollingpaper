# 💌 우리들의 롤링페이퍼

로그인 없이 **내 이름을 골라** 나머지 분들께 한 명씩 편지를 남기고,
**월요일 오전 9시(KST)** 에 내 이름을 누르면 나에게 온 메시지를 다 함께 확인하는 웹앱.

- **Framework**: Next.js 14 (App Router)
- **DB**: Upstash Redis (`@upstash/redis`)
- **Deploy**: Vercel

## 동작 방식

### 공개 전 (작성 모드)
1. 메인에서 **내 이름**을 고른다.
2. **나만의 비밀번호(숫자 4자리)** 를 정한다. → 작성 내용 저장 & 이어쓰기용 열쇠.
3. 나를 제외한 나머지 분들에게 **한 명씩 줄글로 작성 → "다음"** 으로 넘어간다.
4. 타이핑을 멈추면 **자동 저장**(중간 저장). 창을 닫아도, 나중에 같은 이름 + 비밀번호로
   다시 들어오면 **이어서** 쓸 수 있다. 전체 명단에서 원하는 사람으로 바로 점프도 가능.

### 공개 후 (읽기 모드)
- 메인에서 **내 이름**을 누르면, 그동안 나에게 도착한 모든 메시지가 피드로 공개된다.

공개 시각은 `utils/date.ts`의 `RELEASE_AT`(기본 `2026-07-13T09:00:00+09:00`)에서 관리하며,
`NEXT_PUBLIC_RELEASE_AT` 환경변수로 덮어쓸 수 있다(테스트용).

## 데이터 구조 (Redis)

- **메시지**: Key `rollingpaper:<수신자id>` 해시, Field `<작성자id>`, Value `{writerId, writer, content, updatedAt}`
  - 작성자당 수신자별로 메시지가 하나 → 다시 저장하면 덮어써져 **수정/이어쓰기**가 자연스럽다.
- **작성자 비밀번호**: Key `writerpw:<작성자id>` (이어쓰기 열쇠)

> 비밀번호는 메시지에 저장하지 않고 별도 키로만 관리하며, 조회 응답에는 절대 포함되지 않는다.

## API

- `POST /api/writer` `{writerId, password}` → 비밀번호 확인/등록 후 내 초안 전체 반환(이어쓰기)
- `POST /api/writer/message` `{writerId, recipientId, content, password}` → 한 명에게 쓴 내용 저장(빈 내용이면 삭제)
- `GET /api/message/[id]` → (공개 후) 그 사람에게 도착한 메시지 전체

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # UPSTASH_REDIS_REST_URL / TOKEN 채우기
npm run dev
```

### 공개 전/후 화면 테스트
`.env.local`에 `NEXT_PUBLIC_RELEASE_AT`을 넣어 시간을 조작한다(변경 후 dev 재시작).

```bash
NEXT_PUBLIC_RELEASE_AT=2030-01-01T09:00:00+09:00   # 공개 전(작성 모드)
NEXT_PUBLIC_RELEASE_AT=2020-01-01T09:00:00+09:00   # 공개 후(읽기 모드)
```

## 배포 (Vercel)

1. Upstash 콘솔에서 Redis DB 생성 → REST URL / TOKEN 복사
2. Vercel 프로젝트 환경변수에 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 추가
3. 배포 🚀

## 명단 수정

`constants/members.ts`의 `MEMBERS` 배열만 고치면 된다. (id는 고유하게 유지)
