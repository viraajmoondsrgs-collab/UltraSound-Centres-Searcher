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
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function searchByText() {
    const resultsContainer = document.getElementById('results');
    const query = document.getElementById('searchInput').value.trim();
    if (!query) { alert("Please enter a city name!"); return; }

    resultsContainer.innerHTML = "<p>Searching for " + query + "...</p>";

    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
        const res = await fetch(geoUrl);
        const data = await res.json();
        if (data.length > 0) {
            displayAll(parseFloat(data[0].lat), parseFloat(data[0].lon));
        } else {
            resultsContainer.innerHTML = "<p>City not found.</p>";
        }
    } catch (err) {
        resultsContainer.innerHTML = "<p>Service busy. Please try again.</p>";
    }
}

function useDeviceLocation() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "<p>Accessing GPS...</p>";
    navigator.geolocation.getCurrentPosition((position) => {
        displayAll(position.coords.latitude, position.coords.longitude);
    }, (error) => {
        resultsContainer.innerHTML = "<p>GPS Error: Please type a city name.</p>";
    });
}

function displayAll(targetLat, targetLon) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "";
    
    // 1. Double Disclaimer
    resultsContainer.innerHTML += `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba; font-size: 0.85rem; color: #856404;">
            <p style="margin: 0 0 10px 0;"><strong>Medical Disclaimer:</strong> Please call facilities directly to confirm ultrasound availability before visiting.</p>
            <p style="margin: 0;"><strong>Technical Note:</strong> We use a public mapping service. If the list below fails to load, the service may be busy—please try again in a few moments.</p>
        </div>
        <h3>Nearby Facilities (Sorted by Distance)</h3>
        <div id="list-container">Loading...</div>
    `;

    // 2. Fetch Other Results
    const query = `[out:json][timeout:15];(node["amenity"~"hospital|clinic"](around:15000,${targetLat},${targetLon}););out 20;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    fetch(overpassUrl)
        .then(res => res.json())
        .then(data => {
            let allPlaces = [];

            // Add Father's Centre to the array
            allPlaces.push({
                name: fatherCentre.name,
                address: fatherCentre.address,
                phone: fatherCentre.phone,
                lat: fatherCentre.lat,
                lon: fatherCentre.lon,
                distance: calculateDistance(targetLat, targetLon, fatherCentre.lat, fatherCentre.lon)
            });

            // Add API results to the array
            if (data.elements) {
                data.elements.forEach(place => {
                    if (place.tags && place.tags.name && place.tags.name !== fatherCentre.name) {
                        allPlaces.push({
                            name: place.tags.name,
                            address: "Contact for address",
                            phone: null,
                            lat: place.lat,
                            lon: place.lon,
                            distance: calculateDistance(targetLat, targetLon, place.lat, place.lon)
                        });
                    }
                });
            }

            // 3. SORT BY DISTANCE
            allPlaces.sort((a, b) => a.distance - b.distance);

            // 4. RENDER
            const listDiv = document.getElementById('list-container');
            listDiv.innerHTML = "";
            
            allPlaces.forEach(place => {
                listDiv.innerHTML += `
                    <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: white;">
                        <h4 style="margin: 0;">${place.name}</h4>
                        <p style="margin: 5px 0; font-size: 0.85rem; color: #666;">📏 ${place.distance.toFixed(2)} km away</p>
                        ${place.phone ? `<p style="margin: 5px 0; font-size: 0.85rem;">📞 <a href="tel:${place.phone}">${place.phone}</a></p>` : ''}
                        <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" style="font-size: 0.8rem; color: #007bff; text-decoration: none; font-weight: bold;">View on Map</a>
                    </div>
                `;
            });
        })
        .catch(err => {
            // Fallback: If API fails, at least show Father's Centre
            const dToFather = calculateDistance(targetLat, targetLon, fatherCentre.lat, fatherCentre.lon);
            document.getElementById('list-container').innerHTML = `
                <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: white;">
                    <h4 style="margin: 0;">${fatherCentre.name}</h4>
                    <p style="margin: 5px 0;">📏 ${dToFather.toFixed(2)} km away</p>
                    <a href="https://www.google.com/maps/search/?api=1&query=${fatherCentre.lat},${fatherCentre.lon}" target="_blank" style="font-size: 0.8rem; color: #007bff;">View on Map</a>
                </div>
                <p style="color: red; font-size: 0.8rem;">Note: Other nearby facilities couldn't load right now. Please try again later.</p>
            `;
        });
}