import express, { Express, Request, Response } from "express";
import { connect } from "./bot/start";
import { db, init } from "./database";
import { fuckCors } from "./cors";

export const app: Express = express();
const port = process.env.PORT || 8637;

connect();
init();

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", err => {
    console.error("Uncaught Exception thrown", err);
});

app.use(fuckCors);
app.use(express.static("site-dist"));

// @ts-ignore
app.get("/api/updates", async (req: Request, res: Response) => {
    if (!req.query.version && !req.query.forceSend) {
        res.send({
            version: 900,
            changelog:
                "⚠️ Major rework of the update system, settings, and notable fixes. Update to avoid things breaking."
        });

        await db.run("INSERT INTO requests VALUES (?, null)", Date.now());
        return;
    }
    const dbUpdate = await db.all(
        "SELECT * FROM announcements WHERE published=true AND isUpdate=true ORDER BY id DESC LIMIT 1"
    );
    const dbAnnouncements = await db.all(
        "SELECT * FROM announcements WHERE published=true AND isUpdate=false ORDER BY id DESC"
    );
    let update: any = null;
    (() => {
        if (dbUpdate.length > 0) {
            const version = req.query.version;
            if (
                (dbUpdate[0].minVersion === 0 || dbUpdate[0].minVersion < version!) &&
                (dbUpdate[0].maxVersion === 0 || dbUpdate[0].maxVersion > version!)
            ) {
                update = {
                    title: dbUpdate[0].title,
                    text: dbUpdate[0].text
                };
                return;
            }
        }
    })();
    if (req.query.forceSend) update = dbUpdate[0];
    let announcements: any[] = [];
    const version = req.query.version;
    announcements = dbAnnouncements
        .filter(announcement => {
            return (
                (announcement.minVersion === 0 || announcement.minVersion < version!) &&
                (announcement.maxVersion === 0 || announcement.maxVersion > version!)
            );
        })
        .map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            text: announcement.text
        }));
    res.json({
        update,
        announcements: announcements
    });

    if (!parseInt((version as string) || "")) return;
    if (parseInt(version as string) < 11) return;

    await db.run("INSERT INTO requests VALUES (?, ?)", Date.now(), parseInt(version as string));
});

app.get("/api/contributors", async (req: Request, res: Response) => {
    const contributors = await db.all("SELECT * FROM contributors");
    res.json({
        contributors
    });
});

app.listen(port, () => {
    console.log("🚀 Listening on port " + port);
});
