require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors=require("cors");
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const SECRET_KEY = process.env.SECRET_KEY;

app.use(express.json());
app.use(cors());
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

    if(password.length < 6)
    {
        return res.send("Password must be at least 6 characters");
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
    if (new Date(end_date) < new Date(start_date)) {
        return res.send("Error: End date cannot be before start date.");
    }

    const status = "Pending";

    const checkSql = "SELECT COUNT(*) AS taken FROM leave_requests WHERE user_id=? AND status='Approved'";

    db.query(
        checkSql,
        [user_id],
        (err, results) => {

            if(err)
            {
                console.log(err);
                return;
            }

            const totalLeaves = 20;

            const taken = results[0].taken;

            const remaining = totalLeaves - taken;

            if(remaining <= 0)
            {
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

                    res.send("Leave Applied Successfully");
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

            res.send("Leave Approved");
        });
});

app.put("/leave/reject/:id",authenticateToken, (req, res) => {

    const id = req.params.id;

    const sql = "UPDATE leave_requests SET status='Rejected' WHERE id=?";

    db.query(
        sql,
        [id],
        (err, result) => {

            if(err)
            {
                console.log(err);
                return;
            }

            res.send("Leave Rejected");
        });
});

app.put("/leave/:id",authenticateToken, (req, res) => {
    const id = req.params.id;

    const { leave_type,start_date,end_date,reason } = req.body;

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

app.get("/dashboard/:id",authenticateToken, (req, res) => {

    const userId = req.params.id;

    const sql = "SELECT COUNT(*) AS taken FROM leave_requests WHERE user_id=? AND status='Approved'";

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
            const leavesTaken = results[0].taken;

            const remainingLeaves = Math.max( 0, totalLeaves - leavesTaken);

            res.json({
                totalLeaves,
                leavesTaken,
                remainingLeaves
            });
        });
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});