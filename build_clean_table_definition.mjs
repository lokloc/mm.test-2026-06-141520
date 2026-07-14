import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const rows = JSON.parse(await fs.readFile("outputs/table_def_work/generated_rows.json", "utf8"));
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("MM");
sheet.showGridLines = false;

sheet.getRangeByIndexes(0, 0, rows.length, 11).values = rows;

const all = sheet.getRangeByIndexes(0, 0, rows.length, 11);
all.format = {
  font: { fontSize: 10, typeface: "Arial" },
  wrapText: false,
  borders: { preset: "all", style: "thin", color: "#B7B7B7" },
};

const widths = [12, 18, 30, 10, 10, 24, 24, 12, 10, 16, 34];
for (let c = 0; c < widths.length; c++) {
  sheet.getRangeByIndexes(0, c, rows.length, 1).format.columnWidth = widths[c];
}

for (let r = 0; r < rows.length; r++) {
  const row = rows[r];
  const range = sheet.getRangeByIndexes(r, 0, 1, 11);
  range.format.rowHeight = 21;

  if (r === 0 || row[0] === "CBO 테이블 정의서") {
    range.format = {
      fill: "#9BC2E6",
      font: { bold: true, fontSize: 11, typeface: "Arial" },
      horizontalAlignment: "center",
      borders: { preset: "all", style: "thin", color: "#000000" },
    };
    continue;
  }

  if (["모듈명", "테이블", "테이블 명", "테이블 용도"].includes(row[0])) {
    sheet.getRangeByIndexes(r, 0, 1, 1).format = {
      fill: "#9BC2E6",
      font: { bold: true, fontSize: 11, typeface: "Arial" },
      horizontalAlignment: "left",
      borders: { preset: "all", style: "thin", color: "#000000" },
    };
    if (row[7]) {
      sheet.getRangeByIndexes(r, 7, 1, 1).format = {
        fill: "#9BC2E6",
        font: { bold: true, fontSize: 11, typeface: "Arial" },
        horizontalAlignment: "center",
        borders: { preset: "all", style: "thin", color: "#000000" },
      };
    }
    continue;
  }

  if (row[0] === "번호") {
    range.format = {
      fill: "#9BC2E6",
      font: { bold: true, fontSize: 10, typeface: "Arial" },
      horizontalAlignment: "center",
      borders: { preset: "all", style: "thin", color: "#000000" },
    };
    continue;
  }

  if (row[1] === ".INCLUDE") {
    range.format = {
      fill: "#F4B183",
      font: { bold: true, fontSize: 10, typeface: "Arial" },
      horizontalAlignment: "center",
      borders: { preset: "all", style: "thin", color: "#000000" },
    };
    continue;
  }

  if (typeof row[0] === "number") {
    sheet.getRangeByIndexes(r, 0, 1, 1).format.horizontalAlignment = "center";
    sheet.getRangeByIndexes(r, 3, 1, 2).format.horizontalAlignment = "center";
    sheet.getRangeByIndexes(r, 7, 1, 3).format.horizontalAlignment = "center";
  }
}

sheet.getRangeByIndexes(0, 0, rows.length, 11).format.autofitRows();
sheet.freezePanes.freezeRows(6);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview1 = await workbook.render({ sheetName: "MM", range: "A1:K90", scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/clean_preview_1.png", new Uint8Array(await preview1.arrayBuffer()));
const preview2 = await workbook.render({ sheetName: "MM", range: "A91:K179", scale: 1, format: "png" });
await fs.writeFile("outputs/table_def_work/clean_preview_2.png", new Uint8Array(await preview2.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("outputs/table_def_work/GPT_전달_테이블정의서_MM정리본.xlsx");
console.log(`CLEAN_ROWS ${rows.length}`);

