document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("signup-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const confirmLocation = confirm("This app requires your location. Do you want to proceed?");
        if (!confirmLocation) {
            alert("Signup requires location access. Please allow location services.");
            return;
        }

        try {
            const { lat, lng } = await getGoogleLocation();
            console.log("Location:", { lat, lng });

            const location = {
                type: "Point",
                coordinates: [lng, lat], // Convert to GeoJSON format
            };

            const response = await window.electron.signup({
                email,
                password,
                location, // Now correctly formatted
            });

            if (response.success) {
                alert("Signup successful! Redirecting to login...");
                window.electron.navigateToLogin();
            } else {
                alert("Signup failed: " + response.message);
            }
        } catch (error) {
            alert("Error fetching location: " + error.message);
        }
    });

    document.getElementById("go-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        window.electron.navigateToLogin();
    });
});


// Fetch location using Google Geolocation API
async function getGoogleLocation() {
    const apiKey = "AIzaSyDMQAKYOrdxqvNruGVAC8DF7Rifz649oRg"; // Ensure it's defined
    const url = `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ considerIp: true }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get location: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.location) {
            throw new Error("Google API did not return a valid location.");
        }

        console.log("Location:", data.location);
        return { lat: data.location.lat, lng: data.location.lng }; // Ensure correct structure
    } catch (error) {
        console.error("Error fetching location:", error);
        alert("Error fetching location: " + error.message);
    }
}
