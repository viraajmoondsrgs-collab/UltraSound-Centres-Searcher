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

function findNearest() {
    const resultsContainer = document.getElementById('results');
    
    if (!resultsContainer) {
        console.error("Results container not found in HTML");
        return;
    }

    resultsContainer.innerHTML = "<p>Locating...</p>";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const uLat = position.coords.latitude;
            const uLon = position.coords.longitude;
            
            resultsContainer.innerHTML = "";
            
            const d = calculateDistance(uLat, uLon, fatherCentre.lat, fatherCentre.lon).toFixed(2);
            
            resultsContainer.innerHTML += `
                <div class="centre-card featured" style="border: 3px solid #007bff; background-color: #e7f3ff; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: left;">
                    <span class="badge" style="background: #007bff; color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem;">⭐ FEATURED CENTRE</span>
                    <h2 style="margin-top: 10px;">${fatherCentre.name}</h2>
                    <p>📍 ${fatherCentre.address}</p>
                    <p>📞 <a href="tel:${fatherCentre.phone}">${fatherCentre.phone}</a></p>
                    <p>📏 <strong>${d} km from your location</strong></p>
                    <a href="https://www.google.com/maps/search/?api=1&query=${fatherCentre.lat},${fatherCentre.lon}" target="_blank" class="maps-btn" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px;">Get Directions</a>
                </div>
                <hr>
                <h3 style="margin: 20px 0;">Other Nearby Options</h3>
            `;

            const query = `[out:json];node["healthcare"="ultrasound"](around:20000, ${uLat}, ${uLon});out;node["amenity"="clinic"](around:20000, ${uLat}, ${uLon});out;`;
            const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (!data.elements || data.elements.length === 0) {
                        resultsContainer.innerHTML += "<p>No other centres found within 20km.</p>";
                        return;
                    }
                    data.elements.forEach(place => {
                        if (place.tags && place.tags.name !== fatherCentre.name) {
                            const dist = calculateDistance(uLat, uLon, place.lat, place.lon).toFixed(2);
                            resultsContainer.innerHTML += `
                                <div class="centre-card" style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; text-align: left;">
                                    <h3>${place.tags.name || "Diagnostic Centre"}</h3>
                                    <p>📏 ${dist} km away</p>
                                    <a href="https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}" target="_blank" style="color: #007bff; text-decoration: none;">View Map</a>
                                </div>
                            `;
                        }
                    });
                })
                .catch(err => {
                    resultsContainer.innerHTML += "<p>Error loading other centres.</p>";
                });
        },
        (error) => {
            console.error("Geolocation Error:", error);
            if (error.code === 1) {
                resultsContainer.innerHTML = "Location access denied. Please enable location in your browser settings.";
            } else {
                resultsContainer.innerHTML = "Location error. Please try again or check your GPS.";
            }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}