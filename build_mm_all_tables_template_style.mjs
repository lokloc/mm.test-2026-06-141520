import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const extraRaw = String.raw`
ZTD1MM0011 구매오더 헤더
MANDT	MANDT	CLNT	3	0	0	Client
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
ZTERM	ZED1_FI_ZTERM	CHAR	4	0	0	[FI] 지급조건 
BEDAT	ZED1_MM_BEDAT	DATS	8	0	0	[MM] 문서 일자
INCO1	ZED1_MM_INCO1	CHAR	3	0	0	[MM] 인코텀즈 
FGGZU	ZED1_MM_FGGZU	CHAR	10	0	0	[MM] 승인상태
ZDELIVERY_ES	ZED1_MM_DELIES	DATS	8	0	0	[MM] 납기 예상일 
CONTRACT_ID	ZED1_MM_CONTRACT_ID	CHAR	10	0	0	[MM] 계약 ID
CONTRACT_TY	ZED1_MM_CONTRACT_TY	CHAR	1	0	0	[MM] 거래유형
PLAN_ID	ZED1_MM_PLANID	CHAR	10	0	0	[MM] 스케줄링 ID
UKURS	ZED1_FI_UKURS	DEC	9	5	0	[FI] 환율 값 
TCURR	ZED1_FI_TCURR	CUKY	5	0	0	[FI] Target 통화

ZTD1MM0012 구매오더 아이템
MANDT	MANDT	CLNT	3	0	0	Client
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
EBELP	ZED1_MM_EBELP	NUMC	5	0	0	[MM] 품목번호
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
MENGE	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
NETPR	ZED1_MM_NETPR	CURR	23	2	0	[MM] 개당 가격 
PEINH	ZED1_MM_PEINH	DEC	5	0	0	[MM] 가격 단위
MWSKZ	ZED1_FI_MWSKZ	CHAR	2	0	0	[FI] 세금코드
BANFN	ZED1_MM_BNFPO	CHAR	10	0	0	[MM] Purchase Requisition
TAX_PRICE	ZED1_MM_TAXPRI	CURR	23	2	0	[MM] 세금 가격 
PURE_PRICE	ZED1_MM_PPRI	CURR	23	2	0	[MM] 순금액 
TOTAL_PRICE	ZED1_MM_TPRI	CURR	23	2	0	[MM] 총 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
LFDAT	ZED1_MM_LFDAT	DATS	8	0	0	[MM] 요구 납기일 
DSTAT	ZED1_MM_DSTAT	CHAR	10	0	0	[MM] 배송 상태
CONTRACT_ITEM	ZED1_MM_CITEM	NUMC	5	0	0	[MM] 계약 품목번호
PLAN_MONTH	ZED1_MM_PMONTH	NUMC	2	0	0	[MM] 계획 월 
DEP_DATE	ZED1_MM_DEDAT	DATS	8	0	0	[MM] 선박 출발일 
ARR_DATE	ZED1_MM_ARDAT	DATS	8	0	0	[MM] 선박 도착일 

ZTD1MM0013 Loss 이력
MANDT	MANDT	CLNT	3	0	0	Client
LOSS_ID	ZED1_MM_LOSS_ID	CHAR	10	0	0	[MM] Loss 번호
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
CHARG	ZED1_MM_BATCH	CHAR	10	0	0	[MM] 품질관리 번호
MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
LGORT	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
LGORT_TO	ZED1_MM_LGORTTO	CHAR	4	0	0	[MM] 도착 저장위치 
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
LOSS_QTY	ZED1_MM_LOSS_QTY	QUAN	15	3	0	[MM] Loss 수량
LOSS_RATE	ZED1_MM_LOSS_RATE	DEC	5	2	0	[MM] Loss율(%)
ZMEAS_DATE	ZED1_MM_ZMEAS_DATE	DATS	8	0	0	[MM] 측정일자
LOSS_REASON	ZED1_MM_LOSS_REASON	CHAR	2	0	0	[MM] 손실사유

ZTD1MM0014 자재문서 Header
MANDT	MANDT	CLNT	3	0	0	Client
MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
DOC_TYPE	ZED1_MM_DOC_TYPE	CHAR	2	0	0	[MM] 문서유형
BUKRS	ZED1_CM_BUKRS	CHAR	4	0	0	[CM] 회사코드
BUDAT	ZED1_MM_BUDAT	DATS	8	0	0	[MM] 전기일 
BLDAT	ZED1_MM_BLDAT	DATS	8	0	0	[MM] 증빙일 
REF_MBLNR	ZED1_MM_REF_MBLNR	CHAR	10	0	0	[MM] 참조 자재문서번호
REF_MJAHR	ZED1_MM_REF_MJAHR	NUMC	4	0	0	[MM] 참조 자재문서연도
REVAL_TARGET_YN	ZED1_MM_REVAL_TARGET_YN	CHAR	1	0	0	[MM] 재평가 대상 여부

ZTD1MM0015 자재문서 Item
MANDT	MANDT	CLNT	3	0	0	Client
MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
BWART	ZED1_MM_BWART	CHAR	3	0	0	[MM] 이동유형
MOVE_CATEGORY	ZED1_MM_MOVE_CATEGORY	CHAR	10	0	0	[MM] 이동 세부구분
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
CHARG	ZED1_MM_BATCH	CHAR	10	0	0	[MM] 품질관리 번호
SHKZG	ZED1_CM_SHKZG	CHAR	1	0	0	[CM] 차/대변 (Debit/Credit Indicator)
MENGE	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
WRBTR	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
REVAL_TARGET_YN	ZED1_MM_REVAL_TARGET_YN	CHAR	1	0	0	[MM] 재평가 대상 여부
REVAL_MBLNR	ZED1_MM_REVAL_MBLNR	CHAR	10	0	0	[MM] 재평가 자재문서번호
REVAL_MJAHR	ZED1_MM_REVAL_MJAHR	NUMC	4	0	0	[MM] 재평가 자재문서연도
REVAL_ZEILE	ZED1_MM_REVAL_ZEILE	NUMC	5	0	0	[MM] 재평가 자재문서 항목
REF_MBLNR	ZED1_MM_REF_MBLNR	CHAR	10	0	0	[MM] 참조 자재문서번호
REF_MJAHR	ZED1_MM_REF_MJAHR	NUMC	4	0	0	[MM] 참조 자재문서연도
REF_ZEILE	ZED1_MM_REF_ZEILE	NUMC	5	0	0	[MM] 참조 자재문서 항목
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
EBELP	ZED1_MM_EBELP	NUMC	5	0	0	[MM] 품목번호
GICOD	ZED1_SD_GICOD	CHAR	10	0	0	[SD] 출고오더ID
POSNR_D	ZED1_SD_POSNRD	NUMC	6	0	0	[SD] 출고오더 품목번호
ORDER_NO	ZED1_PP_ORDNO	CHAR	10	0	0	[PP] 오더번호
CONF_NO	ZED1_PP_CONFNO	CHAR	10	0	0	[PP] 확인번호

ZTD1MM0016 구매정보레코드
MANDT	MANDT	CLNT	3	0	0	Client
PIR_ID	ZED1_MM_PIRID	CHAR	10	0	0	[MM] 구매정보레코드 ID
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호

ZTD1MM0017 구매정보레코드 조건 테이블
MANDT	MANDT	CLNT	3	0	0	Client
PIR_ID	ZED1_MM_PIRID	CHAR	10	0	0	[MM] 구매정보레코드 ID
CONDITION_ID	ZED1_MM_CONID	NUMC	5	0	0	[MM] 컨디션 ID
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
VALID_FROM	ZED1_MM_VAFR	DATS	8	0	0	[MM] 유효시작일 
VALID_TO	ZED1_MM_VATO	DATS	8	0	0	[MM] 유효종료일 
INCO1	ZED1_MM_INCO1	CHAR	3	0	0	[MM] 인코텀즈 
QUANTITY	ZED1_MM_QUANP	QUAN	24	3	0	[MM] 연 공급 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
PRICE	ZED1_MM_PRICE	CURR	23	2	0	[MM] 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
PLIFZ	ZED1_MM_PLIFZ	DEC	3	0	0	[MM] 리드타임 
MIN_ORD	ZED1_MM_MQTY	QUAN	24	3	0	[MM] 최소 주문 수량
TRANS_TYPE	ZED1_MM_TRANS_TYPE	CHAR	10	0	0	[MM] 운송방식

ZTD1MM0018  품질관리
MANDT	MANDT	CLNT	3	0	0	Client
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
BATCH_ID	ZED1_MM_BATCH	CHAR	10	0	0	[MM] 품질관리 번호
ACT_API	ZED1_MM_API_G	DEC	5	2	0	[MM] API GRAVITY
ACT_SULF	ZED1_MM_SULF_C	DEC	5	3	0	[MM] Sulfur Content
ACT_FLSH	ZED1_PP_FLASH	QUAN	5	1	0	[PP] 인화점 
ACT_OCTN	ZED1_PP_OCTN	QUAN	5	1	0	[PP] 옥탄가
ACT_CETN	ZED1_PP_CETN	QUAN	5	1	0	[PP] 세탄가
ACT_VISC	ZED1_PP_VISC	QUAN	4	1	0	[PP] 동점도 
ACT_PURITY	ZED1_PP_PURITY	QUAN	4	1	0	[PP] 순도
ACT_MOIST	ZED1_PP_MOIST	QUAN	4	1	0	[PP] 수분
BATCH_DATE	ZED1_MM_BDATE	DATS	8	0	0	[MM] 품질검사 날짜
BATCH_STATUS	ZED1_MM_BSTAT	CHAR	4	0	0	[MM] 품질 상태
SOURCE_TYPE	ZED1_MM_STYPE	CHAR	4	0	0	[MM] 품질 프로세스 유형
LAST_BATCH_ID	ZED1_MM_BATCH	CHAR	10	0	0	[MM] 품질관리 번호
PO_NUM	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
PP_NUM	ZED1_PP_ORDNO	CHAR	10	0	0	[PP] 오더번호

ZTD1MM0023 탱크 넘버링 분류 및 노드 구성
MANDT	MANDT	CLNT	3	0	0	Client
NODE_ID	ZED1_CM_NODEID	CHAR	4	0	0	[CM] 노드코드
TANKT	ZED1_MM_TANKT	CHAR	10	0	0	[MM] 탱크 분류
TANKT_TEXT	ZED1_MM_TANKTXT	CHAR	30	0	0	[MM] 탱크 분류 설명
TANK_MIN	ZED1_MM_TANKMIN	CHAR	4	0	0	[MM] 탱크 분류 별 시작 넘버링 
TANK_MAX	ZED1_MM_TANKMAX	CHAR	4	0	0	[MM] 탱크 분류 별 종료 번호
MTART	ZED1_MM_MTART	CHAR	4	0	0	[MM] 자재유형

ZTD1MM0024 탱크 분류 별 상태 관리
MANDT	MANDT	CLNT	3	0	0	Client
NODE_ID	ZED1_CM_NODEID	CHAR	4	0	0	[CM] 노드코드
TANKT	ZED1_MM_TANKT	CHAR	10	0	0	[MM] 탱크 분류
STAT_CODE	ZED1_MM_STATC	CHAR	4	0	0	[MM] 탱크 분류 별 상태 코드
STAT_TEXT	ZED1_MM_STATXT	CHAR	10	0	0	[MM] 탱크 분류 별 상태 설명

ZTD1MM0025 자재에 대한 플랜트 데이터
MANDT	MANDT	CLNT	3	0	0	Client
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
MINBE	ZED1_MM_MINBE	QUAN	24	3	0	[MM] 재주문점
MABST	ZED1_MM_MABST	QUAN	24	3	0	[MM] 최대 재고
EISBE	ZED1_MM_EISBE	QUAN	24	3	0	[MM] 안전재고
PROCB	ZED1_MM_PROCB	CHAR	1	0	0	[MM] 발주 금지
PLIFZ	ZED1_MM_PLIFZ	DEC	3	0	0	[MM] 리드타임 
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위

ZTD1MM0026 스케줄링 헤더 (연간 구매계획)
MANDT	MANDT	CLNT	3	0	0	Client
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
PLAN_ID	ZED1_MM_PLANID	CHAR	10	0	0	[MM] 스케줄링 ID
PLAN_YEAR	ZED1_MM_PYEAR	NUMC	4	0	0	[MM] 계획 연도
START_DATE	ZED1_MM_SDATE	DATS	8	0	0	[MM] 시작일자
END_DATE	ZED1_MM_EDATE	DATS	8	0	0	[MM] 종료 일자
TOTAL_PLAN_QTY	ZED1_MM_TPQTY	QUAN	24	3	0	[MM] 총 계획 유량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
PLAN_TEXT	ZED1_MM_PTEXT	CHAR	30	0	0	[MM] 계획 설명

ZTD1MM0027 스케줄링 아이템 (계획 라인)
MANDT	MANDT	CLNT	3	0	0	Client
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
PLAN_ID	ZED1_MM_PLANID	CHAR	10	0	0	[MM] 스케줄링 ID
PLAN_MONTH	ZED1_MM_PMONTH	NUMC	2	0	0	[MM] 계획 월 
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
PLAN_QTY	ZED1_MM_PQTY	QUAN	24	3	0	[MM] 계획 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
PLAN_TEXT	ZED1_MM_PTEXT	CHAR	30	0	0	[MM] 계획 설명

ZTD1MM0028 인코텀즈 정의 테이블
MANDT	MANDT	CLNT	3	0	0	Client
INCO1	ZED1_MM_INCO1	CHAR	3	0	0	[MM] 인코텀즈 
INCO_INFO	ZED1_MM_INCO_INFO	CHAR	30	0	0	[MM] 인코텀즈 설명

ZTD1MM0029 승인상태 정의 테이블
MANDT	MANDT	CLNT	3	0	0	Client
FGGZU	ZED1_MM_FGGZU	CHAR	10	0	0	[MM] 승인상태
FGGZU_INFO	ZED1_MM_FGGZU_INFO	CHAR	10	0	0	[MM] 승인상태 설명

ZTD1MM0033 결재 처리 테이블
MANDT	MANDT	CLNT	3	0	0	Client
APV_NO	ZED1_FI_PAYNO	CHAR	10	0	0	[FI] 결재 번호
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
FGGZU	ZED1_MM_FGGZU	CHAR	10	0	0	[MM] 승인상태
REQ_ID	ZED1_FI_REQ_ID	CHAR	12	0	0	[FI] 상신자 ID
REQ_DATE	ZED1_FI_REQ_DATE	DATS	8	0	0	[FI] 상신일 
APPR_ID_1	ZED1_MM_APPR_ID_1	CHAR	12	0	0	[MM] 1차 결재자 
APPR_ID_2	ZED1_MM_APPR_ID_2	CHAR	12	0	0	[MM] 2차 결재자 
APPR_DATE_1	ZED1_MM_APPR_DATE_1	DATS	8	0	0	[MM] 1차 결재 일자
APPR_DATE_2	ZED1_MM_APPR_DATE_2	DATS	8	0	0	[MM] 2차 결재 일자
NOTE	ZED1_MM_BIGO	CHAR	255	0	0	[MM] 비고

ZTD1MM0034 원유 ROP 관리
MANDT	MANDT	CLNT	3	0	0	Client
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
ROP_QTY	ZED1_MM_ROP_QTY	QUAN	24	3	0	[MM] 재주문점
SAFE_QTY	ZED1_MM_SAFE_QTY	QUAN	24	3	0	[MM] 안전재고
MAX_QTY	ZED1_MM_MAX_QTY	QUAN	24	3	0	[MM] 최대재고
LOT_QTY	ZED1_MM_LOT_QTY	QUAN	24	3	0	[MM] 최소주문단위
LEADTIME	ZED1_MM_LEADTIME	NUMC	3	0	0	[MM] 리드타임 
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
USE_YN	ZED1_MM_USE_YN	CHAR	1	0	0	[MM] 사용여부

ZTD1MM0035 ROP 로그
MANDT	MANDT	CLNT	3	0	0	Client
EXEC_DATE	ZED1_MM_EXEC_DATE	DATS	8	0	0	[MM] 배치잡 실행일자
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
QTY_STOCK	ZED1_MM_QTY_STOCK	QUAN	24	3	0	[MM] 현재 합산 실재고 
QTY_PR	ZED1_MM_QTY_PR	QUAN	24	3	0	[MM] 미결 PR 잔량
QTY_PO	ZED1_MM_QTY_PO	QUAN	24	3	0	[MM] 미결 PO 잔량
QTY_AVAIL	ZED1_MM_QTY_AVAIL	QUAN	24	3	0	[MM] 유효재고
ROP_QTY	ZED1_MM_ROP_QTY	QUAN	24	3	0	[MM] 재주문점
PR_QTY	ZED1_MM_PR_QTY	QUAN	24	3	0	[MM] PR 발주수량
PR_NUM	ZED1_MM_BNFPO	CHAR	10	0	0	[MM] Purchase Requisition
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위

ZTD1MM0036 월별 유가 집계
MANDT	MANDT	CLNT	3	0	0	Client
YEARAT	ZED1_MM_YEARAT	NUMC	4	0	0	[MM] 유가 집계 연도
MONAT	ZED1_MM_MONAT	NUMC	2	0	0	[MM] 유가 집계 월 
OILCODE	ZED1_MM_OILCODE	CHAR	30	0	0	[MM] 유가 조회 코드
PRICE	ZED1_MM_PRICE	CURR	23	2	0	[MM] 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위

ZTD1MM0037 송장 검증 헤더
MANDT	MANDT	CLNT	3	0	0	Client
INV_NO	ZED1_MM_INVNO	CHAR	10	0	0	[MM] 송장 전표 번호
GJAHR	ZED1_FI_GJAHR	NUMC	4	0	0	[FI] 회계 연도
BUDAT	ZED1_FI_BUDAT	DATS	8	0	0	[FI] 전기일 
BLDAT	ZED1_MM_BLDAT	DATS	8	0	0	[MM] 증빙일 
BUKRS	ZED1_CM_BUKRS	CHAR	4	0	0	[CM] 회사코드
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
ZWAERS	ZED1_FI_ZWAERS	CUKY	5	0	0	[FI] 로컬금액 통화
ZLSPR	ZED1_MM_ZLSPR	CHAR	1	0	0	[MM] 송장 승인/반려 여부
ZTERM	ZED1_FI_ZTERM	CHAR	4	0	0	[FI] 지급조건 
INV_DAT	ZED1_MM_INVDAT	DATS	8	0	0	[MM] 공급업체 청구일 

ZTD1MM0038 송장 검증 아이템
MANDT	MANDT	CLNT	3	0	0	Client
INV_NO	ZED1_MM_INVNO	CHAR	10	0	0	[MM] 송장 전표 번호
INV_ITEM	ZED1_MM_EBELPI	NUMC	5	0	0	[MM] 송장 아이템 번호
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
GR_MENGE	ZED1_MM_GRMENGE	QUAN	24	3	0	[MM] 실입고수량 
IR_MENGE	ZED1_MM_IRMENGE	QUAN	24	3	0	[MM] 청구서 수량
DIFF_QTY	ZED1_MM_ERFMGD	QUAN	24	3	0	[MM] 수량 차이
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
ITEM_AMT	ZED1_MM_ITEM_AMT	CURR	23	2	0	[MM] 청구 금액
ITEM_AMT_D	ZED1_MM_ITEM_AMT_D	CURR	23	2	0	[MM] 청구 금액(로컬)
BASE_AMT	ZED1_MM_BASE_AMT	CURR	23	2	0	[MM] 송장 검증 기준금액
BASE_AMT_D	ZED1_MM_BASE_AMT_D	CURR	23	2	0	[MM] 송장 검증 기준금액 (로컬)
HWSTE	ZED1_MM_HWSTE	CURR	23	2	0	[MM] 세금 합계액(로컬)
WMWST	ZED1_MM_WMWST	CURR	23	2	0	[MM] 세금 합계액(외화)
DIFF_AMT	ZED1_MM_WRBTRD	CURR	23	2	0	[MM] 금액 차이
DIFF_AMT_D	ZED1_MM_WRBTR_D	CURR	23	2	0	[MM] 금액 차이(로컬)
OILPRICE	ZED1_MM_OILPRICE	CURR	23	2	0	[MM] 유가 단가
PREMIUM	ZED1_MM_PREMIUM	CURR	23	2	0	[MM] OSP Premium 금액
WAERS	ZED1_CM_WAERS	CUKY	5	0	0	[CM] 통화코드
ZWAERS	ZED1_FI_ZWAERS	CUKY	5	0	0	[FI] 로컬금액 통화
MWSKZ	ZED1_FI_MWSKZ	CHAR	2	0	0	[FI] 세금코드

ZTD1MM0039 내부이동 GO-TR 참조 매핑 테이블
MANDT	MANDT	CLNT	3	0	0	Client
LINK_ID	ZED1_MM_LINK_ID	CHAR	10	0	0	[MM] 내부이동 매핑 ID
BUKRS	ZED1_CM_BUKRS	CHAR	4	0	0	[CM] 회사코드
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
CHARG	ZED1_MM_CHARG	CHAR	10	0	0	[MM] 배치번호
LGORT_FROM	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
LGORT_TO	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
GO_MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
GO_MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
GO_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
TR_MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
TR_MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
TR_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
LOSS_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
LOSS_ID	ZED1_MM_LOSS_ID	CHAR	10	0	0	[MM] Loss 번호
MOVE_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
RECV_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
LOSS_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
MOVE_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
RECV_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
LOSS_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
STATUS	ZED1_MM_LINK_STATUS	CHAR	1	0	0	[MM] 매핑상태
GO_DATE	ZED1_MM_BUDAT	DATS	8	0	0	[MM] 전기일 
TR_DATE	ZED1_MM_BUDAT	DATS	8	0	0	[MM] 전기일 

ZTD1MM0040 청구서 헤더
MANDT	MANDT	CLNT	3	0	0	Client
INV_NO	ZED1_MM_INVNO	CHAR	10	0	0	[MM] 송장 전표 번호
INV_DAT	ZED1_MM_INVDAT	DATS	8	0	0	[MM] 공급업체 청구일 
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
NAME1	ZED1_MM_VENDNME	CHAR	40	0	0	[MM] 공급업체명 
ZTERM	ZED1_FI_ZTERM	CHAR	4	0	0	[FI] 지급조건 
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
MWSKZ	ZED1_FI_MWSKZ	CHAR	2	0	0	[FI] 세금코드
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
TOTAL_QTY	ZED1_MM_TOTAL_QTY	QUAN	15	3	0	[MM] 총 입고 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
TOTAL_AMT	ZED1_MM_INVAMT	CURR	23	2	0	[MM] 송장 청구 총금액 
WMWST	ZED1_MM_WMWST	CURR	23	2	0	[MM] 세금 합계액(외화)
IV_ZLSPR	ZED1_MM_IV_ZLSPR	CHAR	1	0	0	[MM] 내부 송장 생성 상태

ZTD1MM0041 청구서 아이템
MANDT	MANDT	CLNT	3	0	0	Client
INV_NO	ZED1_MM_INVNO	CHAR	10	0	0	[MM] 송장 전표 번호
INV_ITEM	ZED1_MM_EBELPI	NUMC	5	0	0	[MM] 송장 아이템 번호
INV_DAT	ZED1_MM_INVDAT	DATS	8	0	0	[MM] 공급업체 청구일 
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
EBELP	ZED1_MM_EBELP	NUMC	5	0	0	[MM] 품목번호
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
MENGE	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
ITEM_AMT	ZED1_MM_ITEM_AMT	CURR	23	2	0	[MM] 청구 금액
WAERS	ZED1_CM_WAERS	CUKY	5	0	0	[CM] 통화코드
OILPRICE	ZED1_MM_OILPRICE	CURR	23	2	0	[MM] 유가 단가
PREMIUM	ZED1_MM_PREMIUM	CURR	23	2	0	[MM] OSP Premium 금액

ZTD1MM0042 저장위치 좌표
MANDT	MANDT	CLNT	3	0	0	Client
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
LATITUDE	ZED1_MM_LATI	DEC	9	6	0	[MM] 위도
LONGITUDE	ZED1_MM_LONG	DEC	10	6	0	[MM] 경도

ZTD1MM0043 재고이동 매핑 테이블 PLANT TO PLANT
MANDT	MANDT	CLNT	3	0	0	Client
MOVE_ID	ZED1_MM_LINK_ID	CHAR	10	0	0	[MM] 내부이동 매핑 ID
WERKS_FR	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT_FR	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
WERKS_TO	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT_TO	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
STAT	ZED1_MM_MSTAT	CHAR	1	0	0	[MM] 이동 완료 여부
PO_MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
PO_MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
PO_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
PG_MBLNR	ZED1_MM_MBLNR	CHAR	10	0	0	[MM] 자재 문서 번호
PG_MJAHR	ZED1_MM_MJAHR	NUMC	4	0	0	[MM] 문서 회계 연도
PG_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
LOSS_ZEILE	ZED1_MM_ZEILE	NUMC	4	0	0	[MM] 항목번호
MATNR	ZED1_MM_TKMAT	CHAR	5	0	0	[MM] 탱크안에 들어있는 자재
CHARG	ZED1_MM_CHARG	CHAR	10	0	0	[MM] 배치번호
MOVE_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
RECV_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
LOSS_QTY	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MOVE_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
RECV_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
LOSS_AMT	ZED1_MM_WRBTR	CURR	23	2	0	[MM] 금액
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
`;

