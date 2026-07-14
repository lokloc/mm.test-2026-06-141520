import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";

const input = await FileBlob.load("GPT_전달_테이블정의서.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("MM");
const values = sheet.getRange("A1:K754").values;
await fs.writeFile("outputs/table_def_work/existing_values.json", JSON.stringify(values, null, 2), "utf8");

const styles = await workbook.inspect({
  kind: "computedStyle",
  sheetId: "MM",
  range: "A1:K15",
  maxChars: 10000,
});
console.log(styles.ndjson);

