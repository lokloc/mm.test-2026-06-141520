import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const raw = String.raw`
ZTD1MM0001 자재마스터

MANDT	MANDT	CLNT	T000	Input help implemented with check table	H_T000	MANDT
MATNR	ZED1_MM_MATNR	CHAR	                              	Explicit search help interface to data element	ZSHD1MM0002_TEST	ZDD1_MM_MATNR
MTART	ZED1_MM_MTART	CHAR	                              	Input help with fixed values		ZDD1_MM_MTART
MEINS	ZED1_MM_MEINS	UNIT	ZTD1CM0001	Input help implemented with check table		ZDD1_CM_MSEHI
PRICE_API_CODE	ZED1_MM_PRICE_API_CODE	CHAR	                              	                                                            		ZDD1_MM_PRICE_API_CODE
.INCLUDE	ZSD1CM0001		                              	                                                            
ERNAM	ZED1_CM_ERNAM	CHAR	                              	                                                            		XUBNAME
ERDAT	ZED1_CM_ERDAT	DATS	                              	Input help based on data type		DATS
ERZET	ZED1_CM_ERZET	TIMS	                              	Input help based on data type		TIMS
AENAM	ZED1_CM_AENAM	CHAR	                              	                                                            		XUBNAME
AEDAT	ZED1_CM_AEDAT	DATS	                              	Input help based on data type		DATS
AEZET	ZED1_CM_AEZET	TIMS	                              	Input help based on data type		TIMS

ZTD1MM0002 저장위치 마스터(탱크 마스터)
MANDT	MANDT	CLNT	3	0	0	Client
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
TNAME	ZED1_MM_TNAME	CHAR	20	0	0	[MM] 탱크 명 
MATNR	ZED1_MM_TKMAT	CHAR	5	0	0	[MM] 탱크안에 들어있는 자재
STAT	ZED1_MM_TSTAT	CHAR	1	0	0	[MM] 탱크 상태 필드
CAPICITY	ZED1_MM_TKCAP	QUAN	24	3	0	[MM] 탱크 최대 용량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
RESNR	ZED1_MM_RESNR	CHAR	10	0	0	[MM] 탱크 예약번호
PICK_AV	ZED1_MM_PICKA	CHAR	1	0	0	[MM] 피킹 가능 여부

ZTD1MM0003 저장위치 자재(재고 테이블)
MANDT	MANDT	CLNT	3	0	0	Client
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
LGORT	ZED1_MM_LGORT	CHAR	4	0	0	[MM] Storage Location
BATCH_ID	ZED1_MM_BATCH	CHAR	10	0	0	[MM] 품질관리 번호
TEMP_V	ZED1_MM_TEMP	DEC	5	2	0	[MM] 온도
TEMP_UNIT	ZED1_MM_TEMP_UNIT	UNIT	3	0	0	[MM] 온도 단위
API_G	ZED1_MM_API_G	DEC	5	2	0	[MM] API GRAVITY
SULF_C	ZED1_MM_SULF_C	DEC	5	3	0	[MM] Sulfur Content
QUANTITY	ZED1_MM_QUANT	QUAN	24	3	0	[MM] 15도 기준 실 수량
QTY15	ZED1_MM_QTY15	QUAN	24	3	0	[MM] 온도 부피 보정 전 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
LABST	ZED1_MM_LABST	QUAN	24	3	0	[MM] 가용재고 
SALK3	ZED1_MM_SALK3	CURR	31	2	0	[MM] 재고금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
PICK_Q	ZED1_MM_PICKQ	QUAN	24	3	0	[MM] 피킹 유량

ZTD1MM0004 공급업체 마스터
MANDT	MANDT	CLNT	3	0	0	Client
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
NAME1	ZED1_MM_VENDNME	CHAR	40	0	0	[MM] 공급업체명 
LAND1	ZED1_MM_LAND1	CHAR	3	0	0	[MM] 국가/지역키
LAND1M	ZED1_MM_LAND1M	CHAR	35	0	0	[MM] 국가명 
REGIO	ZED1_MM_REGIO	CHAR	35	0	0	[MM] 지역/주명
ORT01	ZED1_MM_ORT01	CHAR	35	0	0	[MM] 도시명 
STRAS	ZED1_MM_STRAS	CHAR	35	0	0	[MM] 주소
PSTLZ	ZED1_MM_PSTLZ	CHAR	10	0	0	[MM] 우편번호
TELF1	ZED1_MM_TELF1	CHAR	16	0	0	[MM] 연락처 
LIF_EMAIL	ZED1_MM_LIFMAIL	CHAR	40	0	0	[MM] 공급업체 이메일 
ZTERM	ZED1_FI_ZTERM	CHAR	4	0	0	[FI] 지급조건 
HKONT	ZED1_FI_SAKNR	CHAR	10	0	0	[FI] G/L 계정 번호
WAERS	ZED1_CM_WAERS	CUKY	5	0	0	[CM] 통화코드
BUKRS	ZED1_CM_BUKRS	CHAR	4	0	0	[CM] 회사코드
HERKL	ZED1_MM_HERKL	CHAR	3	0	0	[MM] 원산지

ZTD1MM0005 유가
MANDT	MANDT	CLNT	3	0	0	Client
RDATE	ZED1_MM_RDATE	UTCLONG	27	0	0	[MM] 기준일시
OILCODE	ZED1_MM_OILCODE	CHAR	30	0	0	[MM] 유가 조회 코드
PRICE	ZED1_MM_PRICE	CURR	23	2	0	[MM] 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
SOURCE	ZED1_MM_SOURCE	CHAR	50	0	0	[MM] Source from (출처)
PRICE_TYPE	ZED1_MM_PRICE_T	CHAR	20	0	0	[MM] 가격 유형
P_PRICE	ZED1_MM_P_PRICE	CURR	23	2	0	[MM] 이전 가격 
AMOUNT24	ZED1_MM_AMOUNT24	CURR	23	2	0	[MM] 24시간 변동추이 (금액)
PERCENT24	ZED1_MM_PERCENT24	DEC	5	3	0	[MM] 24시간 변동추이 (퍼센트)
ODATE	ZED1_CM_DATS	DATS	8	0	0	[CM] 날짜 공용 Element

ZTD1MM0006 프리미엄 기준가
MANDT	MANDT	CLNT	3	0	0	Client
RDATE	ZED1_MM_PRM_RDATE	DATS	8	0	0	[MM] 유효시작일 
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
CONTRACT_ID	ZED1_MM_CONTRACT_ID	CHAR	10	0	0	[MM] 계약 ID
CTTYPE	ZED1_MM_CTRCT_TYPE	CHAR	1	0	0	[MM] 구매 계약 유형
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
OILCODE	ZED1_MM_OILCODE	CHAR	30	0	0	[MM] 유가 조회 코드
PREMI	ZED1_MM_PREMIUM	CURR	23	2	0	[MM] OSP Premium 금액
FREIGHT	ZED1_MM_FREIGHT	CURR	23	2	0	[MM] 운임 금액
INSUR	ZED1_MM_INSUR	CURR	23	2	0	[MM] 보험료 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
ENDDAT	ZED1_MM_ENDDAT	DATS	8	0	0	[MM] 유효 종료일 

ZTD1MM0007 계약헤더
CONTRACT_ID	ZED1_MM_CONTRACT_ID	CHAR	10	0	0	[MM] 계약 ID
LIFNR	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
EKORG	ZED1_MM_EKORG	CHAR	4	0	0	[MM] 구매조직
BUKRS	ZED1_FI_BUKRS	CHAR	4	0	0	[FI] 회사 코드
CONTRACT_AMT	ZED1_MM_CTAMT	CURR	23	2	0	[MM] 계약 규모 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화
KDAT	ZED1_MM_KDAT	DATS	8	0	0	[MM] 계약 기준일자
KDATB	ZED1_MM_KDATB	DATS	8	0	0	[MM] 계약 시작일 
KDATE	ZED1_MM_KDATE	DATS	8	0	0	[MM] 계약 종료일 
OILCODE	ZED1_MM_OILCODE	CHAR	30	0	0	[MM] 유가 조회 코드
INCO1	ZED1_MM_INCO1	CHAR	3	0	0	[MM] 인코텀즈 
ZTERM	ZED1_FI_ZTERM	CHAR	4	0	0	[FI] 지급조건 
ZINFO_TEXT	ZED1_MM_ZINFO	CHAR	255	0	0	[MM] 설명

ZTD1MM0008 계약 아이템
MANDT	MANDT	CLNT	3	0	0	Client
CONTRACT_ID	ZED1_MM_CONTRACT_ID	CHAR	10	0	0	[MM] 계약 ID
CONTRACT_ITEM	ZED1_MM_CONTRACT_ITEM	NUMC	5	0	0	[MM] 계약품목
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
T_QUANTITY	ZED1_MM_TQTY	QUAN	24	3	0	[MM] 총 계약수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
MIN_QTY	ZED1_MM_MQTY	QUAN	24	3	0	[MM] 최소 주문 수량
MAX_QTY	ZED1_MM_MAXQTY	QUAN	24	3	0	[MM] 최대 주문 수량 (1회)
KDATB	ZED1_MM_KDATB	DATS	8	0	0	[MM] 계약 시작일 
KDATE	ZED1_MM_KDATE	DATS	8	0	0	[MM] 계약 종료일 
MWSKZ	ZED1_FI_MWSKZ	CHAR	2	0	0	[FI] 세금코드
PREMIUM	ZED1_MM_PREMIUM	CURR	23	2	0	[MM] OSP Premium 금액
WAERS	ZED1_MM_WAERS	CUKY	5	0	0	[MM] 통화

ZTD1MM0009 자재 텍스트 테이블

MANDT	MANDT	CLNT	3	0	0	Client
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
LANGUAGE	SPRAS	LANG	1	0	0	Language Key
MAKTX	ZED1_MM_MAKTX	CHAR	40	0	0	[MM] 자재명 

ZTD1MM0010 구매요청
MANDT	MANDT	CLNT	3	0	0	Client
BNFPO	ZED1_MM_BNFPO	CHAR	10	0	0	[MM] Purchase Requisition
MATNR	ZED1_MM_MATNR	CHAR	5	0	0	[MM] 자재번호
WERKS	ZED1_PP_WERKS	CHAR	4	0	0	[PP] 플랜트 ID
FLIEF	ZED1_MM_LIFNR	CHAR	10	0	0	[MM] 공급업체 ID
MENGE	ZED1_MM_MENGE	QUAN	24	3	0	[MM] 수량
MEINS	ZED1_MM_MEINS	UNIT	3	0	0	[MM] 기본단위
LFDAT	ZED1_MM_LFDAT	DATS	8	0	0	[MM] 요구 납기일 
FGGZU	ZED1_MM_FGGZU	CHAR	10	0	0	[MM] 승인상태
ESTKZ	ZED1_MM_ESTKZ	CHAR	4	0	0	[MM] 생성구분
EBELN	ZED1_MM_EBELN	CHAR	10	0	0	[MM] 참조 PO 번호
`;

