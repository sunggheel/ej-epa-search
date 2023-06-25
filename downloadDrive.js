const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

const fs = require("fs");

const dotenv = require("dotenv");
dotenv.config();

async function downloadFromFolder(folderID) {
    let response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderID}'+in+parents&key=${process.env.GOOGLE_API_KEY}`);
    let data = await response.json();

    for (let file of data.files) {
        if (file.mimeType === "application/pdf") downloadPDF(file.name, file.id);
        return;
    }
}



async function downloadPDF(fileName, fileID) {
    let response = await fetch(`https://drive.google.com/uc?export=download&id=${fileID}`);
    let blob = await response.blob();
    
    fs.writeFileSync(`drive/${fileName}`, blob);


}

let folderID = "1CnNzJbk61stAZYg_i2wuGtiKSq6FrWbx";
downloadFromFolder(folderID);