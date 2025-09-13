import { defineCommand } from "../../types";

export default defineCommand({
    name: "ping",
    description: "See if I am alive",
    admin: false,
    async exec() {
        return "Pong!";
    }
});
