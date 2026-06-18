const selectedRole =
    localStorage.getItem("loginRole");

if(selectedRole === "employee")
{
    document.getElementById("pageTitle")
        .innerText =
        "Employee Login";
}
else
{
    document.getElementById("pageTitle")
        .innerText =
        "Manager Login";
}
document
    .getElementById("loginBtn")
    .addEventListener("click", login);

const registerBtn = document.getElementById("registerBtn");

// Managers should not be able to register new accounts
if (selectedRole === "manager" && registerBtn) {
    registerBtn.style.display = "none";
}

if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        window.location.href = "register.html";
    });
}


async function login() {

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    // Enforce that this page only allows the intended role to login.
    // index.html sets localStorage.loginRole via employeeBtn / managerBtn.
    const selectedRole = localStorage.getItem("loginRole");


    const response = await fetch(
        "http://localhost:3000/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const data = await response.json();

        if (data.message === "Login successful") {
            // Enforce role-based access: only allow login that matches the page selection.
            // index.html sets localStorage.loginRole to "employee" or "manager".
            if (selectedRole && data.role !== selectedRole) {
                document.getElementById("message").innerText = `Please login using the ${selectedRole} account.`;
                return;
            }

            // 1. Put the wristband in the browser's pocket!
            localStorage.setItem("token", data.token); 

            // 2. Save the other details so the dashboard can use them
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("role", data.role);
            localStorage.setItem("userName", data.userName);


            // 3. Look at the role, and push them to the correct page
            if (data.role === "manager") {
                window.location.href = "manager.html";
            } else {
                window.location.href = "employee.html";
            }
        } 
        else {
            document.getElementById("message").innerText = data.message;
        }
}

const loginInputs = document.querySelectorAll('#email, #password');

// Loop through them and add a listener to each one
loginInputs.forEach(input => {
    input.addEventListener('keypress', function(event) {
        // Check if the key pressed was "Enter"
        if (event.key === 'Enter') {
            event.preventDefault(); // Stops the browser from doing default things
            document.getElementById('loginBtn').click(); // Digitally clicks the login button!
        }
    });
});

// Add this right at the bottom of your login.js file
document.getElementById("toggleLoginPassword").addEventListener("click", function () {
    const passwordInput = document.getElementById("password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        this.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        this.textContent = "Show";
    }
});

// Initialize button label to match initial state (password hidden)
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("toggleLoginPassword");
    const passwordInput = document.getElementById("password");
    if (!btn || !passwordInput) return;

    btn.textContent = passwordInput.type === "password" ? "Show" : "Hide";
});
