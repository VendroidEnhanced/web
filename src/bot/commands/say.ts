import { ComponentTypes, MessageFlags } from "oceanic.js";
import { defineCommand } from "../../types";

export default defineCommand({
    name: "say",
    description: "Say something",
    async exec(msg) {
        await msg.channel?.createMessage({
            flags: MessageFlags.IS_COMPONENTS_V2,
            components: [
                {
                    type: ComponentTypes.TEXT_DISPLAY,
                    content: msg.content.replace(`${process.env.PREFIX}say `, "")
                }
            ]
        });
        return null;
    }
});
