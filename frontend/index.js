let searchQuery = "";
let searchResults = [];

const performSearch = async () => {
    searchQuery = document.getElementById("searchInput").value;

    // Display loading spinner
    document.getElementById("searchResults").innerHTML = '<div class="spinner-border text-center" role="status"></div>';
    
    let response = await fetch(`http://localhost:5000/search?query=${searchQuery}`);
    let data = await response.json();
    console.log(data);

    searchResults = data;

    let searchResultsContainer = document.getElementById("searchResults");

    if (searchResults.length === 0) {
        searchResultsContainer.innerHTML = `<p>No results found for ${searchQuery}.</p>`;
        return;
    }

    searchResultsContainer.innerHTML = "<p>Showing results for: " + searchQuery + "</p>";

    displaySearchResults();
}

const displaySearchResults = () => {
    let searchResultsContainer = document.getElementById("searchResults");

    let resultList = document.createElement("ul");
    resultList.classList.add("list-group");

    searchResults.forEach((result) => {
        let listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "mb-3", "border", "rounded");

        let resultTitle = document.createElement("h5");
        resultTitle.classList.add("mb-1");
        resultTitle.textContent = result._source.name;

        // create the button group
        let buttonGroup = document.createElement("span");
        buttonGroup.classList.add("btn-group", "btn-group-sm");

        let viewButton = document.createElement("button");
        viewButton.classList.add("btn", "btn-outline-primary");
        // viewButton.innerHTML = '<i class="bi bi-eye"></i>';
        viewButton.innerHTML = 'View';
    
        let downloadButton = document.createElement("button");
        downloadButton.classList.add("btn", "btn-outline-primary");
        // downloadButton.innerHTML = '<i class="bi bi-download"></i>';
        downloadButton.innerHTML = 'Download';

        viewButton.onclick = (event) => {showPDFModal(result.bytes.data)}
        viewButton.setAttribute("data-toggle", "modal");
        viewButton.setAttribute("data-target", "resultModal");

        buttonGroup.appendChild(viewButton);
        buttonGroup.appendChild(downloadButton);

        let occurrencesText = document.createElement("p");
        occurrencesText.classList.add("mb-1");
        occurrencesText.innerHTML = `Total search word occurrences: ${result.occurrences}`;

        // highlights text
        let resultText = document.createElement("p");
        resultText.classList.add("mb-1");
        result.highlight.text.forEach((text) => {
            resultText.textContent += text.replace(/(<([^>]+)>)/gi, "") + "\n";
        })

        listItem.appendChild(resultTitle);
        listItem.appendChild(buttonGroup);
        listItem.appendChild(occurrencesText);
        listItem.appendChild(resultText);

        resultList.appendChild(listItem);
    });

    searchResultsContainer.appendChild(resultList);


    let instance = new Mark(resultList);
    instance.mark(searchQuery, {separateWordSearch: false});
}

const showPDFModal = (pdfBytes) => {
    let modalTitle = document.getElementById("modalTitle");
    let modalBody = document.getElementById("modalBody");
    let modalCanvas = document.getElementById("modalCanvas");

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

    eventBus.on('pagesloaded', function() {
        console.log('All pages have been loaded');
    });

    // eventBus.on('pagerendered', function(event) {
    //     const { pageNumber } = event;
    //     console.log(`Page ${pageNumber} has been rendered`);
    // });

    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    loadingTask.promise.then((pdfDocument) => {
        pdfViewer.setDocument(pdfDocument);
    }).catch(err => console.log(err))

    let modal = new bootstrap.Modal(document.getElementById("resultModal"));
    modal.show();
}

document.getElementById("searchButton").addEventListener("click", performSearch);
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});