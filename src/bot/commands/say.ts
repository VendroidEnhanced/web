import { defineCommand } from "../../types";

export default defineCommand({
    name: "say",
    description: "Say something",
    async exec(msg) {
        await msg.channel?.createMessage({
            content: msg.content.replace(`${process.env.PREFIX}say `, "")
        });
        return null;
    }
});
