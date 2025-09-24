import { defineCommand } from "../../types";

export default defineCommand({
    name: "restart",
    description: "Restart me",
    mode: "text",
    async exec(msg) {
        await msg.channel?.createMessage({
            content: "Restarting..."
        });
        process.exit(0);
    }
});