const oldValues = JSON.parse(await fs.readFile("outputs/table_def_work/existing_values.json", "utf8"));

function clean(value) {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}

function parseTables(text) {
  const tables = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const header = trimmed.match(/^(ZTD1MM\d{4})\s+(.+)$/);
    if (header) {
      current = { code: header[1], name: header[2].trim(), fields: [] };
      tables.push(current);
      continue;
    }
    if (!current) continue;
    const cols = line.split("\t").map(clean);
    const [field, element, type] = cols;
    if (!field) continue;
    if (cols.length >= 7 && /^\d+$/.test(cols[3] ?? "")) {
      current.fields.push({
        field,
        element,
        type,
        length: Number(cols[3]),
        decimals: Number(cols[4] ?? 0),
        description: cols.slice(6).filter(Boolean).join(" "),
        explicitDomain: null,
        include: field === ".INCLUDE",
      });
    } else {
      current.fields.push({
        field,
        element,
        type,
        length: null,
        decimals: null,
        description: null,
        explicitDomain: cols[6] ?? null,
        include: field === ".INCLUDE",
      });
    }
  }
  return tables;
}

function oldBlocks(values) {
  const blocks = new Map();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] !== "테이블") continue;
    const code = values[i][1];
    const start = i - 1;
    const next = values.findIndex((row, idx) => idx > i && row[0] === "테이블");
    const end = next === -1 ? values.length : next - 2;
    const fields = new Map();
    for (let r = i + 4; r <= end; r++) {
      const row = values[r] ?? [];
      if (row[1]) fields.set(String(row[1]), row);
    }
    blocks.set(code, { start, end, fields, meta: values.slice(Math.max(0, start), i + 3) });
  }
  return blocks;
}

