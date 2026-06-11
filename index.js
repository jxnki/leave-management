document
    .getElementById("employeeBtn")
    .addEventListener("click", () => {

        localStorage.setItem(
            "loginRole",
            "employee"
        );

        window.location.href =
            "login.html";
    });

document
    .getElementById("managerBtn")
    .addEventListener("click", () => {

        localStorage.setItem(
            "loginRole",
            "manager"
        );

        window.location.href =
            "login.html";
    });