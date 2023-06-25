const fs = require("fs")

let obj = {};

let pdfDocuments = fs.readdirSync("pdfs");
pdfDocuments.sort();
console.log(pdfDocuments)
for (let pdfFileName of pdfDocuments) {
    obj[pdfFileName] = "";
}

let jsonString = JSON.stringify(obj, null, "\n")

fs.writeFileSync("dates.json", jsonString);