const oldByTable = oldBlocks(oldValues);
const oldByElement = new Map();
for (const block of oldByTable.values()) {
  for (const row of block.fields.values()) {
    if (row[5] && !oldByElement.has(row[5])) oldByElement.set(row[5], row);
  }
}

const lengthDefaults = {
  CLNT: 3,
  LANG: 1,
  DATS: 8,
  TIMS: 6,
  UNIT: 3,
  CUKY: 5,
  XUBNAME: 12,
};

const commonDescriptions = {
  ERNAM: "[CM] 생성자",
  ERDAT: "[CM] 생성일",
  ERZET: "[CM] 생성시간",
  AENAM: "[CM] 변경자",
  AEDAT: "[CM] 변경일",
  AEZET: "[CM] 변경시간",
};

function inferDomain(field) {
  if (field.explicitDomain) return field.explicitDomain;
  if (field.element === "MANDT") return "MANDT";
  if (field.element === "SPRAS") return "SPRAS";
  if (field.element?.startsWith("ZED")) return field.element.replace(/^ZED/, "ZDD");
  if (field.type === "DATS") return "DATS";
  if (field.type === "TIMS") return "TIMS";
  return field.element ?? null;
}

function tablePurpose(code, fallbackName) {
  const old = oldByTable.get(code);
  const oldPurpose = old?.meta?.find((r) => r[0] === "테이블 용도")?.[1];
  return oldPurpose ?? fallbackName;
}

