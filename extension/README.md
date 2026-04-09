# FocusFlow Blocker — Chrome Extension

집중 모드 중 방해 사이트를 차단하는 Chrome 익스텐션입니다.

## 기능

- **사이트 차단**: 집중 모드 활성화 시 YouTube, Twitter, Reddit 등 설정된 사이트 차단
- **웹앱 연동**: FocusFlow 웹앱 타이머와 자동 동기화 (집중 시작 시 자동 차단 활성화)
- **사이트 관리**: 옵션 페이지에서 차단 사이트 목록 커스터마이징
- **Manifest V3**: Chrome 최신 표준 적용

## 개발 환경 설치

1. Chrome에서 `chrome://extensions` 열기
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램 로드" 클릭
4. 이 `extension/` 폴더 선택

## 웹앱 연동 방식

익스텐션은 FocusFlow 웹앱 페이지에 컨텐츠 스크립트를 주입하여 타이머 상태를 읽습니다. 웹앱은 타이머 상태를 `localStorage`의 `focusflow_timer_state` 키에 저장합니다.

**지원 URL:**
- `http://localhost:3000/*` (개발)
- `https://focusflow.app/*` (프로덕션)
- `https://*.vercel.app/*` (Vercel 배포)

## Chrome Web Store 제출 준비

1. `extension/` 폴더를 ZIP으로 압축
2. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
3. 새 확장 프로그램 제출
4. 128x128 아이콘 이미지 준비 필요

## 파일 구조

```
extension/
├── manifest.json       # Manifest V3 설정
├── background.js       # Service Worker (차단 규칙 관리)
├── content.js          # 웹앱 타이머 상태 읽기
├── popup.html/js/css   # 팝업 UI
├── options.html/js/css # 설정 페이지
├── blocked.html        # 차단 시 표시 페이지
├── rules.json          # 기본 declarativeNetRequest 규칙
└── icons/              # 확장 프로그램 아이콘
```
