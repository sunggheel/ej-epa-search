const dotenv = require("dotenv")
dotenv.config();

const CryptoJS = require('crypto-js');

const PDFJS = require("pdfjs-dist");

const fs = require("fs")
const pdf = require('pdf-parse')
const { Client } = require('@elastic/elasticsearch')

'use strict'

const client = new Client({
    cloud: {
        id: process.env.ELASTIC_CLOUD_ID
    },
    auth: {
        apiKey: process.env.ELASTIC_API_KEY
    }
});

async function add(pdfFileName) {
    let pdfFile = fs.readFileSync(`pdfs/${pdfFileName}`);

    pdf(pdfFile).then((data) => {
        client.index({
            index: "search-db",
            id: CryptoJS.SHA256(pdfFileName),
            body: {
                name: pdfFileName,
                text: data.text
            }
        }, id=pdfFileName)
    });
    await client.indices.refresh({
        index: 'search-db'
    })

    console.log("successfully added document")
}

function addAll() {
    let pdfDocuments = fs.readdirSync("pdfs");
    for (let pdfFileName of pdfDocuments) {
        add(pdfFileName);
    }
}

async function findTextOnPage(page, searchText) {
    const content = await page.getTextContent();
    
    for (let i = 0; i < content.items.length; i++) {
      const item = content.items[i];
      if (item.str.includes(searchText)) {
        return page.pageNumber;
      }
    }
    
    return null;
  }

async function findTextInPDF(pdfPath, searchText) {
    const pdf = await (await PDFJS.getDocument(pdfPath)).promise;
    
    for (let i = 1; i < pdf.numPages; i++) {
        let page = await pdf.getPage(i);
        console.log(await page.getTextContent());

        break;
    }
    
    return null;
}

const pdfPath = 'pdfs/Draft NEJAC Public Meeting Summary Nov 29_Dec 1 2023.pdf';
const searchText = 'EPA';

findTextInPDF(pdfPath, searchText)
  .then(pageNumber => {
    if (pageNumber) {
      console.log(`Text found on page ${pageNumber}`);
    } else {
      console.log('Text not found in the PDF');
    }
  })
  .catch(err => console.error(err));