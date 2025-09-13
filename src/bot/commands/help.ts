import { defineCommand } from "../../types";
import { commands } from "../start";

export default defineCommand({
    name: "help",
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
                        command.admin ? " <:owner:1416361009874075679>" : ""
                    } ~ ${command.description}`
            )
            .join("\n");
    },
    admin: false
});
