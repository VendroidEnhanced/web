import { db } from "../../database";
import { defineCommand } from "../../types";

export default defineCommand({
    name: "addver",
    description: "Allowlist a version for analytics",
    async exec(msg) {
        const [, id, value] = msg.content.split(" ");
        await db.run("INSERT INTO versions VALUES (?, ?)", id, value);

        return "Done!";
    }
});
