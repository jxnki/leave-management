if(localStorage.getItem("role") !== "employee")
{
    window.location.href = "login.html";
}
document.getElementById("applyBtn").addEventListener("click", () => {
        localStorage.removeItem("leaveId");
        window.location.href = "leave.html";
    });

document.getElementById("historyBtn").addEventListener("click", () => {

        window.location.href ="history.html";
    });

document.getElementById("logoutBtn").addEventListener("click", logout);

function logout()
{
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}