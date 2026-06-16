document
    .getElementById("registerBtn")
    .addEventListener("click", register);

async function register() {

    const name = document.getElementById("name").value;

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

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

    document.getElementById("message").innerText = result;

    if (result === "User registered") {
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000); // Waits 1 second before redirecting
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
