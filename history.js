loadLeaves();
new Date(leave.start_date)
    .toLocaleDateString()
function editLeave(id)
{
    localStorage.setItem("leaveId",id);

    window.location.href = "leave.html";
}

async function loadLeaves()
{
    const userId =
        localStorage.getItem("userId");

    const response =
        await fetch(
            `http://localhost:3000/leave/user/${userId}`
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
            <td>${leave.leave_type}</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${leave.reason}</td>
            <td>${leave.status}</td>
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