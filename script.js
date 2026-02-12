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
            resultsContainer.innerHTML = "<p>City not found. Try another search.</p>";
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
        resultsContainer.innerHTML = "<p>GPS Error: " + error.message + ". Please type a city name.</p>";
    });
}

function displayAll(targetLat, targetLon) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = "";
    
    // 1. Disclaimer Notice
    resultsContainer.innerHTML += `
        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba; font-size: 0.9rem;">
            <strong>Disclaimer:</strong> Facilities listed below are based on mapping data. Please contact the centre directly to confirm ultrasound availability and appointment timings before visiting.
        </div>
        <h3>Results Sorted by Distance:</h3>
    `;

    // 2. Fetch Nearby Data
    const query = `[out:json];
        (
          node["amenity"="hospital"](around:20000,${targetLat},${targetLon});
          node["amenity"="clinic"](around:20000,${targetLat},${targetLon});
          node["healthcare"="diagnostic_center"](around:20000,${targetLat},${targetLon});
        );
        out;`;
    
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    fetch(overpassUrl)
        .then(res => res.json())
        .then(data => {
            let allPlaces = [];

            // Add Father's Centre to the list with its calculated distance
            const dToFather = calculateDistance(targetLat, targetLon, fatherCentre.lat, fatherCentre.lon);
            allPlaces.push({
                name: fatherCentre.name,
                address: fatherCentre.address,
                phone: fatherCentre.phone,
                lat: fatherCentre.lat,
                lon: fatherCentre.lon,
                distance: dToFather,
                isFeatured: true // We can keep a small badge but not force it to the top
            });

            // Add Overpass results to the list
            if (data.elements) {
                data.elements.forEach(place => {
                    if (place.tags && place.tags.name && place.tags.name !== fatherCentre.name) {
                        const d = calculateDistance(targetLat, targetLon, place.lat, place.lon);
                        allPlaces.push({
                            name: place.tags.name,
                            address: "Address available on map",
                            phone: null,
                            lat: place.lat,
                            lon: place.lon,
                            distance: d,
                            isFeatured: false
                        });
                    }
                });
            }

            // 3. SORT the entire list by distance (Closest first)
            allPlaces.sort((a, b) => a.distance - b.distance);

            // 4. Render the Sorted List
            allPlaces.forEach(place => {
                const isMetro = place.isFeatured;
                resultsContainer.innerHTML += `
                    <div style="border: 1px solid ${isMetro ? '#007bff' : '#ddd'}; 
                                padding: 15px; 
                                margin-bottom: 10px; 
                                border-radius: 8px; 
                                background: ${isMetro ? '#f0f7ff' : '#fff'};">
                        <h3 style="margin: 0;">${place.name} ${isMetro ? '⭐' : ''}</h3>
                        <p style="margin: 5px 0; font-size: 0.9rem; color: #555;">${place.address}</p>
                        <p style="margin: 5px 0;">📏 <strong>${place.distance.toFixed(2)} km away</strong></p>
                        ${place.phone ? `<p style="margin: 5px 0;">📞 <a href="tel:${place.phone}">${place.phone}</a></p>` : ''}
                        <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" style="font-size: 0.9rem; color: #007bff; text-decoration: none; font-weight: bold;">Get Directions</a>
                    </div>
                `;
            });
        })
        .catch(err => {
            resultsContainer.innerHTML += "<p>Could not load results. Please try again.</p>";
        });
}