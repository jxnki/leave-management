require("dotenv").config();

const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors=require("cors");
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
const SECRET_KEY = process.env.SECRET_KEY;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use(express.json());
app.use(cors());

// Serve the frontend files (html, js, css, images) directly from Express
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log("Connected to MySQL");
});

function authenticateToken(req, res, next) {
    // 1. Look at the request headers for the wristband
    const authHeader = req.headers['authorization'];
    
    // Tokens are usually sent as "Bearer abc123def456". We just want the code part.
    const token = authHeader && authHeader.split(' ')[1]; 

    // 2. If they didn't bring a wristband at all, kick them out (401 Unauthorized)
    if (!token) return res.status(401).send("Access Denied: No Token Provided!");

    // 3. Verify the wristband using our hidden .env secret key
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        // If the signature is fake or expired, kick them out (403 Forbidden)
        if (err) return res.status(403).send("Access Denied: Invalid Token!");
        
        // If it's valid, attach the decoded info to the request and let them in!
        req.user = user; 
        next(); // Moves on to your actual database code
    });
}

app.post("/register", async (req, res) => {

    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if(!name || !email || !password)
    {
        return res.send("All fields required");
    }

    if (!email.includes("@")) {
    return res.send("Invalid Email");
    }

    if (name.length < 3) {
    return res.send("Name too short");
    }

    const passwordErrors = [];

    if (password.length < 8) {
        passwordErrors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
        passwordErrors.push("an uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        passwordErrors.push("a lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        passwordErrors.push("a number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        passwordErrors.push("a special character");
    }
    if (/(.)\1\1/.test(password)) {
    passwordErrors.push("no 3+ consecutive identical characters");
    }
    if (passwordErrors.length > 0) {
        return res.send(`Password missing: ${passwordErrors.join(", ")}.`);
    }

    console.log(name);
    console.log(email);

    const sql="insert into users(name,email,password,role) values(?,?,?,?)";

    db.query(
        sql,
        [name, email, hashedPassword, role],
        (err, result) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.send("User registered");
    });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email=?";

    db.query(sql, [email], async (err, results) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: "Database error"}); // Don't leave the frontend hanging!
        }

        if(results.length > 0) {
            // 1. Grab the actual user from the database results
            const user = results[0]; 
            
            const match = await bcrypt.compare(password, user.password); 

            if(match) {
                // 3. The Payload & Wristband (fixed typo)
                const payload = { userId: user.id, role: user.role };
                const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: "2h"});
                
                res.json({ 
                    message: "Login successful",
                    token: token, 
                    userId: user.id, 
                    role: user.role, 
                    userName: user.name
                });
            } else {
                // 4. Handle the wrong password scenario
                res.json({message: "Invalid Credentials"}); 
            }
        }
        else {
            res.json({message:"Invalid Credentials"});
        }
    });
});

app.post("/leave",authenticateToken, (req, res) => {

    const {leave_type,start_date,end_date,reason} = req.body;
    const user_id = req.user.userId;

    if (!leave_type || !start_date || !end_date || !reason || !reason.trim()) {
        return res.send("Error: Leave type, start date, end date, and reason are all required.");
    }

    if (new Date(end_date) < new Date(start_date)) {
        return res.send("Error: End date cannot be before start date.");
    }

    const status = "Pending";

    // Number of days being requested in THIS application (inclusive of both ends)
    const requestedDays = Math.round((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;

    const checkSql = "SELECT start_date, end_date FROM leave_requests WHERE user_id=? AND status='Approved'";

    db.query(checkSql, [user_id], (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const totalLeaves = 20;

        // Sum up days already taken across all approved leaves
        let approvedDays = 0;
        results.forEach(row => {
            const days = Math.round((new Date(row.end_date) - new Date(row.start_date)) / (1000 * 60 * 60 * 24)) + 1;
            approvedDays += days;
        });

        if (requestedDays + approvedDays > totalLeaves) {
            return res.send("No leave balance remaining");
        }

        const sql =
            "INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status) VALUES (?,?,?,?,?,?)";

        db.query( sql,[user_id,leave_type,start_date,end_date,reason,status],
            (err, result) => {

                if(err)
                {
                    console.log(err);
                    return;
                }

                const userSql =
    "SELECT email,name FROM users WHERE id=?";

db.query(
    userSql,
    [user_id],
    async (err,userResults) => {

        if(!err && userResults.length > 0)
        {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userResults[0].email,
                subject: "Leave Request Submitted",
                text:
                    `Hello ${userResults[0].name},

                Your leave request has been submitted successfully.

                Status: Pending

                Thank you.`
                            });
                        }

                        res.send("Leave Applied Successfully");
                    }
                );
            });
    });
});

