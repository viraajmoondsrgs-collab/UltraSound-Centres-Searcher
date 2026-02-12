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
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = "<p>Locating...</p>";

    navigator.geolocation.getCurrentPosition((position) => {
        const uLat = position.coords.latitude;
        const uLon = position.coords.longitude;
        resultsContainer.innerHTML = "";
        
        const d = calculateDistance(uLat, uLon, fatherCentre.lat, fatherCentre.lon).toFixed(2);
        
        resultsContainer.innerHTML += `
            <div class="centre-card featured" style="border: 3px solid #007bff; padding: 20px; margin-bottom: 20px; border-radius: 10px; background: #e7f3ff;">
                <span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">⭐ FEATURED</span>
                <h2>${fatherCentre.name}</h2>
                <p>📍 ${fatherCentre.address}</p>
                <p>📞 <a href="tel:${fatherCentre.phone}">${fatherCentre.phone}</a></p>
                <p>📏 <strong>${d} km away</strong></p>
                <a href="https://www.google.com/maps/search/?api=1&query=${fatherCentre.lat},${fatherCentre.lon}" target="_blank" style="display: inline-block; background: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Get Directions</a>
            </div>
            <hr>
            <h3>Other Nearby Centres</h3>
        `;

        const query = `[out:json];node["healthcare"="ultrasound"](around:20000, ${uLat}, ${uLon});out;`;
        fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query))
            .then(res => res.json())
            .then(data => {
                data.elements.forEach(place => {
                    if (place.tags && place.tags.name !== fatherCentre.name) {
                        const dist = calculateDistance(uLat, uLon, place.lat, place.lon).toFixed(2);
                        resultsContainer.innerHTML += `
                            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                                <h3>${place.tags.name || "Diagnostic Centre"}</h3>
                                <p>📏 ${dist} km away</p>
                            </div>
                        `;
                    }
                });
            });
    }, (error) => {
        resultsContainer.innerHTML = "Error: Please enable location access.";
    });
}