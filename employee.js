if(localStorage.getItem("role") !== "employee")
{
    window.location.href = "index.html";
}
loadDashboard();
loadEmployeeCalendar();
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

        // 1. Grab the token from the browser's pocket
    const token = localStorage.getItem("token");

    // 2. Attach it to the request
    const response = await fetch(`http://localhost:3000/dashboard/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` // Showing the wristband!
        }
    });
    const data = await response.json();

    document.getElementById("totalLeaves").innerText =`Total Leaves: ${data.totalLeaves}`;

    document.getElementById("leavesTaken").innerText =`Leaves Taken: ${data.leavesTaken}`;

    document.getElementById("remainingLeaves").innerText = `Remaining Leaves: ${data.remainingLeaves}`;
}

async function loadEmployeeCalendar() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // 2. Attach it to the request
    const response = await fetch(`http://localhost:3000/leave/user/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` // Showing the wristband!
        }
    });
    const leaves = await response.json();

    let approvedCount = 0, pendingCount = 0, rejectedCount = 0;

    leaves.forEach(leave => {
        if (leave.status === "Approved") {
            approvedCount++;
            
            // --- THE CALENDAR DATE LOOPING ---
            let startDate = new Date(leave.start_date);
            let endDate = new Date(leave.end_date);

            // Loop through every single day from start to end
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                
                // Format the date precisely as "YYYY-MM-DD"
                let y = d.getFullYear();
                let m = String(d.getMonth() + 1).padStart(2, '0');
                let day = String(d.getDate()).padStart(2, '0');
                
                // Add it to our Set!
                approvedLeaveDates.add(`${y}-${m}-${day}`); 
            }
        }
        if (leave.status === "Pending") pendingCount++;
        if (leave.status === "Rejected") rejectedCount++;
    });

    // Now that we have the dates, redraw the calendar!
    renderCalendar();
}

document.getElementById("applyBtn").addEventListener("click", () => {
        localStorage.removeItem("leaveId");
        window.location.href = "leave.html";
    });

document.getElementById("historyBtn").addEventListener("click", () => {

        window.location.href ="history.html";
    });

document.getElementById("logoutBtn").addEventListener("click", logout);

let currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
let currentYear = new Date().getFullYear();
let approvedLeaveDates = new Set();

renderCalendar();

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const monthYearText = document.getElementById("monthYearText");
    
    grid.innerHTML = ""; 

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearText.innerText = `${monthNames[currentMonth]} ${currentYear}`;

    // Find out which day of the week the 1st of the month lands on
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    // Find out how many total days are in this month (28, 30, or 31)
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Loop 1: Create blank, empty boxes for the days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
        grid.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Loop 2: Create the actual numbered boxes for the days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
        
        // --- THE FIX IS HERE ---
        // 1. Format the current box's date to exactly "YYYY-MM-DD"
        let m = String(currentMonth + 1).padStart(2, '0');
        let d = String(day).padStart(2, '0');
        let dateStringToCheck = `${currentYear}-${m}-${d}`;

        // 2. Ask the Set: Do you contain this date? If yes, add the "approved-day" CSS class!
        let highlightClass = approvedLeaveDates.has(dateStringToCheck) ? "approved-day" : "";

        // 3. Draw the box!
        grid.innerHTML += `<div class="calendar-day ${highlightClass}">${day}</div>`;
    }
}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonth--; // Subtract 1 from the month
    if (currentMonth < 0) { 
        currentMonth = 11; // If we go past January, wrap around to December
        currentYear--;     // And go back one year
    }
    renderCalendar(); // Redraw the new month
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth++; // Add 1 to the month
    if (currentMonth > 11) { 
        currentMonth = 0;  // If we go past December, wrap around to January
        currentYear++;     // And go forward one year
    }
    renderCalendar(); // Redraw the new month
});

function logout()
{
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
}

// Trigger the chart to load when the page opens
loadEmployeeChart();

async function loadEmployeeChart() {
    const userId = localStorage.getItem("userId");
    
    // Fetch this specific employee's leave history
    const token = localStorage.getItem("token");

    // 2. Attach it to the request
    const response = await fetch(`http://localhost:3000/leave/user/${userId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}` // Showing the wristband!
        }
    });
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
                backgroundColor: ['#6E8E59', '#f0a459', '#eb5241dc'], 
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