function metaValue(code, label, fallback) {
  const old = oldByTable.get(code);
  const row = old?.meta?.find((r) => r[0] === label || r[7] === label);
  if (!row) return fallback;
  if (label === "작성일") return row[8] ?? fallback;
  if (label === "작성자") return row[8] ?? fallback;
  return row[1] ?? fallback;
}

function fieldRow(table, field, index) {
  const old = oldByTable.get(table.code)?.fields.get(field.field);
  const oldElement = oldByElement.get(field.element);
  const description = field.description ?? old?.[2] ?? oldElement?.[2] ?? commonDescriptions[field.field] ?? null;
  const key = old?.[3] ?? null;
  const initial = old?.[4] ?? null;
  const domain = inferDomain(field);
  const length = field.length ?? old?.[8] ?? oldElement?.[8] ?? lengthDefaults[domain] ?? lengthDefaults[field.type] ?? null;
  const remark = old?.[10] ?? oldElement?.[10] ?? null;
  if (field.include) {
    return [null, field.field, null, null, null, field.element, null, null, null, null, null];
  }
  return [
    index,
    field.field,
    description,
    key,
    initial,
    field.element,
    domain,
    field.type,
    length,
    null,
    remark,
  ];
}

const tables = parseTables(raw);
const rows = [["ㅅㅁ", null, null, null, null, null, null, null, null, null, null]];
for (let t = 0; t < tables.length; t++) {
  const table = tables[t];
  if (t > 0) rows.push(["CBO 테이블 정의서", null, null, null, null, null, null, null, null, null, null]);
  rows.push(["모듈명", metaValue(table.code, "모듈명", "Material Management ( MM )"), null, null, null, null, null, "작성일", metaValue(table.code, "작성일", 46130), null, null]);
  rows.push(["테이블", table.code, null, null, null, null, null, "작성자", metaValue(table.code, "작성자", "권주한"), null, null]);
  rows.push(["테이블 명", table.name, null, null, null, null, null, null, null, null, null]);
  rows.push(["테이블 용도", tablePurpose(table.code, table.name), null, null, null, null, null, null, null, null, null]);
  rows.push(["번호", "필드", "Description", "Key", "Initial", "Data Element", "Domain", "Type", "길이", "Check Table", "비고"]);
  let n = 1;
  for (const field of table.fields) {
    rows.push(fieldRow(table, field, field.include ? null : n));
    if (!field.include) n++;
  }
}

const input = await FileBlob.load("GPT_전달_테이블정의서.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("MM");
sheet.getRange("A1:O754").clear({ applyTo: "contents" });
sheet.getRangeByIndexes(0, 0, rows.length, 11).values = rows;

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "MM",
  range: `A1:K${Math.min(rows.length, 90)}`,
  scale: 1,
  format: "png",
});
await fs.writeFile("outputs/table_def_work/preview.png", new Uint8Array(await preview.arrayBuffer()));

await fs.mkdir("outputs/table_def_work", { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("outputs/table_def_work/GPT_전달_테이블정의서_MM정리본.xlsx");

await fs.writeFile("outputs/table_def_work/generated_rows.json", JSON.stringify(rows, null, 2), "utf8");
console.log(`ROWS ${rows.length}`);
