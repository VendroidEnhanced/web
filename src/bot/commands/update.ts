import { defineCommand } from "../../types";
import { execSync } from "child_process";
import { rmSync } from "fs";
import { ButtonStyles, ComponentTypes } from "oceanic.js";

export default defineCommand({
    name: "update",
    description: "Updates the VendroidEnhanced landing page & bot",
    async exec(msg) {
        await msg.channel?.createMessage({
            content: "## Updating bot"
        });
        execSync("git pull");
        execSync("pnpm build");
        await msg.channel?.createMessage({
            content: "## Updating landing page"
        });
        try {
            rmSync("site", {
                recursive: true,
                force: true
            });
            rmSync("site-dist", {
                recursive: true,
                force: true
            });
        } catch (e) {}
        await msg.channel?.createMessage({
            content: "Cloning website"
        });
        execSync(`git clone --depth 1 ${process.env.SITE_REPO_URL}`);
        await msg.channel?.createMessage({
            content: "Installing deps"
        });
        execSync("cd site && pnpm i --frozen-lockfile");
        await msg.channel?.createMessage({
            content: "Building"
        });
        execSync("cd site && pnpm build");
        execSync("mv site/dist site-dist");
        try {
            rmSync("site", {
                recursive: true,
                force: true
            });
        } catch (e) {}

        return {
            content: "Done!",
            components: [
                {
                    type: ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: ComponentTypes.BUTTON,
                            url: `https://${process.env.VENDROID_BASE_URL}?${Date.now()}`,
                            label: "Go to site",
                            style: ButtonStyles.LINK
                        }
                    ]
                }
            ]
        };
    }
});
