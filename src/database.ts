import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

export let db: Database;

export async function init() {
    db = await open({
        filename: "data/database.db",
        driver: sqlite3.Database
    });
    console.log("Database opened");
    await db.exec(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            isUpdate BOOLEAN NOT NULL,
            minVersion INTEGER NOT NULL,
            maxVersion INTEGER NOT NULL,
            published BOOLEAN NOT NULL
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS contributors (
            id TEXT NOT NULL,
            description TEXT NOT NULL
        )
    `);
    await db.exec(`
        CREATE TABLE IF NOT EXISTS requests (
            appVer INTEGER,
            deviceVer INTEGER
        )
    `);
}
