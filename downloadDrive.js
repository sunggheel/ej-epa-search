const fs = require("fs");

const dotenv = require("dotenv");
dotenv.config();

async function downloadFromFolder(folderID) {
    let pdfDocuments = fs.readdirSync("drive");
    let pdfDocumentsSet = new Set(pdfDocuments);

    let response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderID}'+in+parents&key=${process.env.GOOGLE_API_KEY}`);
    let data = await response.json();

    for (let file of data.files) {
        if (pdfDocumentsSet.has(file.name)) {
            console.log(`document already downloaded: ${file.name}`);
            continue;
        }

        if (file.kind !== "drive#file") continue;
        if (file.mimeType !== "application/pdf") continue;
        
        downloadPDF(file.name, file.id);
    }
}



async function downloadPDF(fileName, fileID) {
    let response = await fetch(`https://drive.google.com/uc?export=download&id=${fileID}`);
    let arrayBuffer = await response.arrayBuffer();

    let buffer = Buffer.from(arrayBuffer)
    
    fs.writeFileSync(`drive/${fileName}`, buffer);

    console.log(`successfully downloaded from drive: ${fileName}`);
}

let folderID = "1CnNzJbk61stAZYg_i2wuGtiKSq6FrWbx";
downloadFromFolder(folderID);