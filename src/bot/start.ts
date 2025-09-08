import { raw } from "express";
import { AllIntents, Client } from "oceanic.js";
import { db } from "../database";
// @ts-ignore
import help from "./help.txt";
import { execSync } from "child_process";
import { rmSync } from "fs";

const bot = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    gateway: {
        intents: AllIntents
    }
});

bot.on("ready", () => {
    console.log("Discord connected as", bot.user.tag);
});

bot.on("messageCreate", async msg => {
    if (msg.author.id === bot.user.id) return;
    if (msg.content.startsWith("!")) {
        const command = msg.content.split(/( |\n)/)[0].replace("!", "");
        switch (command) {
            case "help": {
                await msg.channel?.createMessage({
                    content: help
                });
                break;
            }
            case "ping": {
                await msg.channel?.createMessage({
                    content: "Pong!"
                });
                break;
            }
        }
        if (msg.author.id !== "886685857560539176") return;
        switch (command) {
            case "update": {
                try {
                    rmSync("site", {
                        recursive: true,
                        force: true
                    });
                } catch (e) {}
                await msg.channel?.createMessage({
                    content: "Cloning website"
                });
                execSync("git clone https://github.com/VendroidEnhanced/site");
                await msg.channel?.createMessage({
                    content: "Installing deps"
                });
                execSync("cd site && pnpm i --frozen-lockfile");
                await msg.channel?.createMessage({
                    content: "Building"
                });
                execSync("cd site && pnpm build");
                execSync("mv site/dist site-dist");
                try {
                    rmSync("site", {
                        recursive: true,
                        force: true
                    });
                } catch (e) {}
                await msg.channel?.createMessage({
                    content: `Done! https://vendroid.nin0.dev?${Date.now()}`
                });
                break;
            }
            case "draft": {
                const rawLines = msg.content.split("\n");
                if (rawLines.length < 5) return;
                let isUpdate = false;
                if (rawLines[0].toLowerCase().includes("--update")) {
                    isUpdate = true;
                }
                rawLines.shift();

                const title = rawLines[2];
                const minVer = rawLines[0];
                const maxVer = rawLines[1];
                rawLines.shift();
                rawLines.shift();
                rawLines.shift();
                const text = rawLines.join("\n");

                const statement = await db.run(
                    "INSERT INTO announcements (title, text, isUpdate, minVersion, maxVersion, published) VALUES (?, ?, ?, ?, ?, ?)",
                    title,
                    text,
                    isUpdate,
                    minVer,
                    maxVer,
                    false
                );

                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "Announcement created",
                            description: `Title: ${title}
Text: ${text}
Is update: ${isUpdate}
Min version: ${minVer}
Max version: ${maxVer}

-# Use \`!drafts\` to view drafts`
                        }
                    ]
                });
                break;
            }
            case "ls": {
                const drafts = await db.all("SELECT * FROM announcements");
                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "All",
                            description: drafts
                                .map(draft => {
                                    return `${draft.published ? "🌎" : "🔑"} ID: ${draft.id}
Title: ${draft.title}
Text: ${draft.text}
Is update: ${draft.isUpdate}
Min version: ${draft.minVersion}
Max version: ${draft.maxVersion}`;
                                })
                                .join("\n\n")
                        }
                    ]
                });
                break;
            }
            case "drafts": {
                const drafts = await db.all("SELECT * FROM announcements WHERE published = false");
                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "Drafts",
                            description: drafts
                                .map(draft => {
                                    return `ID: ${draft.id}
Title: ${draft.title}
Text: ${draft.text}
Is update: ${draft.isUpdate}
Min version: ${draft.minVersion}
Max version: ${draft.maxVersion}`;
                                })
                                .join("\n\n")
                        }
                    ]
                });
                break;
            }
            case "published": {
                const drafts = await db.all("SELECT * FROM announcements WHERE published = true");
                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "Published",
                            description: drafts
                                .map(draft => {
                                    return `ID: ${draft.id}
Title: ${draft.title}
Text: ${draft.text}
Is update: ${draft.isUpdate}
Min version: ${draft.minVersion}
Max version: ${draft.maxVersion}`;
                                })
                                .join("\n\n")
                        }
                    ]
                });
                break;
            }
            case "rm": {
                const id = msg.content.split(" ")[1];
                if (!id) return;
                await db.run("DELETE FROM announcements WHERE id = ?", id);
                await msg.channel?.createMessage({
                    content: "Draft removed"
                });
                break;
            }
            case "edit": {
                const id = msg.content.split(/( |\n)/)[2];
                console.log(id);
                if (!id) return;
                const draft = await db.get("SELECT * FROM announcements WHERE id = ?", id);
                if (!draft) return;

                const rawLines = msg.content.split("\n");
                if (rawLines.length < 5) return;
                let isUpdate = draft.isUpdate;
                rawLines.shift();

                const title = rawLines[2];
                const minVer = rawLines[0];
                const maxVer = rawLines[1];
                rawLines.shift();
                rawLines.shift();
                rawLines.shift();
                const text = rawLines.join("\n");

                await db.run(
                    "UPDATE announcements SET title = ?, text = ?, isUpdate = ?, minVersion = ?, maxVersion = ? WHERE id = ?",
                    title,
                    text,
                    isUpdate,
                    minVer,
                    maxVer,
                    id
                );

                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "Announcement updated",
                            description: `Title: ${title}
Text: ${text}
Is update: ${isUpdate}
Min version: ${minVer}
Max version: ${maxVer}`
                        }
                    ]
                });
                break;
            }
            case "publish": {
                const id = msg.content.split(" ")[1];
                if (!id) return;
                const draft = await db.get("SELECT * FROM announcements WHERE id = ?", id);
                if (!draft) return;
                await db.run("UPDATE announcements SET published = true WHERE id = ?", id);
                await msg.channel?.createMessage({
                    content: `Draft published, it will be viewable by all VendroidEnhanced users.${
                        draft.isUpdate ? " This is an update." : ""
                    }`
                });
                break;
            }
            case "unpublish": {
                const id = msg.content.split(" ")[1];
                if (!id) return;
                const draft = await db.get("SELECT * FROM announcements WHERE id = ?", id);
                if (!draft) return;
                await db.run("UPDATE announcements SET published = false WHERE id = ?", id);
                await msg.channel?.createMessage({
                    content: "Draft unpublished"
                });
                break;
            }
            case "build": {
                await fetch(
                    "https://api.github.com/repos/VendroidEnhanced/plugin/actions/workflows/build.yml/dispatches",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${process.env.GH_TOKEN}`
                        },
                        body: JSON.stringify({
                            ref: "main"
                        })
                    }
                );
                msg.channel?.createMessage({
                    content: "Building Vencord :rocket:"
                });
                break;
            }
            case "addcontrib": {
                const args = msg.content.split(" ");
                const id = args[1];
                const description = args.slice(2).join(" ");
                if (!id || !description) return;

                await db.run(
                    "INSERT INTO contributors (id, description) VALUES (?, ?)",
                    id,
                    description
                );

                await msg.channel?.createMessage({
                    content: "Done!"
                });
                break;
            }
            case "rmcontrib": {
                const id = msg.content.split(" ")[1];
                if (!id) return;

                await db.run("DELETE FROM contributors WHERE id = ?", id);

                await msg.channel?.createMessage({
                    content: "Done!"
                });
                break;
            }
            case "lscontrib": {
                const contributors = await db.all("SELECT * FROM contributors");
                await msg.channel?.createMessage({
                    embeds: [
                        {
                            title: "Contributors",
                            description: contributors
                                .map(contrib => {
                                    return `ID: ${contrib.id}
                Description: ${contrib.description}`;
                                })
                                .join("\n\n")
                        }
                    ]
                });
            }
        }
    }
});

export async function connect() {
    await bot.connect();
}
