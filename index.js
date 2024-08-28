import express from "express";
import fs from "fs";
import { config } from "./config.js";

const app = express();
app.use(express.json());
let updateData = {
    version: 0,
    changelog: "some things"
};

fs.stat("data.json", (err, _) => {
    if(err !== null) {
        fs.writeFile("data.json", JSON.stringify(updateData), () => {});
    }
    fs.readFile("data.json", "utf8", (err, data) => {
        updateData = JSON.parse(data);
    });
});

app.get("/api", (req, res) => {
    res.send({"hi": "get the /api/updates endpoint to get update version and changelog"});
})

app.get("/api/updates", (req, res) => {
    res.send(updateData);
})

app.post("/api/updates", (req, res) => {
    if(req.headers.authorization !== config.rwToken) return res.status(403).send({fuckoff: true});
    fs.writeFile("data.json", JSON.stringify(req.body), () => {});
    updateData = req.body;
    return res.status(204).send();
})

app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
})