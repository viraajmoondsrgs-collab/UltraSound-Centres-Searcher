const fatherCentre = {
    name: "Metro Diagnostic & Research Centre",
    lat: 28.4595,
    lon: 77.0185,
    address: "11-A, Basai Road, Opp. Tirath Ram Hospital, Model Town, Sector 11, Gurugram, Haryana 122018",
    phone: "+91 9599828384"
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function searchByText() {
    const resultsContainer = document.getElementById('results');
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert("Please enter a city name first!");
        return;
    }

    resultsContainer.innerHTML = "<p>Searching for " + query + "...</p>";

    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
        const res = await fetch(geoUrl);
        const data = await res.json();

        if (data.length > 0) {
            displayAll(parseFloat(data[0].lat), parseFloat(data[0].lon));
        } else {
            resultsContainer.innerHTML = "<p>City not found. Try searching for 'Rohtak' or 'Delhi'.</p>";
        }
    } catch (err) {
        resultsContainer.innerHTML = "<p>Error connecting to search service.</p>";
    }
}

function useDeviceLocation() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "<p>Accessing GPS...</p>";

    navigator.geolocation.getCurrentPosition((position) => {
        displayAll(position.coords.latitude, position.coords.longitude);
    }, (error) => {
        resultsContainer.innerHTML = "<p>GPS Error: " + error.message + ". Try typing a city instead.</p>";
    });
}

function displayAll(targetLat, targetLon) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "";
    
    const distToFather = calculateDistance(targetLat, targetLon, fatherCentre.lat, fatherCentre.lon).toFixed(2);
    
    resultsContainer.innerHTML += `
        <div style="border: 3px solid #007bff; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: #e7f3ff;">
            <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">⭐ FEATURED</span>
            <h2>${fatherCentre.name}</h2>
            <p>📍 ${fatherCentre.address}</p>
            <p>📞 <a href="tel:${fatherCentre.phone}">${fatherCentre.phone}</a></p>
            <p>📏 <strong>${distToFather} km from search area</strong></p>
            <a href="https://www.google.com/maps/search/?api=1&query=${fatherCentre.lat},${fatherCentre.lon}" target="_blank" style="display: inline-block; background: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Get Directions</a>
        </div>
        <hr>
        <h3>Other Nearby Centres</h3>
    `;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node["healthcare"="ultrasound"](around:20000,${targetLat},${targetLon});out;`;
    
    fetch(overpassUrl)
        .then(res => res.json())
        .then(data => {
            if (!data.elements || data.elements.length === 0) {
                resultsContainer.innerHTML += "<p>No other centres found within 20km.</p>";
                return;
            }
            data.elements.forEach(place => {
                if (place.tags && place.tags.name !== fatherCentre.name) {
                    const d = calculateDistance(targetLat, targetLon, place.lat, place.lon).toFixed(2);
                    resultsContainer.innerHTML += `
                        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                            <h3>${place.tags.name || "Diagnostic Centre"}</h3>
                            <p>📏 ${d} km away</p>
                        </div>
                    `;
                }
            });
        });
}