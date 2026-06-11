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

if(selectedRole === "manager")
{
    document
        .getElementById("registerBtn")
        .style.display = "none";
}
document
    .getElementById("registerBtn")
    .addEventListener("click", () => {

        window.location.href =
            "register.html";
    });
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
        localStorage.setItem("userId",result.userId);

        localStorage.setItem("role",result.role);
        if(selectedRole === "employee" && result.role !== "employee")
        {
            document.getElementById("message").innerText ="Please use the Manager Portal";

            return;
        }

        if(selectedRole === "manager" &&result.role !== "manager")
        {
            document.getElementById("message").innerText ="Please use the Employee Portal";

            return;
        }

        if(result.role === "employee")
        {
            window.location.href ="employee.html";
        }
        else
        {
            window.location.href ="manager.html";
        }
    }
    document.getElementById("message").innerText = result.message;
}