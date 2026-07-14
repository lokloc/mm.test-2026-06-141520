import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const sourceRows = JSON.parse(await fs.readFile("outputs/table_def_work/generated_rows.json", "utf8"));

function splitBlocks(rows) {
  const blocks = [];
  let current = null;
  for (const row of rows) {
    if (row[0] === "CBO 테이블 정의서" || row[0] === "ㅅㅁ") continue;
    if (row[0] === "모듈명") {
    current = { module: row[1], date: "2026-07-02", fields: [] };
      blocks.push(current);
      continue;
    }
    if (!current) continue;
    if (row[0] === "테이블") current.code = row[1];
    else if (row[0] === "테이블 명") current.name = row[1];
    else if (row[0] === "테이블 용도") current.purpose = row[1];
    else if (typeof row[0] === "number" || row[1] === ".INCLUDE") current.fields.push(row);
  }
  return blocks;
}

const blocks = splitBlocks(sourceRows);
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sheet1");
sheet.showGridLines = false;

const widths = [12, 16, 30, 10, 10, 24, 24, 11, 10, 16, 34];
for (let c = 0; c < widths.length; c++) sheet.getRangeByIndexes(0, c, 260, 1).format.columnWidth = widths[c];

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
  const range = sheet.getRangeByIndexes(row, 0, 1, 11);
  range.format = {
    fill: blue,
    font: { bold: true, fontSize: 10, typeface: "Arial" },
    borders: { preset: "all", style: "thin", color: black },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

let r = 0;
for (const block of blocks) {
  const normalFields = block.fields.filter((row) => row[1] !== ".INCLUDE");
  const includeRows = block.fields.filter((row) => row[1] === ".INCLUDE");
  const dataRowCount = Math.max(15, normalFields.length + includeRows.length);
  const blockRows = 6 + dataRowCount;
  styleAll(r, blockRows);

  sheet.mergeCells(`A${r + 1}:K${r + 1}`);
  setRange(r, 0, [["CBO 테이블 정의서", null, null, null, null, null, null, null, null, null, null]]);
  styleHeaderRow(r);

  const metaRows = [
    ["모듈명", block.module, null, null, null, null, null, "작성일", block.date, null, null],
    ["테이블", block.code, null, null, null, null, null, "작성자", "권주한", null, null],
    ["테이블 명", block.name, null, null, null, null, null, null, null, null, null],
    ["테이블 용도", block.purpose, null, null, null, null, null, null, null, null, null],
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

  const outputFields = [];
  for (const row of normalFields) {
    outputFields.push([
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      row[5],
      row[6],
      row[7],
      row[8],
      null,
      row[10],
    ]);
  }
  for (const row of includeRows) {
    outputFields.push([normalFields.length + 1, ".INCLUDE", null, null, null, row[5], null, null, null, null, null]);
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

const preview1 = await workbook.render({ sheetName: "Sheet1", range: "A1:K70", scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/template_style_preview_1.png", new Uint8Array(await preview1.arrayBuffer()));
const preview2 = await workbook.render({ sheetName: "Sheet1", range: `A${Math.max(1, r - 70)}:K${r}`, scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/template_style_preview_2.png", new Uint8Array(await preview2.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("outputs/table_def_work/GPT_전달_테이블정의서_MM_양식맞춤.xlsx");
console.log(JSON.stringify({ blocks: blocks.length, rows: r }));