function clean(value) {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}

function parseExtra(text) {
  const tables = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const header = line.match(/^(ZTD1MM\d{4})\s+(.+)$/);
    if (header) {
      current = { code: header[1], name: header[2].trim(), purpose: "(프로그램 나오면 정의)", module: "Material Management ( MM )", fields: [] };
      tables.push(current);
      continue;
    }
    if (!current) continue;
    const cols = rawLine.split("\t").map(clean);
    if (cols.length < 7 || !cols[0]) continue;
    current.fields.push({
      no: current.fields.length + 1,
      field: cols[0],
      description: cols.slice(6).filter(Boolean).join(" "),
      element: cols[1],
      domain: inferDomain(cols[1]),
      type: cols[2],
      length: Number(cols[3]),
      remark: null,
    });
  }
  return tables;
}

function inferDomain(element) {
  if (element === "MANDT") return "MANDT";
  if (element === "SPRAS") return "SPRAS";
  if (element?.startsWith("ZED")) return element.replace(/^ZED/, "ZDD");
  return element ?? null;
}

function blocksFromExistingRows(rows) {
  const blocks = [];
  let current = null;
  for (const row of rows) {
    if (row[0] === "CBO 테이블 정의서" || row[0] === "ㅅㅁ") continue;
    if (row[0] === "모듈명") {
      current = { module: row[1], date: "2026-07-02", author: "권주한", fields: [] };
      blocks.push(current);
      continue;
    }
    if (!current) continue;
    if (row[0] === "테이블") current.code = row[1];
    else if (row[0] === "테이블 명") current.name = row[1];
    else if (row[0] === "테이블 용도") current.purpose = clean(row[1]) ?? "(프로그램 나오면 정의)";
    else if (typeof row[0] === "number" && row[1] !== ".INCLUDE") {
      current.fields.push({
        no: row[0],
        field: row[1],
        description: row[2],
        element: row[5],
        domain: inferDomain(row[5]),
        type: row[7],
        length: row[8],
        remark: row[10],
      });
    } else if (row[1] === ".INCLUDE") {
      current.include = { element: row[5] };
    }
  }
  return blocks;
}

