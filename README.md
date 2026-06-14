# DevClass Frontend

Next.js 14 기반 DevClass P3 프론트엔드입니다. 인프런의 정보 밀도와 탐색 구조를 참고하고 DevClass 전용 다크 레드/오렌지 팔레트로 구성했습니다.

```bash
npm ci
copy .env.example .env.local
npm run dev
npm run build
```

Vercel 환경 변수 `NEXT_PUBLIC_API_URL`에 배포된 백엔드의 `/api` 주소를 등록합니다.