app.get("/leave",authenticateToken, (req, res) => {
    const sql = "SELECT leave_requests.*, users.name FROM leave_requests JOIN users ON leave_requests.user_id = users.id";
    db.query(sql,(err, results) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.json(results);
        });
});

app.get("/leave/pending", authenticateToken, (req, res) => {
    const sql = `SELECT leave_requests.*,users.name FROM leave_requests JOIN users ON leave_requests.user_id = users.id WHERE status=?`;
    db.query(
        sql,
        ["Pending"],
        (err, results) => {
            if(err)
            {
                console.log(err);
                return;
            }

            res.json(results);
        });
});

app.get("/leave/user/:id",authenticateToken, (req, res) => {

    const userId = req.params.id;

    const sql = "SELECT * FROM leave_requests WHERE user_id=?";

    db.query(
        sql,
        [userId],
        (err, results) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.json(results);
        });
});

app.get("/leave/:id", authenticateToken,(req, res) => {

    const id = req.params.id;

    const sql ="SELECT * FROM leave_requests WHERE id=?";

    db.query(
        sql,
        [id],
        (err, results) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.json(results);
        });
});

app.put("/leave/approve/:id",authenticateToken, (req, res) => {

    const id = req.params.id;

    // First, fetch the leave being approved so we know its user and day count
    const getLeaveSql = "SELECT user_id, start_date, end_date FROM leave_requests WHERE id=?";

    db.query(getLeaveSql, [id], (err, leaveResults) => {
        if (err) {
            console.log(err);
            return;
        }

        if (leaveResults.length === 0) {
            return res.status(404).send("Leave request not found");
        }

        const leave = leaveResults[0];
        const requestedDays = Math.round((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;

        // Now fetch this employee's already-approved leaves to total up days taken so far
        const approvedSql = "SELECT start_date, end_date FROM leave_requests WHERE user_id=? AND status='Approved'";

        db.query(approvedSql, [leave.user_id], (err, approvedResults) => {
            if (err) {
                console.log(err);
                return;
            }

            const totalLeaves = 20;

            let approvedDays = 0;
            approvedResults.forEach(row => {
                const days = Math.round((new Date(row.end_date) - new Date(row.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                approvedDays += days;
            });

            if (approvedDays + requestedDays > totalLeaves) {
                return res.status(400).send(`Cannot approve: this employee's leave balance would exceed ${totalLeaves} days (already approved: ${approvedDays}, this request: ${requestedDays}).`);
            }

            const sql = "UPDATE leave_requests SET status='Approved' WHERE id=?";

            db.query(
                sql,
                [id],
                (err, result) => {

                    if(err)
                    {
                        console.log(err);
                        return;
                    }

                    const userSql = `
SELECT users.email,
       users.name
FROM leave_requests
JOIN users
ON leave_requests.user_id = users.id
WHERE leave_requests.id = ?
`;

db.query(
    userSql,
    [id],
    async (err,userResults) => {

        if(!err && userResults.length > 0)
        {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userResults[0].email,
                subject: "Leave Approved",
                text:
                    `Hello ${userResults[0].name},

                    Your leave request has been APPROVED.

                    Enjoy your leave.`
                                });
                            }

                            res.send("Leave Approved");
                        }
                    );
                });
        });
    });
});

app.put("/leave/reject/:id",authenticateToken, (req, res) => {

    const id = req.params.id;
    const { rejection_reason } = req.body;

    const sql = "UPDATE leave_requests SET status='Rejected', rejection_reason=? WHERE id=?";

    db.query(
        sql,
        [rejection_reason, id],
        (err, result) => {

            if(err)
            {
                console.log(err);
                return;
            }

            const userSql = `
SELECT users.email,
       users.name
FROM leave_requests
JOIN users
ON leave_requests.user_id = users.id
WHERE leave_requests.id = ?
`;

db.query(
    userSql,
    [id],
    async (err,userResults) => {

        if(!err && userResults.length > 0)
        {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userResults[0].email,
                subject: "Leave Rejected",
                text:
                    `Hello ${userResults[0].name},

                Your leave request has been REJECTED.

                Please contact your manager for details.`
                            });
                        }

                        res.send("Leave Rejected");
                    }
                );
        });
});

app.put("/leave/:id",authenticateToken, (req, res) => {
    const id = req.params.id;

    const { leave_type,start_date,end_date,reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason || !reason.trim()) {
        return res.send("Error: Leave type, start date, end date, and reason are all required.");
    }

    if (new Date(end_date) < new Date(start_date)) {
        return res.send("Error: End date cannot be before start date.");
    }

    const sql = "UPDATE leave_requests SET leave_type=?, start_date=?, end_date=?, reason=? WHERE id=?";
    db.query(
        sql,
        [leave_type,
            start_date,
            end_date,
            reason,
             id],
        (err, result) => {
            if(err)
            {
                console.log(err);
                return;
            }

            res.send("Leave Updated");
        });
});

app.delete("/leave/:id", authenticateToken, (req, res) => {

    const id = req.params.id;

    const sql = "DELETE FROM leave_requests WHERE id=?";

    db.query(
        sql,
        [id],
        (err, result) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.send("Leave Deleted");
        });
});

