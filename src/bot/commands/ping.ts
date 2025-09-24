import { defineCommand, Duration } from "../../types";

export default defineCommand({
    name: "ping",
    description: "See if I am alive",
    admin: false,
    mode: "text",
    async exec() {
        return "Pong!";
    }
});
