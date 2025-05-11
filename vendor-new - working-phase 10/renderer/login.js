document.addEventListener("DOMContentLoaded", () => {
    console.log("Login script loaded!");

    const loginButton = document.getElementById("login-btn");
    const signupLink = document.getElementById("go-to-signup");

    if (!loginButton) {
        console.error("Login button not found!");
        return;
    }

    loginButton.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("Login button clicked!");

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        console.log("Attempting login with:", email, password);

        try {
            const response = await fetch("http://localhost:3000/api/vendor/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Login response:", data);

            if (data.success) {
                // Store token in localStorage
                localStorage.setItem("vendorToken", data.token);
                alert("Login successful!");
                window.location.href = "index.html";
            } else {
                alert("Login failed: " + data.message);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error logging in: " + error.message);
        }
    });

    // 🔥 Fix: Handle navigation to the signup page
    if (signupLink) {
        signupLink.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            window.location.href = "signup.html"; // Navigate to the signup page
        });
    } else {
        console.error("Signup link not found!");
    }
});
