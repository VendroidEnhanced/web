import { CreateMessageOptions } from "oceanic.js";
import { db } from "../../database";
import { defineCommand, Duration } from "../../types";
import { bot } from "../start";

export let stickies: Record<string, string | undefined> = {};
export function setStick(channelID: string, messageID: string) {
    stickies[channelID] = messageID;
}

export async function buildStick(channelID: string): Promise<CreateMessageOptions | undefined> {
    const q = await db.get("SELECT id FROM stick WHERE channel=?", channelID);
    if (!q) return;
    const tMsg = await bot.rest.channels.getMessage(channelID, q.id)!;

    return {
        embeds: [
            {
                color: 0xea95a2,
                author: {
                    name: tMsg.author.tag,
                    iconURL: tMsg.author.avatarURL("png")
                },
                description: `### 📌 Pinned Message\n${tMsg.content}`
            }
        ]
    };
}

export default defineCommand({
    name: "stick",
    description: "Stick the referenced message up the channel's bottom",
    mode: "text",
    async exec(msg) {
        await db.run("DELETE FROM stick WHERE channel=?", msg.channelID);
        if (stickies[msg.channelID])
            await bot.rest.channels.deleteMessage(msg.channelID, stickies[msg.channelID]!);
        if (msg.messageReference) {
            const tMsg = await bot.rest.channels.getMessage(
                msg.channelID,
                msg.messageReference.messageID!
            )!;
            if (!tMsg.content) return "";
            await db.run("INSERT INTO stick VALUES (?, ?)", msg.channelID, tMsg.id);

            const sticker = await buildStick(msg.channelID);
            if (sticker) {
                const smsg = await msg.channel?.createMessage(sticker);
                stickies[msg.channelID] = smsg?.id;
            }
        }
        await msg.createReaction("✅");
        return "";
    }
});
