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
    
    const distToFather = calculateDistance(targetLat, targetLon, fatherCentre.lat, fatherCentre.lon).toFixed(2);
    
    // 1. Disclaimer Notice
    resultsContainer.innerHTML += `
        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba; font-size: 0.9rem;">
            <strong>Note:</strong> While many hospitals and clinics listed below usually offer imaging, please call them directly to confirm they have an ultrasound facility available before visiting.
        </div>
    `;

    // 2. Featured Centre (Your Dad's Place)
    resultsContainer.innerHTML += `
        <div class="featured-card" style="border: 3px solid #007bff; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: #e7f3ff;">
            <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">⭐ VERIFIED FACILITY</span>
            <h2 style="margin-bottom: 5px;">${fatherCentre.name}</h2>
            <p style="margin: 5px 0;">📍 ${fatherCentre.address}</p>
            <p style="margin: 5px 0;">📞 <a href="tel:${fatherCentre.phone}">${fatherCentre.phone}</a></p>
            <p style="margin: 5px 0;">📏 <strong>${distToFather} km from search area</strong></p>
            <a href="https://www.google.com/maps/search/?api=1&query=${fatherCentre.lat},${fatherCentre.lon}" target="_blank" style="display: inline-block; background: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Get Directions</a>
        </div>
        <hr style="border-top: 1px dashed #ccc; margin: 20px 0;">
        <h3>Other Nearby Facilities</h3>
    `;

    // 3. Broad Overpass Query (Clinics, Hospitals, Doctors)
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
            if (!data.elements || data.elements.length === 0) {
                resultsContainer.innerHTML += "<p>No other medical centres found in this 20km radius.</p>";
                return;
            }
            
            data.elements.forEach(place => {
                if (place.tags && place.tags.name && place.tags.name !== fatherCentre.name) {
                    const d = calculateDistance(targetLat, targetLon, place.lat, place.lon).toFixed(2);
                    resultsContainer.innerHTML += `
                        <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                            <h3 style="margin: 0;">${place.tags.name}</h3>
                            <p style="margin: 5px 0; color: #666;">📏 ${d} km away</p>
                            <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" style="font-size: 0.9rem; color: #007bff; text-decoration: none;">View on Map</a>
                        </div>
                    `;
                }
            });
        })
        .catch(err => {
            resultsContainer.innerHTML += "<p>Could not load additional results.</p>";
        });
}