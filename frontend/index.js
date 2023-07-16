const isProduction = window.location.hostname !== "localhost";
const protocol = isProduction ? "https://" : "http://";
const baseUrl = protocol + window.location.host;
const apiUrl = `${baseUrl}/api`;

let searchQuery = "";
let searchResults = [];
let collectionSelector = "all-collections";

const SORT_DIRECTIONS = { ASCENDING: 1, DESCENDING: -1 }

const performSearch = async () => {
    searchQuery = document.getElementById("searchInput").value;

    // Display loading spinner
    document.getElementById("searchResults").innerHTML = "<div class='spinner-border text-center' role='status'></div>";
    
    try {
        let response = await fetch(`${apiUrl}/search?query=${searchQuery}`);
        searchResults = await response.json();
    } catch (error) {
        console.error("couldnt fetch search results");
        return;
    } finally {
        let searchResultsContainer = document.getElementById("searchResults");

        if (searchResults.length === 0) {
            searchResultsContainer.innerHTML = `<p>No results found for ${searchQuery}.</p>`;
            return;
        }
    
        searchResultsContainer.innerHTML = "<p>Showing results for: " + searchQuery + "</p>";
    }

    displaySearchResults();
}

const displaySearchResults = () => {
    let searchResultsContainer = document.getElementById("searchResults");
    searchResultsContainer.innerHTML = "";

    let resultList = document.createElement("ul");
    resultList.classList.add("list-group");

    // build the sort dropdown
    let dropdownDiv = document.createElement("div");
    dropdownDiv.classList.add("dropdown");
    dropdownDiv.innerHTML = "<button class='btn btn-secondary dropdown-toggle ml-auto' type='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>Sort By</button>";

    let dropdownMenu = document.createElement("div");
    dropdownMenu.classList.add("dropdown-menu");

    let sortByOccurrencesASCButton = document.createElement("button");
    sortByOccurrencesASCButton.classList.add("dropdown-item");
    sortByOccurrencesASCButton.innerHTML = "Search word occurrences ASC";
    sortByOccurrencesASCButton.onclick = () => {sortResultsByOccurrences(SORT_DIRECTIONS.ASCENDING)}

    let sortByOccurrencesDESCButton = document.createElement("button");
    sortByOccurrencesDESCButton.classList.add("dropdown-item");
    sortByOccurrencesDESCButton.innerHTML = "Search word occurrences DESC";
    sortByOccurrencesDESCButton.onclick = () => {sortResultsByOccurrences(SORT_DIRECTIONS.DESCENDING)}

    let sortByDateASCButton = document.createElement("button");
    sortByDateASCButton.classList.add("dropdown-item");
    sortByDateASCButton.innerHTML = "Document date ASC";
    sortByDateASCButton.onclick = () => {sortResultsByDate(SORT_DIRECTIONS.ASCENDING)}

    let sortByDateDESCButton = document.createElement("button");
    sortByDateDESCButton.classList.add("dropdown-item");
    sortByDateDESCButton.innerHTML = "Document date DESC";
    sortByDateDESCButton.onclick = () => {sortResultsByDate(SORT_DIRECTIONS.DESCENDING)}

    dropdownMenu.appendChild(sortByOccurrencesASCButton);
    dropdownMenu.appendChild(sortByOccurrencesDESCButton);
    dropdownMenu.appendChild(sortByDateASCButton);
    dropdownMenu.appendChild(sortByDateDESCButton);

    dropdownDiv.appendChild(dropdownMenu);

    searchResultsContainer.appendChild(dropdownDiv);

    searchResults.forEach((result) => {
        let listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "mb-3", "border", "rounded");

        let resultTitle = document.createElement("h5");
        resultTitle.classList.add("mb-1");
        resultTitle.textContent = result._source.name;

        // create the button group
        let buttonGroup = document.createElement("span");
        buttonGroup.classList.add("btn-group", "btn-group-sm");

        let viewHitsButton = document.createElement("button");
        viewHitsButton.classList.add("btn", "btn-outline-primary");
        viewHitsButton.innerHTML = "View page hits";
    
        let viewPDFButton = document.createElement("button");
        viewPDFButton.classList.add("btn", "btn-outline-primary");
        viewPDFButton.innerHTML = "View PDF";

        viewHitsButton.onclick = (event) => {showPDFModal(result._source.driveFileID, result.pageHits)}
        viewHitsButton.setAttribute("data-toggle", "modal");
        viewHitsButton.setAttribute("data-target", "resultModal");

        viewPDFButton.onclick = (event) => {viewPDF(result._source.driveFileID)}

        buttonGroup.appendChild(viewHitsButton);
        buttonGroup.appendChild(viewPDFButton);

        let occurrencesText = document.createElement("p");
        occurrencesText.classList.add("mb-1");
        occurrencesText.innerHTML = `Total search word occurrences: ${result.occurrences}`;

        let dateText = document.createElement("p");
        dateText.classList.add("mb-1");
        dateText.innerHTML = `Document date: ${result._source.date}`;

        // highlights text
        let resultText = document.createElement("p");
        resultText.classList.add("mb-1");
        result.highlight.content.forEach((text) => {
            resultText.innerHTML += text.replace(/(<([^>]+)>)/gi, "") + "\n" + "<br><br>"
        })

        listItem.appendChild(resultTitle);
        listItem.appendChild(buttonGroup);
        listItem.appendChild(occurrencesText);
        listItem.appendChild(dateText);
        listItem.appendChild(resultText);

        resultList.appendChild(listItem);
    });

    searchResultsContainer.appendChild(resultList);


    let instance = new Mark(resultList);
    instance.mark(searchQuery, {separateWordSearch: false});
}

