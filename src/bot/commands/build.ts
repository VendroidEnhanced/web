import { defineCommand } from "../../types";

export default defineCommand({
    name: "build",
    description: "Rebuilds the Vencord bundle",
    async exec(msg) {
        const [, , , username, plugin] = (process.env.PLUGIN_REPO_URL as string).split("/");

        await fetch(
            `https://api.github.com/repos/${username}/${plugin}/actions/workflows/build.yml/dispatches`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GH_TOKEN}`
                },
                body: JSON.stringify({
                    ref: "main"
                })
            }
        );
        return "Building Vencord :rocket:";
    }
});
