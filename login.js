document
    .getElementById("loginBtn")
    .addEventListener("click", login);

async function login() {

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

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

    const result = await response.json();
    if(result.message === "Login Successful")
    {
        localStorage.setItem(
            "userId",
            result.userId
        );

        localStorage.setItem(
            "role",
            result.role
        );
        if(result.role === "employee")
        {
            window.location.href = "employee.html";
        }
        else
        {
            window.location.href = "manager.html";
        }
    }
    document.getElementById("message").innerText = result.message;
}