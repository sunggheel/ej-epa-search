document.getElementById("searchButton").addEventListener("click", performSearch);
document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});

const performSearch = async () => {
    let searchQuery = document.getElementById("searchInput").value;
    // Here, you can perform the necessary search operations using the searchQuery

    let response = await fetch(`http://localhost:5000/search?query=${searchQuery}`);
    console.log(response);

    displaySearchResults(response);
}

const displaySearchResults = (data) => {
    let searchResultsContainer = document.getElementById("searchResults");
    searchResultsContainer.innerHTML = "<p>Showing results for: " + searchQuery + "</p>";
    // You can dynamically populate the search results based on the searchQuery
    // For simplicity, we are just displaying the search query here


}

const constructSearchResults = (data) => {

}