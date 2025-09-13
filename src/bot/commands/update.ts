import { defineCommand } from "../../types";
import { execSync } from "child_process";
import { rmSync } from "fs";
import { ButtonStyles, ComponentTypes } from "oceanic.js";

export default defineCommand({
    name: "update",
    description: "Updates the VendroidEnhanced landing page",
    async exec(msg) {
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
        execSync("git clone --depth 1 https://github.com/VendroidEnhanced/site");
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
                            url: `https://vendroid.nin0.dev?${Date.now()}`,
                            label: "Go to site",
                            style: ButtonStyles.LINK
                        }
                    ]
                }
            ]
        };
    }
});
