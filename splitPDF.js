const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function extractPages(inputPath, outputPath, pageNumbers) {
    const existingPdfBytes = fs.readFileSync(inputPath);

    const newPdfDoc = await PDFDocument.create();

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageNumbers);
    
    for (let copiedPage of copiedPages) {
        newPdfDoc.addPage(copiedPage);
    }

    const newPdfBytes = await newPdfDoc.save();
    
    return newPdfBytes;
}

// Usage example:
const inputPath = 'a.pdf';
const pageNumbers = [1, 3, 5];

extractPages(inputPath, pageNumbers).catch((error) => console.log(error));