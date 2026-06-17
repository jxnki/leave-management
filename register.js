document
    .getElementById("registerBtn")
    .addEventListener("click", register);

async function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("message");

    const response = await fetch(
        "http://localhost:3000/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role: "employee"
            })
        });

    const result = await response.text();
    messageEl.innerText = result;

    if (result === "User registered") {
        messageEl.style.color = "#6E8E59"; // Change text to green palette on success
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000); 
    } else {
        messageEl.style.color = "var(--danger)"; // Ensure it uses your danger/red palette color for errors
    }
}
    
const registerInputs = document.querySelectorAll('#name, #email, #password');

registerInputs.forEach(input => {
    input.addEventListener('keypress', function(event) {
        // Check if the key pressed was "Enter"
        if (event.key === 'Enter') {
            event.preventDefault(); 
            document.getElementById('registerBtn').click(); // Digitally clicks the register button!
        }
    });
});

// Add this right at the bottom of your register.js file
document.getElementById("toggleRegPassword").addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.innerText = "Hide";
    } else {
        passwordInput.type = "password";
        this.innerText = "Show";
    }
});