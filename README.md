<!-- codex-summary:start -->
# mm.test

An SAP Fiori application.

## 구현 기능 요약

### App 화면

- 역할: 화면 정보 표시와 사용자 입력 처리

### Bill Detail 화면

- 역할: 업무 명령 실행
- 사용자 동작: 이전 화면으로 이동 [onNavBack], 신규 등록 [onCreateInvoice]
- 처리 내용: OData/모델 데이터를 조회해 화면에 바인딩; 목록·상세·등록 화면 사이를 이동; 검색 조건으로 목록을 필터링; 표시 데이터를 정렬; 처리 결과와 오류 메시지를 사용자에게 안내

### Date Setup 화면

- 역할: 조건 입력 및 값 선택, 상세 정보 표시·편집, 업무 명령 실행
- 사용자 동작: Start [onStart]
- 처리 내용: 목록·상세·등록 화면 사이를 이동; 처리 결과와 오류 메시지를 사용자에게 안내

### Invoice Create 화면

- 역할: 목록 조회 및 항목 선택, 조건 입력 및 값 선택, 업무 명령 실행
- 주요 항목: Z000 · 0일 이내(즉시), Z030 · 30일 이내, Z060 · 60일 이내
- 사용자 동작: 메인 화면으로 이동 [onNavMain], 관련 화면으로 이동 [onNavBillDetail], 이전 화면으로 이동 [onNavBack], 상세 정보 열기 [onShowInvoiceProcessFlow], 상세 정보 열기 [onShowMatchIssueDetail], Invoice Footer Action [onInvoiceFooterAction], 선택 항목 삭제 [onDeleteInvoice]
- 처리 내용: OData/모델 데이터를 조회해 화면에 바인딩; 신규 데이터를 생성하고 서버에 저장; 입력값 또는 선택 데이터를 수정; 선택 데이터를 삭제; 목록·상세·등록 화면 사이를 이동; 검색 조건으로 목록을 필터링; 표시 데이터를 정렬; 처리 결과와 오류 메시지를 사용자에게 안내; 팝업/다이얼로그를 열어 추가 입력이나 확인을 처리

### Main 화면

- 역할: 목록 조회 및 항목 선택, 조건 입력 및 값 선택, 업무 명령 실행
- 사용자 동작: 조건 검색 [onResetSearch], 조건 검색 [onSearch], 기능 실행 [onStatusCardPress], 데이터 새로고침 [onRefresh], 기능 실행 [onBillPress]
- 처리 내용: OData/모델 데이터를 조회해 화면에 바인딩; 입력값 또는 선택 데이터를 수정; 목록·상세·등록 화면 사이를 이동; 검색 조건으로 목록을 필터링; 표시 데이터를 정렬; 처리 결과와 오류 메시지를 사용자에게 안내

### Test 화면

- 역할: 화면 정보 표시와 사용자 입력 처리
- 주요 항목: Test view

### Three Way Match 화면

- 역할: 목록 조회 및 항목 선택, 업무 명령 실행
- 사용자 동작: 메인 화면으로 이동 [onNavMain], 관련 화면으로 이동 [onNavBillDetail], 관련 화면으로 이동 [onNavInvoiceCreate], 이전 화면으로 이동 [onNavBack], 상세 정보 열기 [onShowMismatch], 신규 등록 [onProceedRegister]
- 처리 내용: OData/모델 데이터를 조회해 화면에 바인딩; 입력값 또는 선택 데이터를 수정; 목록·상세·등록 화면 사이를 이동; 검색 조건으로 목록을 필터링; 표시 데이터를 정렬; 처리 결과와 오류 메시지를 사용자에게 안내

## 실행 방법

```bash
npm install
npm start
```

<!-- codex-summary:end -->

## 기존 문서

## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Fri May 22 2026 10:10:25 GMT+0900 (Korean Standard Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.19.3|
|**Generation Platform**<br>Visual Studio Code|
|**Template Used**<br>Basic V2|
|**Service Type**<br>SAP System (ABAP On-Premise)|
|**Service URL**<br>http://61.97.134.36:8000/sap/opu/odata/sap/ZGWD1MM0003_SRV|
|**Module Name**<br>mm.test|
|**Application Title**<br>App Title|
|**Namespace**<br>code.t1|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.148.0|
|**Enable Code Assist Libraries**<br>False|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

## mm.test

An SAP Fiori application.

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

- It is also possible to run the application using mock data that reflects the OData Service URL supplied during application generation.  In order to run the application with Mock Data, run the following from the generated app root folder:

```
    npm run start-mock
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)
