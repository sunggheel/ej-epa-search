const performSearch = async () => {
    let searchQuery = document.getElementById("searchInput").value;
    
    let response = await fetch(`http://localhost:5000/search?query=${searchQuery}`);
    let data = await response.json();
    console.log(data);

    displaySearchResults(searchQuery, data);
}

const displaySearchResults = (searchQuery, searchResults) => {
    let searchResultsContainer = document.getElementById("searchResults");
    searchResultsContainer.innerHTML = "<p>Showing results for: " + searchQuery + "</p>";

    if (searchResults.length === 0) {
        searchResultsContainer.innerHTML = `<p>No results found for ${searchQuery}.</p>`;
        return;
    }

    let resultList = document.createElement("ul");
    resultList.classList.add("list-group");

    searchResults.forEach(function(result) {
        let listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "mb-3", "border", "rounded");

        let resultTitle = document.createElement("h5");
        resultTitle.classList.add("mb-1");
        resultTitle.textContent = result._source.name;

        let resultText = document.createElement("p");
        resultText.classList.add("mb-1");

        result.highlight.text.forEach((text) => {
            resultText.textContent += text.replace(/(<([^>]+)>)/gi, "") + "\n";
        })

        listItem.appendChild(resultTitle);
        listItem.appendChild(resultText);
        resultList.appendChild(listItem);
    });

    searchResultsContainer.appendChild(resultList);


    let instance = new Mark(resultList);
    instance.mark(searchQuery, {separateWordSearch: false});
}

document.getElementById("searchButton").addEventListener("click", performSearch);
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});