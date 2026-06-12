// Load the table immediately when the page opens
loadLeaves();

// AUTO-REFRESH: Silently reload the table data every 5 seconds (5000 ms)
setInterval(loadLeaves, 2000);

function editLeave(id)
{
    localStorage.setItem("leaveId", id);
    window.location.href = "leave.html";
}

async function loadLeaves()
{
    const userId = localStorage.getItem("userId");
    
    // Fetch the latest data from the backend
    const response = await fetch(`http://localhost:3000/leave/user/${userId}`);
    const leaves = await response.json();
    
    const table = document.getElementById("leaveTable");

    table.innerHTML = "";

    // Loop through the fresh data and draw the rows
    leaves.forEach(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString("en-GB");
        const endDate = new Date(leave.end_date).toLocaleDateString("en-GB");

        table.innerHTML += `
        <tr>
            <td>${leave.id}</td>
            <td style="text-transform: capitalize;">${leave.leave_type}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${leave.reason}</td>
            <td><strong>${leave.status}</strong></td>
            <td>
                ${
                    leave.status === "Pending"
                    ? `<button onclick="editLeave(${leave.id})">Edit</button>`
                    : "-"
                }
            </td>
        </tr>
        `;
    });
}

document.getElementById("dashboardBtn").addEventListener("click", () => window.location.href = "employee.html");
document.getElementById("applyBtn").addEventListener("click", () => {
    localStorage.removeItem("leaveId");
    window.location.href = "leave.html";
});
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
});