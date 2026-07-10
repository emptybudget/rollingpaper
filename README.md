# 💌 우리들의 롤링페이퍼

로그인 없이 이름만 눌러 마음을 남기고, **월요일 오전 9시(KST)** 에 다 함께 전체 공개로 확인하는 초간단 롤링페이퍼 웹앱.

- **Framework**: Next.js 14 (App Router)
- **DB**: Upstash Redis (`@upstash/redis`)
- **Deploy**: Vercel

## 동작 방식

- **공개 전**: 대상별 페이지에서 메시지를 작성. 내용은 숨기고 **도착한 개수만** 표시(`🔥 12`).
- **공개 후**: 작성 폼이 닫히고, 쌓인 메시지가 피드로 전체 공개. 작성 시 입력한 **4자리 비밀번호**로 본인 글 삭제 가능.
- **일괄 입력**: 작성 페이지의 "여러 명에게 한 번에" 탭에서 전체 선택 후 본인 이름만 체크 해제하고 한 번에 전송.

공개 시각은 `utils/date.ts`의 `RELEASE_AT` (기본 `2026-07-13T09:00:00+09:00`)에서 관리하며, `NEXT_PUBLIC_RELEASE_AT` 환경변수로 덮어쓸 수 있음.

## 데이터 구조 (Redis Hash)

- **Key**: `rollingpaper:<recipientId>` (예: `rollingpaper:1` → 지완)
- **Field**: `<timestamp>-<idx>` (자동 생성 메시지 ID)
- **Value**: `{"writer","content","password","createdAt"}` (JSON)

> 비밀번호는 저장에만 쓰이며, 조회 API 응답에는 **절대 포함되지 않음**. 삭제는 서버에서 비밀번호를 대조한 뒤에만 수행.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # UPSTASH_REDIS_REST_URL / TOKEN 채우기
npm run dev
```

## 배포 (Vercel)

1. Upstash 콘솔에서 Redis DB 생성 → REST URL / TOKEN 복사
2. Vercel 프로젝트 환경변수에 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 추가
3. 배포 끝 🚀

## 명단 수정

`constants/members.ts`의 `MEMBERS` 배열만 고치면 됨. (id는 고유하게 유지)
