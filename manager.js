if(localStorage.getItem("role") !== "manager")
{
    window.location.href = "login.html";
}
loadPendingLeaves();
async function approveLeave(id)
{
    await fetch(
        `http://localhost:3000/leave/approve/${id}`,
        {
            method: "PUT"
        }
    );

    location.reload();
}

async function rejectLeave(id)
{
    await fetch(
        `http://localhost:3000/leave/reject/${id}`,
        {
            method: "PUT"
        }
    );

    location.reload();
}

async function loadPendingLeaves()
{
    const response =
        await fetch(
            "http://localhost:3000/leave/pending"
        );

    const leaves =
        await response.json();

    const table =
        document.getElementById("leaveTable");

    leaves.forEach(leave => {
        const startDate = new Date(leave.start_date).toLocaleDateString("en-GB");

        const endDate = new Date(leave.end_date).toLocaleDateString("en-GB");

        table.innerHTML += `
        <tr>
            <td>${leave.id}</td>
            <td>${leave.user_id}</td>
            <td>${leave.name}</td>
            <td>${leave.leave_type}</td>
            <td>${leave.reason}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${leave.status}</td>
            <td>
                <button onclick="approveLeave(${leave.id})">
                    Approve
                </button>

                <button onclick="rejectLeave(${leave.id})">
                    Reject
                </button>
            </td>
        </tr>
        `;
    });
}