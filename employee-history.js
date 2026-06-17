if(localStorage.getItem("role") !== "manager") {
    window.location.href = "login.html";
}

loadEmployeeSummary();

async function loadEmployeeSummary() {
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:3000/employees/leave-summary", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const summary = await response.json();

    const table = document.getElementById("employeeTable");
    table.innerHTML = "";

    summary.forEach(emp => {
        table.innerHTML += `
        <tr>
            <td>${emp.name}</td>
            <td>${emp.totalLeaves}</td>
            <td>${emp.leavesTaken}</td>
            <td>${emp.remainingLeaves}</td>
        </tr>
        `;
    });
}

document.getElementById("btnPending").addEventListener("click", () => window.location.href = "manager.html?status=Pending");
document.getElementById("btnApproved").addEventListener("click", () => window.location.href = "manager.html?status=Approved");
document.getElementById("btnRejected").addEventListener("click", () => window.location.href = "manager.html?status=Rejected");

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    window.location.href = "index.html";
});
