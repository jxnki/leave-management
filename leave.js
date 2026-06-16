document.getElementById("submitBtn").addEventListener("click", applyLeave);

const leaveId = localStorage.getItem("leaveId");

if(leaveId)
{
    loadLeave(leaveId);
}
async function loadLeave(id) {
    const token = localStorage.getItem("token"); 
    const response = await fetch(`http://localhost:3000/leave/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` 
        }
    });
    const leave =
        await response.json();

    document.getElementById("leave-type").value =
        leave[0].leave_type;

    document.getElementById("startDate").value =
        leave[0].start_date.split("T")[0];

    document.getElementById("endDate").value =
        leave[0].end_date.split("T")[0];

    document.getElementById("reason").value =
        leave[0].reason;
}

async function applyLeave()
{
    const leave_type =
        document.getElementById("leave-type").value;

    const start_date =
        document.getElementById("startDate").value;

    const end_date =
        document.getElementById("endDate").value;

    const reason =
        document.getElementById("reason").value;

    if(end_date < start_date)
    {
        document.getElementById("message")
            .innerText =
            "End date cannot be before start date";

        return;
    }
    const user_id = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    let response;

    if(leaveId) {
        response = await fetch(`http://localhost:3000/leave/${leaveId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ leave_type, start_date, end_date, reason })
        });
    } 
    else {
        response = await fetch("http://localhost:3000/leave", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ user_id, leave_type, start_date, end_date, reason })
        });
    }

    const result = await response.text();
    if(result === "No leave balance remaining")
    {
        document.getElementById("message")
            .innerText = result;
        setTimeout(() => {
            window.location.href = "employee.html";
        }, 1000);

        return;
    }

    if(leaveId)
    {
        localStorage.removeItem("leaveId");
    }

    window.location.href = "history.html";
}
document.getElementById("dashboardBtn").addEventListener("click", () => window.location.href = "employee.html");
document.getElementById("historyBtn").addEventListener("click", () => window.location.href = "history.html");
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
});

const leaveInputs = document.querySelectorAll('#leave-type, #startDate, #endDate, #reason');

leaveInputs.forEach(input => {
    input.addEventListener('keypress', function(event) {
        // Check if the key pressed was "Enter"
        if (event.key === 'Enter') {
            event.preventDefault(); 
            document.getElementById('submitBtn').click(); // Digitally clicks the submit button!
        }
    });
});