const previousRows = JSON.parse(await fs.readFile("outputs/table_def_work/generated_rows.json", "utf8"));
const blocks = [...blocksFromExistingRows(previousRows), ...parseExtra(extraRaw)];

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sheet1");
sheet.showGridLines = false;

const widths = [12, 16, 30, 10, 10, 24, 24, 11, 10, 16, 34];
for (let c = 0; c < widths.length; c++) sheet.getRangeByIndexes(0, c, 1200, 1).format.columnWidth = widths[c];

const blue = "#9BC2E6";
const orange = "#F4B183";
const black = "#000000";
const light = "#D9D9D9";
const headers = ["번호", "필드", "Description", "Key", "Initial", "Data Element", "Domain", "Type", "길이", "Check Table", "비고"];

function setRange(row, col, values) {
  sheet.getRangeByIndexes(row, col, values.length, values[0].length).values = values;
}

function styleAll(row, count) {
  sheet.getRangeByIndexes(row, 0, count, 11).format = {
    font: { fontSize: 10, typeface: "Arial" },
    borders: { preset: "all", style: "thin", color: light },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

function styleHeaderRow(row) {
  sheet.getRangeByIndexes(row, 0, 1, 11).format = {
    fill: blue,
    font: { bold: true, fontSize: 10, typeface: "Arial" },
    borders: { preset: "all", style: "thin", color: black },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

let r = 0;
for (const block of blocks) {
  const includeRows = block.include ? [block.include] : [];
  const dataRowCount = Math.max(15, block.fields.length + includeRows.length);
  const blockRows = 6 + dataRowCount;
  styleAll(r, blockRows);

  sheet.mergeCells(`A${r + 1}:K${r + 1}`);
  setRange(r, 0, [["CBO 테이블 정의서", null, null, null, null, null, null, null, null, null, null]]);
  styleHeaderRow(r);

  const metaRows = [
    ["모듈명", block.module ?? "Material Management ( MM )", null, null, null, null, null, "작성일", "2026-07-02", null, null],
    ["테이블", block.code, null, null, null, null, null, "작성자", "권주한", null, null],
    ["테이블 명", block.name, null, null, null, null, null, null, null, null, null],
    ["테이블 용도", block.purpose ?? "(프로그램 나오면 정의)", null, null, null, null, null, null, null, null, null],
  ];
  setRange(r + 1, 0, metaRows);
  for (let i = 1; i <= 4; i++) {
    sheet.mergeCells(`B${r + i + 1}:G${r + i + 1}`);
    sheet.mergeCells(`I${r + i + 1}:K${r + i + 1}`);
    sheet.getRangeByIndexes(r + i, 0, 1, 1).format = {
      fill: blue,
      font: { bold: true, fontSize: 10, typeface: "Arial" },
      borders: { preset: "all", style: "thin", color: black },
      horizontalAlignment: "center",
      verticalAlignment: "center",
    };
    if (i <= 2) {
      sheet.getRangeByIndexes(r + i, 7, 1, 1).format = {
        fill: blue,
        font: { bold: true, fontSize: 10, typeface: "Arial" },
        borders: { preset: "all", style: "thin", color: black },
        horizontalAlignment: "center",
        verticalAlignment: "center",
      };
    }
  }

  setRange(r + 5, 0, [headers]);
  styleHeaderRow(r + 5);

  const outputFields = block.fields.map((field) => [
    field.no,
    field.field,
    field.description,
    null,
    null,
    field.element,
    field.domain,
    field.type,
    field.length,
    null,
    field.remark,
  ]);
  for (const include of includeRows) {
    outputFields.push([outputFields.length + 1, ".INCLUDE", null, null, null, include.element, null, null, null, null, null]);
  }
  while (outputFields.length < dataRowCount) {
    outputFields.push([outputFields.length + 1, null, null, null, null, null, null, null, null, null, null]);
  }
  setRange(r + 6, 0, outputFields);

  const dataRange = sheet.getRangeByIndexes(r + 6, 0, dataRowCount, 11);
  dataRange.format.borders = { preset: "all", style: "thin", color: black };
  dataRange.format.horizontalAlignment = "center";
  sheet.getRangeByIndexes(r + 6, 2, dataRowCount, 1).format.horizontalAlignment = "center";
  sheet.getRangeByIndexes(r + 6, 5, dataRowCount, 2).format.horizontalAlignment = "left";
  sheet.getRangeByIndexes(r + 6, 10, dataRowCount, 1).format.horizontalAlignment = "left";

  for (let i = 0; i < outputFields.length; i++) {
    if (outputFields[i][1] === ".INCLUDE") {
      const inc = sheet.getRangeByIndexes(r + 6 + i, 0, 1, 11);
      inc.format = {
        fill: orange,
        font: { fontSize: 10, typeface: "Arial" },
        borders: { preset: "all", style: "thin", color: black },
        horizontalAlignment: "center",
        verticalAlignment: "center",
      };
      sheet.getRangeByIndexes(r + 6 + i, 1, 1, 1).format.font = { bold: true, fontSize: 10, typeface: "Arial" };
    }
  }

  sheet.getRangeByIndexes(r, 0, blockRows, 11).format.rowHeight = 22;
  r += blockRows + 1;
}

sheet.getRangeByIndexes(0, 0, r, 11).format.autofitRows();
sheet.freezePanes.freezeRows(6);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview1 = await workbook.render({ sheetName: "Sheet1", range: "A1:K80", scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/mm_all_preview_1.png", new Uint8Array(await preview1.arrayBuffer()));
const preview2 = await workbook.render({ sheetName: "Sheet1", range: `A${Math.max(1, r - 90)}:K${r}`, scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/mm_all_preview_2.png", new Uint8Array(await preview2.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("outputs/table_def_work/GPT_전달_테이블정의서_MM_전체_양식맞춤.xlsx");
await fs.writeFile("outputs/table_def_work/mm_all_blocks.json", JSON.stringify(blocks, null, 2), "utf8");
console.log(JSON.stringify({ blocks: blocks.length, rows: r, fields: blocks.reduce((sum, block) => sum + block.fields.length, 0) }));
