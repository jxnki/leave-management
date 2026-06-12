if(localStorage.getItem("role") !== "employee")
{
    window.location.href = "login.html";
}
loadDashboard();
async function loadDashboard()
{
    const userId =
        localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    if (userName) {
        // Capitalizes the first letter just in case they typed it in lowercase
        const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);
        document.getElementById("welcomeMessage").innerText = `Welcome, ${formattedName}`;
    }

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
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

// Trigger the chart to load when the page opens
loadEmployeeChart();

async function loadEmployeeChart() {
    const userId = localStorage.getItem("userId");
    
    // Fetch this specific employee's leave history
    const response = await fetch(`http://localhost:3000/leave/user/${userId}`);
    const leaves = await response.json();

    // Set up counters for the chart
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    // Loop through their leaves and count them
    leaves.forEach(leave => {
        if (leave.status === "Approved") approvedCount++;
        if (leave.status === "Pending") pendingCount++;
        if (leave.status === "Rejected") rejectedCount++;
    });

    // If they have no leaves at all, don't draw the chart yet
    if (approvedCount === 0 && pendingCount === 0 && rejectedCount === 0) {
        return; 
    }

    // Get the canvas and draw the chart
    const ctx = document.getElementById('employeeChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [approvedCount, pendingCount, rejectedCount],
                // Using your Golden Hour Palette
                backgroundColor: ['#6cac41', '#f3963a', '#eb5241dc'], 
                borderWidth: 2,
                borderColor: '#FFF8F4'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}