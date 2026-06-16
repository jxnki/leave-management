// Load the table immediately when the page opens
loadLeaves();

// AUTO-REFRESH: Silently reload the table data every 5 seconds (5000 ms)
setInterval(loadLeaves, 5000);

function editLeave(id)
{
    localStorage.setItem("leaveId", id);
    window.location.href = "leave.html";
}

async function deleteLeave(id)
{
    if (!confirm("Are you sure you want to delete this leave request?")) {
        return;
    }

    const token = localStorage.getItem("token");

    await fetch(`http://localhost:3000/leave/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    loadLeaves();
}

async function loadLeaves()
{
    const userId = localStorage.getItem("userId");
    
    // Fetch the latest data from the backend
    const token = localStorage.getItem("token");

    // 2. Show the wristband to the server!
    const response = await fetch(`http://localhost:3000/leave/user/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });
    const leaves = await response.json();
    
    const table = document.getElementById("leaveTable");

    table.innerHTML = "";

    // Loop through the fresh data and draw the rows
    leaves.forEach(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString("en-GB");
        const endDate = new Date(leave.end_date).toLocaleDateString("en-GB");

        const statusDisplay = leave.status === "Rejected" && leave.rejection_reason
            ? `<strong>${leave.status}</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">Reason: ${leave.rejection_reason}</span>`
            : `<strong>${leave.status}</strong>`;

        table.innerHTML += `
        <tr>
            <td>${leave.id}</td>
            <td style="text-transform: capitalize;">${leave.leave_type}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${leave.reason}</td>
            <td>${statusDisplay}</td>
            <td>
                ${
                    leave.status === "Pending"
                    ? `<button onclick="editLeave(${leave.id})">Edit</button><button onclick="deleteLeave(${leave.id})">Delete</button>`
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
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
});