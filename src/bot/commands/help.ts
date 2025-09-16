import { defineCommand } from "../../types";
import { commands } from "../start";

export default defineCommand({
    name: "help",
    aliases: ["?", "shelp", "theylp"],
    description: "Shows this message",
    async exec(msg) {
        return commands
            .toSorted((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            })
            .toSorted((a, b) => {
                const am = a.admin ? 1 : 0;
                const bm = b.admin ? 1 : 0;
                if (am < bm) return -1;
                if (am > bm) return 1;
                return 0;
            })
            .map(
                command =>
                    `**\`${command.name}\`**${
                        command.aliases!.length ? ` *(${command.aliases!.join(", ")})*` : ""
                    }${command.admin ? ` <:owner:${process.env.EMOJI_OWNER}>` : ""} ~ ${
                        command.description
                    }`
            )
            .join("\n");
    },
    admin: false
});
