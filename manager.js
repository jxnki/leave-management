if(localStorage.getItem("role") !== "manager") {
    window.location.href = "login.html";
}

let allLeaves = []; // Cache of ALL leaves (Approved, Pending, Rejected) - used for Approved/Rejected tabs

// Check if we were navigated here with a specific tab requested (e.g. from employee-history.html)
const urlParams = new URLSearchParams(window.location.search);
const requestedStatus = urlParams.get("status") || "Pending";

filterLeaves(requestedStatus); // Show the requested tab (defaults to Pending)

async function loadAllLeaves() {
    const token = localStorage.getItem("token");

    // Fetch ALL leaves (Approved, Pending, and Rejected)
    const response = await fetch("http://localhost:3000/leave", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    allLeaves = await response.json();
}

async function loadPendingLeaves() {
    try {
        const token = localStorage.getItem("token");

        // Use the dedicated endpoint for Pending leaves
        const response = await fetch("http://localhost:3000/leave/pending", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const pendingLeaves = await response.json();

        renderLeaves("Pending", pendingLeaves);
    } catch (err) {
        console.log(err);
        showLoadError();
    }
}

function filterLeaves(status) {
    if (status === "Pending") {
        loadPendingLeaves();
        return;
    }

    // Approved / Rejected still come from the full cached list, refreshed each time the tab is opened
    loadAllLeaves()
        .then(() => {
            const filtered = allLeaves.filter(leave => leave.status === status);
            renderLeaves(status, filtered);
        })
        .catch((err) => {
            console.log(err);
            showLoadError();
        });
}

function showLoadError() {
    // Something went wrong fetching data - reveal the page with a clear error instead of staying blank
    document.getElementById("tableTitle").innerText = "Unable to Load Leave Requests";
    document.getElementById("leaveTable").innerHTML =
        `<tr><td colspan="9" style="text-align: center;">Something went wrong while loading data. Please check your connection and try refreshing the page.</td></tr>`;
    document.getElementById("mainContent").style.visibility = "visible";
}

function renderLeaves(status, leavesToShow) {
    // 1. Update the Title
    document.getElementById("tableTitle").innerText = `${status} Leave Requests`;
    
    // 2. Update Sidebar Active Button
    document.getElementById("btnPending").className = status === "Pending" ? "btn-primary" : "btn-outline";
    document.getElementById("btnApproved").className = status === "Approved" ? "btn-primary" : "btn-outline";
    document.getElementById("btnRejected").className = status === "Rejected" ? "btn-primary" : "btn-outline";

    // 3. Show/Hide headers based on status
    // We only show the "Status" column if we are viewing Pending leaves
    const statusHeader = status === "Pending" ? "<th>Status</th>" : "";
    const actionHeader = status === "Pending" ? '<th id="actionHeader">Action</th>' : "";
    
    // Rebuild the table header dynamically
    const tableHead = document.querySelector("thead");
    tableHead.innerHTML = `
        <tr>
            <th>Req ID</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Start Date</th>
            <th>End Date</th>
            ${statusHeader}
            ${actionHeader}
        </tr>
    `;

    const table = document.getElementById("leaveTable");
    table.innerHTML = ""; 

    leavesToShow.forEach(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString("en-GB");
        const endDate = new Date(leave.end_date).toLocaleDateString("en-GB");

        // Conditionally create the status cell and action buttons
        let statusCell = status === "Pending" ? `<td><strong>${leave.status}</strong></td>` : "";
        let actionButtons = "";
        
        if (status === "Pending") {
            actionButtons = `
                <td>
                    <button onclick="approveLeave(${leave.id})">Approve</button>
                    <button onclick="rejectLeave(${leave.id})">Reject</button>
                </td>
            `;
        }

        table.innerHTML += `
        <tr>
            <td>${leave.id}</td>
            <td>${leave.user_id}</td>
            <td>${leave.name}</td>
            <td style="text-transform: capitalize;">${leave.leave_type}</td>
            <td>${leave.reason}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            ${statusCell}
            ${actionButtons}
        </tr>
        `;
    });

    // Now that the correct tab is fully painted, reveal the page (avoids flashing the wrong tab)
    document.getElementById("mainContent").style.visibility = "visible";
}

// --- Event Listeners ---
document.getElementById("btnPending").addEventListener("click", () => filterLeaves("Pending"));
document.getElementById("btnApproved").addEventListener("click", () => filterLeaves("Approved"));
document.getElementById("btnRejected").addEventListener("click", () => filterLeaves("Rejected"));
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("btnEmployeeHistory").addEventListener("click", () => {
    window.location.href = "employee-history.html";
});

async function approveLeave(id) {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:3000/leave/approve/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        const message = await response.text();
        alert(message);
        return;
    }

    loadPendingLeaves(); // Refreshes the Pending tab, since this button only appears there
}

async function rejectLeave(id) {
    const reason = prompt("Please provide a reason for rejecting this leave request:");

    // If the manager cancels the prompt, don't reject the leave
    if (reason === null) {
        return;
    }

    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/leave/reject/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rejection_reason: reason })
    });
    loadPendingLeaves(); // Refreshes the Pending tab, since this button only appears there
}

function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    window.location.href = "index.html";
}