const express = require("express");
const fs = require("fs");

const app = express();

// 🔥 IMPORTANTE pro Render
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DB_FILE = "keys.json";
const ADMIN_SECRET = "5151157";

let keys = {};

// ================== LOAD SAFE ==================
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, "utf8");
            keys = raw ? JSON.parse(raw) : {};
        }
    } catch (e) {
        console.log("DB corrompido, resetando...");
        keys = {};
    }
}

function saveDB() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(keys, null, 2));
    } catch (e) {
        console.log("Erro ao salvar DB:", e);
    }
}

loadDB();

// ================== ROOT ==================
app.get("/", (req, res) => {
    res.send("Server online ✔");
});

// ================== TEST ==================
app.get("/test", (req, res) => {
    res.send("OK funcionando");
});

// ================== GENERATE KEY ==================
app.post("/generate", (req, res) => {
    const { secret, days } = req.body;

    if (secret !== ADMIN_SECRET) {
        return res.json({ status: "error", message: "unauthorized" });
    }

    const key = Math.random().toString(36).substring(2, 10);

    keys[key] = {
        expire: Date.now() + (Number(days || 1) * 86400000),
        hwid: null
    };

    saveDB();

    res.json({
        status: "success",
        key
    });
});

// ================== VALIDATE KEY ==================
app.get("/validate", (req, res) => {
    const { key, hwid } = req.query;

    if (!key || !hwid) {
        return res.json({ status: "error", message: "missing data" });
    }

    const data = keys[key];

    if (!data) {
        return res.json({ status: "invalid" });
    }

    if (Date.now() > data.expire) {
        return res.json({ status: "expired" });
    }

    // bind HWID
    if (!data.hwid) {
        data.hwid = hwid;
        saveDB();
        return res.json({ status: "valid", bind: true });
    }

    if (data.hwid !== hwid) {
        return res.json({ status: "hwid_mismatch" });
    }

    res.json({ status: "valid" });
});

// ================== START ==================
app.listen(PORT, () => {
    console.log("Server ON na porta", PORT);
});
