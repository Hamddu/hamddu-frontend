# [백엔드 요청] 모바일 앱 로그인 자동 풀림 — refresh 토큰 body 방식 지원

## 요약
- 모바일 앱(React Native)이 OAuth 로그인 후 access token 만료 때마다 로그아웃됨.
- `/auth/refresh`가 refresh 토큰을 쿠키로만 받는데, 앱은 그 쿠키를 가질 수 없어서임.
- 웹/어드민은 그대로 두고, 모바일용으로 "body에 refresh 토큰 전달" 경로만 추가하면 됨.

## 원인 (코드·API 문서 모두 확인됨)
- 앱 OAuth 로그인은 `ASWebAuthenticationSession`(인앱 브라우저)으로 진행됨.
- 서버가 내려주는 `refresh_token` HttpOnly 쿠키는 그 브라우저 세션 저장소에만 저장됨.
- 이 저장소는 앱 네이티브 HTTP 클라이언트(axios) 쿠키 저장소와 분리돼 있음.
- 따라서 앱이 `POST /auth/refresh` 호출 시 쿠키가 안 실려감 → 항상 401 → 앱 로그아웃 처리됨.
- `docs/api/01-auth.md`에도 "HttpOnly 쿠키를 못 읽는 네이티브 모바일 앱에는 한계"라고 명시돼 있음.

## 수정 대상
- `src/auth/auth.controller.ts` 3곳.
- `Body`는 이미 import 돼 있음.

### ① OAuth redirect에 refresh_token 추가 — `finishOAuthLogin`
```ts
// 기존
res.redirect(
  `${frontendUrl}/auth/success?access_token=${accessToken}&survey_required=${surveyRequired}`,
);

// 변경 (refresh_token 파라미터 추가. 위의 res.cookie(...)는 그대로 유지)
res.redirect(
  `${frontendUrl}/auth/success?access_token=${accessToken}&refresh_token=${refreshToken}&survey_required=${surveyRequired}`,
);
```

### ② `POST /auth/refresh` — 쿠키 없으면 body에서 읽고, 모바일엔 회전된 토큰을 body로도 반환
```ts
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Body() body: { refreshToken?: string } = {},
): Promise<{ accessToken: string; refreshToken?: string }> {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const oldToken = cookieToken ?? body?.refreshToken;   // 웹=쿠키, 모바일=body
  if (!oldToken) throw new UnauthorizedException('No refresh token');

  const { accessToken, refreshToken } = await this.authService.refreshTokens(oldToken);
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions(this.config));

  // 쿠키를 못 쓰는 모바일 클라이언트에만 회전된 refresh 토큰을 body로 반환
  // (웹은 httpOnly 유지를 위해 body로 안 내려줌)
  return cookieToken ? { accessToken } : { accessToken, refreshToken };
}
```
- ⚠️ 이 서버는 refresh 토큰 회전 + 재사용 감지를 함.
- 따라서 모바일이 매번 새 refresh 토큰을 받아 저장하도록 body 반환이 필수임.
- 반환 안 하면 다음 갱신에서 재사용 감지로 또 튕김.

### ③ `POST /auth/logout` — body fallback 추가
```ts
async logout(
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Body() body: { refreshToken?: string } = {},
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME] ?? body?.refreshToken;
  if (token) await this.authService.logout(token);
  res.clearCookie(COOKIE_NAME, { path: '/' });
}
```

## 앱(프론트)이 맞춰 보내는 계약
- `POST /auth/refresh`, `POST /auth/logout` 호출 시 body에 `{ "refreshToken": "..." }` 전달함.
- OAuth 성공 redirect에서 `refresh_token` 파라미터를 읽어 저장 후 위 호출에 사용함.

## 하위 호환
- 웹/어드민은 쿠키가 있으므로 기존과 동일하게 동작함 (body 반환도 안 함 → httpOnly 유지).
- 모바일만 body 경로로 동작함.

## 배포 후
- `docs/api/01-auth.md`에 "모바일 클라이언트는 refresh 토큰을 body로 전달/수신" 계약 반영 필요함.

---
_기준 커밋: origin/main `38fa26e`. 위 auth 파일들은 최신 원격과 동일함을 확인함._