const sortResultsByOccurrences = (direction) => {
    searchResults.sort((a,b) => {
        return direction * (a.occurrences - b.occurrences);
    });

    displaySearchResults();
}

const sortResultsByDate = (direction) => {
    searchResults.sort((a,b) => {
        // [MM, DD, YYYY]
        let aDateArray = a._source.date.split("/").map(a => parseInt(a));
        let bDateArray = b._source.date.split("/").map(a => parseInt(a));
        
        if (aDateArray.length !== 3) {
            console.error(`Incorrect date format: ${a._source.name}`);
            return 0;
        }
        if (bDateArray.length !== 3) {
            console.error(`Incorrect date format: ${b._source.name}`);
            return 0;
        }
        
        // format is [MM, DD, YYYY]
        // start comparing from YYYY, then MM, then DD
        for (let i of [2,0,1]) {
            if (aDateArray[i] !== bDateArray[i]) return direction * (aDateArray[i] - bDateArray[i]);
        }

        return 0;
    });

    displaySearchResults();
}

const showPDFModal = async (driveFileID, pageHits) => {

    let requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({driveFileID, pageHits})
    }

    let response = await fetch(`${apiUrl}/pdf`, requestOptions);
    let data = await response.arrayBuffer();

    let pdfBytes = data;


    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js"
    // https://mozilla.github.io/pdf.js/build/pdf.worker.js

    const container = document.getElementById("modalBody");

    const eventBus = new pdfjsViewer.EventBus();
    
    // (Optionally) enable hyperlinks within PDF files.
    // const pdfLinkService = new pdfjsViewer.PDFLinkService({
    //     eventBus,
    // });
    
    // (Optionally) enable find controller.
    const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus,
        // linkService: pdfLinkService,
    });
    
    const pdfViewer = new pdfjsViewer.PDFViewer({
        container,
        viewer: container,
        eventBus,
        // linkService: pdfLinkService,
        findController: pdfFindController,
        // scriptingManager: pdfScriptingManager,
    });
    
    // pdfLinkService.setViewer(pdfViewer);
    // pdfScriptingManager.setViewer(pdfViewer);

    eventBus.on("pagesinit", function() {
        // We can use pdfViewer now, e.g. let's change default scale.
        // pdfViewer.currentScaleValue = "page-width";
    
        // We can try searching for things.
        // eventBus.dispatch("find", {
        //     caseSensitive: false,
        //     findPrevious: undefined,
        //     highlightAll: true,
        //     phraseSearch: true,
        //     query: "nejac"
        // });
    });

    eventBus.on("pagesloaded", function() {
        console.log("All pages have been loaded");
    });

    // eventBus.on("pagerendered", function(event) {
    //     const { pageNumber } = event;
    //     console.log(`Page ${pageNumber} has been rendered`);
    // });

    const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
    loadingTask.promise.then((pdfDocument) => {
        pdfViewer.setDocument(pdfDocument);
    }).catch(err => console.log(err))

    let modal = new bootstrap.Modal(document.getElementById("resultModal"));
    modal.show();
}

// const downloadPDF = async (pdfFileName) => {
//     let response = await fetch(`${apiUrl}/pdf?pdfFileName=${pdfFileName}`);
//     let blobData = await response.blob();

//     if (!blobData) return;

//     let url = URL.createObjectURL(blobData);

//     let link = document.createElement("a");
//     link.href = url;
//     link.download = pdfFileName;

//     link.click();
    
//     URL.revokeObjectURL(url);
// }

const viewPDF = (driveFileID) => {
    console.log(`https://drive.google.com/file/d/${driveFileID}/view`)
    window.open(`https://drive.google.com/file/d/${driveFileID}/view`, "_blank");
}

document.getElementById("searchButton").addEventListener("click", performSearch);
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});

["all-collections", "nejac-minutes", "epa-budget-justifications", "collection-3"].forEach((indexName) => {
    let selectorID = `${indexName}-selector`;
    let dropdownSelectorButton = document.getElementById(selectorID);

    dropdownSelectorButton.onclick = () => {
        collectionSelector = indexName;
        document.getElementById("collectionDropdownMenuButton").innerHTML = dropdownSelectorButton.innerHTML;
    }
    
})