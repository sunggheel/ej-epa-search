const isProduction = window.location.hostname !== "localhost";
const protocol = isProduction ? "https://" : "http://";
const baseUrl = protocol + window.location.host;
const apiUrl = `${baseUrl}/api`;

let searchQuery = "";
let searchResults = [];

let collectionName = "all-collections";

let resultsPerPage = 5;
let currentPage = null;

const SORT_DIRECTIONS = { ASCENDING: 1, DESCENDING: -1 };

const performSearch = async () => {
    searchQuery = document.getElementById("searchInput").value;

    // Display loading spinner
    document.getElementById("searchResults").innerHTML = "<div class='spinner-border text-center' role='status'></div>";
    
    try {
        let response = await fetch(`${apiUrl}/search?query=${searchQuery}&collectionName=${collectionName}&page=1`);
        searchResults = await response.json();
        currentPage = 1;
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

    // build the utility bar
    let outerUtilityDiv = document.createElement("div");
    outerUtilityDiv.classList.add("utility-dropdown");

    let summaryDiv = document.createElement("div");
    summaryDiv.classList.add("summary-text")
    summaryDiv.innerHTML = `${searchResults.length} total results`;

    let dropdownDiv = document.createElement("div");
    dropdownDiv.classList.add("dropdown");
    dropdownDiv.innerHTML = "<button class='btn btn-secondary dropdown-toggle ml-auto' type='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>Sort By</button>";

    let dropdownMenu = document.createElement("div");
    dropdownMenu.classList.add("dropdown-menu");

    let sortByHitsASCButton = document.createElement("button");
    sortByHitsASCButton.classList.add("dropdown-item");
    sortByHitsASCButton.innerHTML = "Keyword hits ASC";
    sortByHitsASCButton.onclick = () => {sortResultsByHits(SORT_DIRECTIONS.ASCENDING)}

    let sortByHitsDESCButton = document.createElement("button");
    sortByHitsDESCButton.classList.add("dropdown-item");
    sortByHitsDESCButton.innerHTML = "Keyword hits DESC";
    sortByHitsDESCButton.onclick = () => {sortResultsByHits(SORT_DIRECTIONS.DESCENDING)}

    let sortByDateASCButton = document.createElement("button");
    sortByDateASCButton.classList.add("dropdown-item");
    sortByDateASCButton.innerHTML = "Document date ASC";
    sortByDateASCButton.onclick = () => {sortResultsByDate(SORT_DIRECTIONS.ASCENDING)}

    let sortByDateDESCButton = document.createElement("button");
    sortByDateDESCButton.classList.add("dropdown-item");
    sortByDateDESCButton.innerHTML = "Document date DESC";
    sortByDateDESCButton.onclick = () => {sortResultsByDate(SORT_DIRECTIONS.DESCENDING)}

    dropdownMenu.appendChild(sortByHitsASCButton);
    dropdownMenu.appendChild(sortByHitsDESCButton);
    dropdownMenu.appendChild(sortByDateASCButton);
    dropdownMenu.appendChild(sortByDateDESCButton);

    dropdownDiv.appendChild(dropdownMenu);

    outerUtilityDiv.appendChild(summaryDiv);
    outerUtilityDiv.appendChild(dropdownDiv);

    // build the decade ranges
    let decadeRangeDiv = document.createElement("div");
    decadeRangeDiv.classList.add("summary-text");
    decadeRangeDiv.innerHTML = "Document years: ";

    let oldestYear = Math.min(
        ...searchResults
        .filter(a => a._source.date.split("/")[2] !== "????")
        .map(a => parseInt(a._source.date.split("/")[2]))
    );
    oldestYear = Math.floor(oldestYear / 10) * 10;

    let newestYear = Math.max(
        ...searchResults
        .filter(a => a._source.date.split("/")[2] !== "????")
        .map(a => parseInt(a._source.date.split("/")[2]))
    );
    newestYear = Math.ceil(newestYear / 10) * 10;

    for (let year = oldestYear; year < newestYear; year += 10) {
        let numDocumentsInRange = searchResults
            .filter(a => a._source.date.split("/")[2] !== "????")
            .filter(a => year <= a._source.date.split("/")[2])
            .filter(a => a._source.date.split("/")[2] < year+10)
            .length;

        decadeRangeDiv.innerHTML += `<b>${year}-${year+10}</b>(${numDocumentsInRange}), `;
    }

    // build the results list
    let startingIndex = (currentPage-1) * resultsPerPage;
    searchResults.slice(startingIndex, startingIndex+resultsPerPage).forEach((result) => {
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

        let collectionText = document.createElement("p");
        collectionText.classList.add("mb-1");
        collectionText.innerHTML = `Collection name: ${result._index.replace("-", " ")}`;

        let hitsText = document.createElement("p");
        hitsText.classList.add("mb-1");
        hitsText.innerHTML = `Total search word hits: ${result.hits}`;

        let dateText = document.createElement("p");
        dateText.classList.add("mb-1");
        dateText.innerHTML = `Document date: ${result._source.date}`;

        // highlights text
        let resultText = document.createElement("p");
        resultText.classList.add("mb-1");
        result.highlight.content.slice(0,3).forEach((text) => {
            resultText.innerHTML += text.replace(/(<([^>]+)>)/gi, "") + "\n" + "<br><br>"
        });

        let markInstance = new Mark(resultText);
        markInstance.mark(searchQuery, {separateWordSearch: false});

        listItem.appendChild(resultTitle);
        listItem.appendChild(buttonGroup);
        listItem.appendChild(collectionText);
        listItem.appendChild(hitsText);
        listItem.appendChild(dateText);
        listItem.appendChild(resultText);

        resultList.appendChild(listItem);
    });

    let paginationNav = document.createElement("nav");
    let paginationUl = document.createElement("ul");
    paginationUl.classList.add("pagination");
    paginationUl.classList.add("justify-content-center")
    let totalPages = Math.ceil(searchResults.length / resultsPerPage);

    const changePage = (newPage) => {
        if (1 > newPage && newPage >= totalPages) return;

        currentPage = newPage;
        displaySearchResults();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
    
    let leftArrowLi = document.createElement("li");
    leftArrowLi.classList.add("page-item");
    let leftArrowA = document.createElement("a");
    leftArrowA.classList.add("page-link");
    leftArrowA.href = "";
    leftArrowA.innerHTML = `
        <span aria-hidden="true">&laquo;</span>
        <span class="sr-only">Previous</span>
    `
    leftArrowA.onclick = (event) => {
        event.preventDefault();
        changePage(currentPage-1);
    }
    leftArrowLi.appendChild(leftArrowA);
    paginationUl.appendChild(leftArrowLi);

    for (let page = Math.max(1, currentPage-3); page <= Math.min(totalPages, currentPage+3); page++) {
        let pageLi = document.createElement("li");
        pageLi.classList.add("page-item");
        if (page === currentPage) pageLi.classList.add("active");

        let pageA = document.createElement("a");
        pageA.classList.add("page-link");
        pageA.href = "";
        pageA.innerHTML = page;
        pageA.onclick = (event ) => {
            event.preventDefault();
            changePage(page)
        }

        pageLi.appendChild(pageA);

        paginationUl.appendChild(pageLi);
    }
    let rightArrowLi = document.createElement("li");
    rightArrowLi.classList.add("page-item");
    let rightArrowA = document.createElement("a");
    rightArrowA.classList.add("page-link");
    rightArrowA.href = "";
    rightArrowA.innerHTML = `
        <span aria-hidden="true">&raquo;</span>
        <span class="sr-only">Next</span>
    `
    rightArrowA.onclick = (event) => {
        event.preventDefault();
        changePage(currentPage+1);
    }
    rightArrowLi.appendChild(rightArrowA);
    paginationUl.appendChild(rightArrowLi);

    let smallPaginationText = document.createElement("p");
    smallPaginationText.innerHTML = `Page ${currentPage} of ${totalPages}`;

    paginationNav.appendChild(paginationUl);
    paginationNav.appendChild(smallPaginationText);

    searchResultsContainer.appendChild(outerUtilityDiv);
    searchResultsContainer.appendChild(decadeRangeDiv);
    searchResultsContainer.appendChild(resultList);
    searchResultsContainer.appendChild(paginationNav);
}

const sortResultsByHits = (direction) => {
    searchResults.sort((a,b) => {
        return direction * (a.hits - b.hits);
    });

    displaySearchResults();
}

const sortResultsByDate = (direction) => {
    searchResults.sort((a,b) => {
        // [MM, DD, YYYY]
        let aDateArray = a._source.date.split("/");
        let bDateArray = b._source.date.split("/");
        
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
            if (aDateArray[i] === bDateArray[i]) continue;

            // if mystery date, treat it as the oldest
            if (aDateArray[i].includes("?")) return direction;
            if (bDateArray[i].includes("?")) return -direction;

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
        collectionName = indexName;
        document.getElementById("collectionDropdownMenuButton").innerHTML = dropdownSelectorButton.innerHTML;
    }
    
})