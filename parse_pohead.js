const fs = require("fs");
const x = fs.readFileSync(process.argv[2] || "metadata_pohead.xml", "utf8");
const m = x.match(/EntityType Name="pohead"[\s\S]*?(?=EntityType Name=|EntityContainer Name=)/);
if (m) {
    console.log([...m[0].matchAll(/Property Name="([^"]+)"/g)].map((a) => a[1]).join(", "));
}
