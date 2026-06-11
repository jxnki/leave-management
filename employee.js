if(localStorage.getItem("role") !== "employee")
{
    window.location.href = "login.html";
}
loadDashboard();
async function loadDashboard()
{
    const userId =
        localStorage.getItem("userId");

    const response =
        await fetch(
            `http://localhost:3000/dashboard/${userId}`
        );

    const data =
        await response.json();

    document.getElementById("totalLeaves")
        .innerText =
        `Total Leaves: ${data.totalLeaves}`;

    document.getElementById("leavesTaken")
        .innerText =
        `Leaves Taken: ${data.leavesTaken}`;

    document.getElementById("remainingLeaves")
        .innerText =
        `Remaining Leaves: ${data.remainingLeaves}`;
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