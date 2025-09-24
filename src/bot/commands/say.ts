import { ComponentTypes, MessageFlags } from "oceanic.js";
import { defineCommand } from "../../types";

export default defineCommand({
    name: "say",
    aliases: ["echo"],
    description: "Say something",
    mode: "text",
    async exec(msg) {
        await msg.channel?.createMessage({
            flags: MessageFlags.IS_COMPONENTS_V2,
            components: [
                {
                    type: ComponentTypes.TEXT_DISPLAY,
                    content: msg.content.split(" ").slice(1).join(" ")
                }
            ]
        });
        return null;
    }
});
