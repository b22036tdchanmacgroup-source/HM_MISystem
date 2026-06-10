# hanmacMIS 개발 가이드
> Claude(AI)와 함께하는 바이브 코딩 입문자용 가이드

---

## 1. GitHub에서 프로젝트 받기

Claude에게 이렇게 요청하세요.

```
이 GitHub 주소에서 프로젝트 받아서 실행해줘
https://github.com/조직명/hanmacMIS.git
```

Claude가 아래 작업을 대신 처리합니다.
- 프로젝트 다운로드 (`git clone`)
- 패키지 설치 (`npm install`)
- 개발 서버 실행 (`npm run dev`)

---

## 2. 개발 서버 실행

```
개발 서버 켜줘
```

브라우저에서 `http://localhost:5173` 접속
(포트 사용 중이면 자동으로 5174, 5175... 순서로 실행)

직접 실행할 경우:
```powershell
npm run dev
```

---

## 3. 수정 요청

원하는 내용을 말로 설명하면 됩니다.

```
"대시보드 상단에 파란색 '새 프로젝트' 버튼 추가해줘"
"ProjectModal 배경색을 연한 회색(#f5f5f5)으로 바꿔줘"
"npm run dev 켰더니 이런 오류가 났어: [오류 메시지 붙여넣기]"
```

> 구체적으로 말할수록 원하는 결과가 나옵니다.  
> 오류는 메시지를 그대로 복사해서 붙여넣으세요.

---

## 4. 커밋 (변경 내용 저장 & GitHub에 올리기)

```
지금까지 수정한 내용 커밋하고 푸시해줘
```

직접 할 경우:
```powershell
git add .
git commit -m "수정 내용 한 줄 설명"
git push origin main
```

---

## 5. 최신 코드 받기

다른 사람이 올린 변경 내용을 내 컴퓨터에 반영할 때:

```
최신 코드 받아줘
```

직접 할 경우:
```powershell
git pull origin main
```
