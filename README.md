# 뜨개질 커뮤니티 앱 🧶

React Native + Expo로 만든 뜨개질 커뮤니티 테스트 프로젝트입니다.

## 🎯 기술 스택

### 핵심
- **React Native** (0.76.5)
- **Expo SDK** (52 - Expo Go 54 호환 ✅)
- **TypeScript**

### 상태 관리
- **Zustand v5** - 가볍고 직관적한 전역 상태 관리

### UI
- **React Native Paper** - Material Design 컴포넌트
- **React Navigation v7** - 화면 이동 (Bottom Tabs)

### 추가 기능
- **expo-image-picker** - 사진 선택/촬영
- **@expo/vector-icons** - 아이콘

## 🚀 빠른 시작

### 1. 패키지 설치
```bash
cd knitting-community

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

## 📱 주요 기능

### 1. 홈 화면 (피드)
- 작품 목록 보기
- 좋아요 기능
- 댓글/공유 버튼 (UI만)

### 2. 작품 등록
- 사진 선택
- 제목, 설명, 작성자 입력
- Zustand로 전역 상태 관리

### 3. 프로필
- 사용자 정보
- 통계 (작품 수, 좋아요 수, 팔로워)
- 내 작품 목록
- 설정 메뉴 (UI만)

## 📁 프로젝트 구조

```
knitting-community/
├── App.tsx                    # 메인 앱, 네비게이션
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── AddPostScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── store/
│       └── postStore.ts       # Zustand 스토어
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

## 🎨 다음 단계

### 백엔드 연동
- **Firebase** - 간단하고 빠름
- **Supabase** - 오픈소스 Firebase 대안
- **Node.js + Express** - 직접 구축

### 추가 기능
- 로그인/회원가입
- 댓글 시스템
- 검색 기능
- 푸시 알림

## 💡 참고사항

- 현재는 로컬 상태(Zustand)로만 작동
- 샘플 데이터는 앱 재시작시 초기화
- 실제 이미지 업로드는 백엔드 연동 필요

## 📝 라이센스

MIT
