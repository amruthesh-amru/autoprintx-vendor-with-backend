document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("signup-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await window.electron.signup({ email, password });
            if (response.success) {
                alert("Signup successful! Redirecting to login...");
                window.electron.navigateToLogin();
            } else {
                alert("Signup failed: " + response.message);
            }
        } catch (error) {
            alert("Error signing up: " + error.message);
        }
    });

    document.getElementById("go-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        window.electron.navigateToLogin();
    });
});