// For managers: a summary of every employee's leave usage (total/taken/remaining days)
app.get("/employees/leave-summary", authenticateToken, (req, res) => {

    const sql = `
        SELECT users.id AS user_id, users.name,
               start_date, end_date
        FROM users
        LEFT JOIN leave_requests
            ON leave_requests.user_id = users.id AND leave_requests.status = 'Approved'
        WHERE users.role = 'employee'
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const totalLeaves = 20;

        // Group rows by employee, summing approved leave days for each
        const employeeMap = {};

        results.forEach(row => {
            if (!employeeMap[row.user_id]) {
                employeeMap[row.user_id] = { user_id: row.user_id, name: row.name, leavesTaken: 0 };
            }

            if (row.start_date && row.end_date) {
                const days = Math.round((new Date(row.end_date) - new Date(row.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                employeeMap[row.user_id].leavesTaken += days;
            }
        });

        const summary = Object.values(employeeMap).map(emp => ({
            user_id: emp.user_id,
            name: emp.name,
            totalLeaves: totalLeaves,
            leavesTaken: emp.leavesTaken,
            remainingLeaves: Math.max(0, totalLeaves - emp.leavesTaken)
        }));

        res.json(summary);
    });
});

app.get("/dashboard/:id",authenticateToken, (req, res) => {

    const userId = req.params.id;

    const sql = "SELECT start_date, end_date FROM leave_requests WHERE user_id=? AND status='Approved'";

    db.query(
        sql,
        [userId],
        (err, results) => {

            if(err)
            {
                console.log(err);
                return;
            }

            const totalLeaves = 20;

            // Sum up the number of days across all approved leaves (inclusive of both ends)
            let leavesTaken = 0;
            results.forEach(row => {
                const days = Math.round((new Date(row.end_date) - new Date(row.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                leavesTaken += days;
            });

            const remainingLeaves = Math.max( 0, totalLeaves - leavesTaken);

            res.json({
                totalLeaves,
                leavesTaken,
                remainingLeaves
            });
        });
});

// Catch-all for any route that doesn't match a real API endpoint or static file.
// Known API path prefixes get a JSON 404; everything else (typos in page URLs, etc.)
// gets the friendly 404 page.
const apiPrefixes = ["/login", "/register", "/leave", "/dashboard", "/employees"];

app.use((req, res) => {
    const isApiRoute = apiPrefixes.some(prefix => req.path.startsWith(prefix));

    if (isApiRoute) {
        return res.status(404).json({ message: "Not Found: This API route does not exist." });
    }

    res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});