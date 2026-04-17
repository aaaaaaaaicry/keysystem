const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "keys.json";
const ADMIN_SECRET = "5151157";

let keys = {};

// ================= DB =================
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, "utf8");
            keys = raw ? JSON.parse(raw) : {};
        }
    } catch {
        keys = {};
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(keys, null, 2));
}

loadDB();

// ================= HOME =================
app.get("/", (req, res) => {
    res.send("Key System Online ✔");
});

// ================= VALIDATE (SEM HWID) =================
app.get("/validate", (req, res) => {
    const { key } = req.query;

    if (!key) return res.json({ status: "error" });

    const data = keys[key];

    if (!data) return res.json({ status: "invalid" });

    if (Date.now() > data.expire) {
        return res.json({ status: "expired" });
    }

    return res.json({ status: "valid" });
});

// ================= GENERATE =================
app.post("/generate", (req, res) => {
    const { secret, days } = req.body;

    if (secret !== ADMIN_SECRET) {
        return res.json({ status: "error", message: "no_permission" });
    }

    const key = Math.random().toString(36).substring(2, 10);

    keys[key] = {
        expire: Date.now() + (Number(days || 1) * 86400000)
    };

    saveDB();

    res.json({
        status: "success",
        key
    });
});

// ================= LIST KEYS =================
app.get("/keys", (req, res) => {
    res.json(keys);
});

// ================= DELETE KEY =================
app.post("/delete", (req, res) => {
    const { secret, key } = req.body;

    if (secret !== ADMIN_SECRET) {
        return res.json({ status: "no_permission" });
    }

    delete keys[key];
    saveDB();

    res.json({ status: "deleted" });
});

// ================= START =================
app.listen(PORT, () => {
    console.log("Server ON:", PORT);
});
