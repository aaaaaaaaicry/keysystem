const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DB_FILE = "keys.json";
const ADMIN_SECRET = "12345"; // troca isso depois

let keys = {};

// ================== LOAD DB ==================
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            keys = JSON.parse(fs.readFileSync(DB_FILE));
        }
    } catch (e) {
        console.log("Erro no DB, resetando...");
        keys = {};
    }
}

// ================== SAVE DB ==================
function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(keys, null, 2));
}

loadDB();

// ================== TEST ==================
app.get("/test", (req, res) => {
    res.send("OK server rodando");
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
        key,
        expire: keys[key].expire
    });
});

// ================== VALIDATE KEY ==================
app.get("/validate", (req, res) => {
    const { key, hwid } = req.query;

    if (!key) return res.json({ status: "error", message: "no key" });
    if (!hwid) return res.json({ status: "error", message: "no hwid" });

    const data = keys[key];

    if (!data) return res.json({ status: "invalid" });

    if (Date.now() > data.expire) {
        return res.json({ status: "expired" });
    }

    // bind HWID no primeiro uso
    if (!data.hwid) {
        data.hwid = hwid;
        saveDB();
        return res.json({ status: "valid", bind: true });
    }

    // checagem HWID
    if (data.hwid !== hwid) {
        return res.json({ status: "hwid_mismatch" });
    }

    res.json({ status: "valid" });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
    console.log("Server ON na porta", PORT);
});
