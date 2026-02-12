function findNearest() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "<p>Searching open database...</p>";

    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const query = `
            [out:json];
            node["healthcare"="ultrasound"](around:10000, ${lat}, ${lon});
            out;
            node["amenity"="clinic"](around:10000, ${lat}, ${lon});
            out;
        `;
        
        const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                displayOSMResults(data.elements, lat, lon);
            })
            .catch(() => {
                resultsContainer.innerHTML = "Error fetching data.";
            });
    });
}

function displayOSMResults(elements, userLat, userLon) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "";

    if (elements.length === 0) {
        resultsContainer.innerHTML = "No centres found within 10km.";
        return;
    }

    elements.forEach(place => {
        const name = place.tags.name || "Unnamed Ultrasound Centre";
        const dist = calculateDistance(userLat, userLon, place.lat, place.lon).toFixed(2);

        resultsContainer.innerHTML += `
            <div class="centre-card">
                <h3>${name}</h3>
                <p>📏 ${dist} km away</p>
                <a href="https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}" target="_blank" class="maps-btn">View on Map</a>
            </div>
        `;
    });
}