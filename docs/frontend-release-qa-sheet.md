# 프론트 배포 QA 시트

## 구현/검증 현황

| 구분 | 상태 | 메모 |
| --- | --- | --- |
| FCM 기본 배선 | 완료 | 로그인 후 권한 요청, 기기 토큰 발급, `/api/notifications/device-tokens` 등록 |
| iOS Push entitlement | 완료 | `aps-environment=development` 적용 |
| Bundle ID 정리 | 완료 | iOS/Android `com.hamddu.app` |
| 마이크 권한 제거 | 완료 | iOS microphone usage 제거, Android `RECORD_AUDIO` blocked |
| Firebase 설정 파일 | 대기 | `GoogleService-Info.plist`, `google-services.json` 필요 |
| APNs Firebase 업로드 | 대기 | Firebase Console 작업 필요 |
| 백엔드 테스트 푸시 | 대기 | 기기 토큰 등록 후 발송 테스트 필요 |

## 자동 검증

| 항목 | 명령 | 결과 |
| --- | --- | --- |
| iOS plist 문법 | `plutil -lint ios/app/Info.plist ios/app/app.entitlements` | 통과 |
| 알림 서비스 타입 | `npx tsc --noEmit ... src/services/api.ts src/services/notifications.ts` | 통과 |
| Expo 설정 로드 | `npx expo config --type public` | 통과 |
| 공백 검사 | `git diff --check` | 통과 |

## 실기기 QA

| ID | 우선순위 | 영역 | 시나리오 | 절차 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-01 | 필수 | 설치/실행 | iPhone 개발 빌드 실행 | USB 연결 후 `npx expo run:ios --device` 실행 | 앱이 실기기에서 정상 실행됨 |  |  |
| QA-02 | 필수 | 로그인 | SNS 로그인 | Google/Naver 로그인 진행 | 로그인 성공 후 홈 또는 설문 화면 진입 |  |  |
| QA-03 | 필수 | 온보딩 | 설문/닉네임 등록 | 신규 계정으로 설문 완료 | 메인 탭 진입, 닉네임 저장 |  |  |
| QA-04 | 필수 | 푸시 | 알림 권한 요청 | 로그인 후 앱 진입 | iOS 알림 권한 팝업 노출 |  | Firebase 파일 필요 |
| QA-05 | 필수 | 푸시 | 기기 토큰 등록 | 알림 허용 후 API 로그 확인 | `/api/notifications/device-tokens` 2xx 응답 |  | 백엔드 로그 확인 필요 |
| QA-06 | 필수 | 푸시 | 테스트 푸시 수신 | 백엔드에서 테스트 푸시 발송 | 잠금/백그라운드 상태에서 알림 수신 |  | APNs 설정 필요 |
| QA-07 | 필수 | 홈 | 기법 맵 탭 전환 | 대바늘/코바늘 탭 전환 | 탭은 고정, 맵만 자연스럽게 스크롤 |  |  |
| QA-08 | 필수 | 홈 | 히어로 스크롤 애니메이션 | 맵 스크롤 다운/업 반복 | 이미지/텍스트가 부드럽게 전환 |  |  |
| QA-09 | 필수 | 영상 | 이어보기 저장 | 영상 시청 후 앱 종료/재진입 | 마지막 시청 위치가 복원됨 |  |  |
| QA-10 | 필수 | 영상 | 완료 조건 | 30초 미만 시청 후 완료 시도 | “영상을 조금만 더 시청해주세요~” 안내 |  |  |
| QA-11 | 필수 | 영상 | 완료 처리 | 30초 이상 시청 후 완료 | 완료 처리 성공, 다음 영상 진행 가능 |  |  |
| QA-12 | 필수 | 영상 | 이미 인증한 영상 | 인증 완료 영상 재진입 | 완료 버튼 미노출 |  |  |
| QA-13 | 필수 | 커뮤니티 | 게시글 작성 | 사진 첨부 후 게시글 등록 | 리스트/상세에 사진 노출 |  |  |
| QA-14 | 필수 | 커뮤니티 | 댓글 작성/삭제 | 상세에서 댓글 작성 후 삭제 | 댓글 목록이 즉시 반영됨 |  |  |
| QA-15 | 필수 | 커뮤니티 | 신고 | 게시글/댓글 신고 | 신고 완료 안내 노출 |  |  |
| QA-16 | 필수 | 마이 | 나의 인증 게시글 | 인증글 있는 계정으로 마이 진입 | 사진 캐러셀/전체보기 정상 노출 |  |  |
| QA-17 | 필수 | 코카운터 | 로컬 저장 | 프로젝트 생성/수정 후 앱 재시작 | 코카운터 상태 유지 |  |  |
| QA-18 | 권장 | 키보드 | 게시글 작성 키보드 | 실제 iPhone에서 제목/본문 입력 | 입력창이 키보드에 가려지지 않음 |  |  |
| QA-19 | 권장 | 키보드 | 댓글 입력 키보드 | 상세 하단 댓글 입력 | 입력창이 안전영역/키보드와 겹치지 않음 |  |  |
| QA-20 | 권장 | 오류 | 네트워크 실패 | 네트워크 끄고 주요 API 진입 | 앱 크래시 없이 실패 안내 |  |  |
| QA-21 | 권장 | 권한 | 사진 권한 거부 | 사진 선택 권한 거부 | 앱 크래시 없이 안내 |  |  |

## 배포 전 남은 외부 의존

- Firebase Console iOS 앱 등록 확인
- APNs `.p8` 키 업로드
- `GoogleService-Info.plist` 전달
- `google-services.json` 전달
- 백엔드 `device-tokens` payload 최종 확정
- 백엔드 테스트 푸시 발송 준비
