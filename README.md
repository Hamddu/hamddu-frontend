# 뜨개질 커뮤니티 앱 🧶

React Native + Expo로 만든 뜨개질 커뮤니티 앱입니다.

## 🎯 기술 스택

### 핵심
- **React Native** (0.83.6)
- **Expo SDK** (55)
- **TypeScript**

### 상태 관리
- **Zustand v5** - 가볍고 직관적한 전역 상태 관리

### UI
- **React Native Paper** - Material Design 컴포넌트
- **React Navigation v7** - 화면 이동 (Bottom Tabs)

### 추가 기능
- **expo-dev-client** - 실기기 개발 빌드
- **expo-image-picker** - 사진 선택
- **react-native-svg** - SVG 에셋/맵 UI
- **react-native-webview** - 영상 플레이어

## 🚀 빠른 시작

### 1. 패키지 설치
```bash
cd hamddu-frontend

# npm 사용
npm install

# 또는 Yarn 사용 (추천!)
yarn install
```

### 2. 캐시 클리어 & 실행
```bash
# 캐시 클리어하고 실행 (처음 실행시 필수!)
npx expo start -c

# 또는
yarn start -c
```

### 3. Expo Go로 테스트
1. **스마트폰에 Expo Go 앱 설치** (최신 버전!)
   - iOS: App Store
   - Android: Google Play
2. 터미널에 나오는 **QR 코드 스캔**
   - iOS: 카메라 앱으로 스캔
   - Android: Expo Go 앱 안에서 "Scan QR code"

**⚠️ 중요:** PC/Mac과 스마트폰이 **같은 Wi-Fi**에 연결되어 있어야 합니다!

### Wi-Fi가 다르거나 안 되면?
```bash
# Tunnel 모드로 실행
npx expo start --tunnel
```

## 🍎 iPhone 실기기 실행

네이티브 기능을 확인할 때는 Expo Go 대신 iOS 개발 빌드로 실행합니다.

### 처음 한 번만 필요한 설정
1. iPhone을 USB로 연결하고 `이 컴퓨터를 신뢰`를 허용합니다.
2. Xcode에서 `ios/app.xcworkspace`를 엽니다.
3. `app` target > `Signing & Capabilities`로 이동합니다.
4. `Automatically manage signing`을 체크하고 `Team`을 선택합니다.
5. iPhone에서 `설정 > 개인정보 보호 및 보안 > 개발자 모드`를 켠 뒤 재시동합니다.
6. 앱 설치 후 iPhone에서 `설정 > 일반 > VPN 및 기기 관리`로 이동해 개발자 앱을 신뢰합니다.

### 실행 명령
```bash
npx expo run:ios --device
```

기기 선택 화면이 뜨면 `🔌 iPhone`을 선택합니다.

### 자주 막히는 지점
- `No code signing certificates`: Xcode `Signing & Capabilities`에서 Team을 선택합니다.
- `Developer Mode disabled`: iPhone 개발자 모드를 켭니다.
- `login.keychain` 암호 팝업: Mac 로그인/키체인 암호를 입력하고 `항상 허용`을 누릅니다.
- `profile has not been explicitly trusted`: iPhone `VPN 및 기기 관리`에서 개발자 앱을 신뢰합니다.

## 🔔 FCM / 푸시 알림

로그인 후 앱이 알림 권한을 요청하고, 기기 푸시 토큰을 `POST /api/notifications/device-tokens`로 등록합니다.

### 콘솔/파일 준비
- Firebase project: `hamddu-c5275`
- iOS: Apple Developer에서 APNs `.p8` 키를 발급해 Firebase Console > Cloud Messaging > Apple 앱 구성에 업로드합니다.
- iOS 설정 파일: `GoogleService-Info.plist`를 받으면 `ios/app/Supporting/`에 넣고 네이티브 빌드에 포함합니다.
- Android 설정 파일: `google-services.json`을 받으면 Android 네이티브 폴더 생성 후 `android/app/`에 넣습니다.

### 개발 메모
- 현재 Expo 기본 토큰 등록 배선은 들어가 있습니다.
- iOS의 Firebase FCM 토큰까지 직접 받아야 하면 `@react-native-firebase/app`, `@react-native-firebase/messaging` 추가 후 Firebase 설정 파일을 연결해야 합니다.
- 설정 파일이 바뀐 뒤에는 `npx expo run:ios --device`로 개발 빌드를 다시 설치합니다.

## 📱 주요 기능

### 1. 홈 / 기법 맵
- 대바늘/코바늘 기법 맵
- 영상 튜토리얼 진행 상태 표시
- 스크롤 반응형 히어로 애니메이션

### 2. 영상 튜토리얼
- 영상 시청/이어보기
- 30초 이상 시청 후 완료 처리
- 인증 제출 상태 반영

### 3. 커뮤니티
- 일반 게시글/인증 게시글
- 사진 첨부 게시글 표시
- 게시글/댓글 신고

### 4. 마이 / 코카운터
- 나의 인증 게시글 확인
- 코카운터 로컬 저장

## 📁 프로젝트 구조

```
hamddu-frontend/
├── App.tsx                    # 메인 앱, 네비게이션
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── TutorialVideoScreen.tsx
│   │   ├── CommunityScreen.tsx
│   │   ├── AddPostScreen.tsx
│   │   ├── CounterScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/
│   └── store/
├── assets/
│   ├── home/
│   └── tab-icons/
├── package.json
├── tsconfig.json
└── app.json
```

## 🔧 문제 해결

### "Project is incompatible with Expo Go"
✅ **해결:** Expo Go 앱을 최신 버전으로 업데이트
✅ 또는 `npx expo start -c`로 캐시 클리어

### npm 취약점 경고 (11 vulnerabilities...)
✅ **무시하세요!** 개발 단계에서는 문제 없음
❌ `npm audit fix --force`는 절대 쓰지 마세요 (앱이 안 돌아갈 수 있음)

### 로컬 서버가 안 보여요
✅ PC/Mac과 스마트폰이 같은 Wi-Fi인지 확인
✅ `npx expo start --tunnel` 시도

## 📝 라이센스

MIT
