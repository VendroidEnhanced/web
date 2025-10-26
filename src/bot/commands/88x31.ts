import {
    ApplicationCommandOptionTypes,
    ButtonStyles,
    ComponentTypes,
    MessageFlags
} from "oceanic.js";
import { defineCommand } from "../../types";
import { promisify } from "node:util";
import child_process from "node:child_process";
import { Canvas, Image } from "skia-canvas";

const exec = promisify(child_process.exec);

export default defineCommand({
    name: "88x31",
    description: "Pulls a nin0 88x31",
    admin: false,
    options: [
        {
            name: "name",
            required: false,
            description: "name",
            type: ApplicationCommandOptionTypes.STRING
        }
    ],
    mode: "slash",
    async exec(ctx) {
        const name = ctx.data.options.getString("name");

        if (name) {
            const fetcher = await fetch(`https://files.nin0.dev/88x31/${name}.png`);
            if (!fetcher.ok)
                return "that 88x31 doesn't exist, run </88x31:1432147917313151089> without an argument to see a list";

            const canvas = new Canvas(98, 41);
            const ctx = canvas.getContext("2d");
            const stripeWidth = 4.5;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 98, 41);

            const img = new Image();
            img.src = Buffer.from(await fetcher.arrayBuffer());
            ctx.drawImage(img, 5, 5, 88, 31);

            const pngBuffer = await canvas.toBuffer("png", { matte: "transparent" });

            return {
                files: [
                    {
                        name: `preview_${name}_DO_NOT_USE_THIS.png`,
                        contents: pngBuffer
                    }
                ],
                flags: MessageFlags.IS_COMPONENTS_V2,
                components: [
                    {
                        type: ComponentTypes.MEDIA_GALLERY,
                        items: [
                            {
                                media: {
                                    url: `attachment://preview_${name}_DO_NOT_USE_THIS.png`
                                }
                            }
                        ]
                    },
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content:
                            "-# do not use this preview, if you want to download the 88x31 use the button below"
                    },
                    {
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: ComponentTypes.BUTTON,
                                label: "Open in browser",
                                style: ButtonStyles.LINK,
                                url: `https://files.nin0.dev/88x31/${name}.png`
                            },
                            {
                                type: ComponentTypes.BUTTON,
                                label: "Embed",
                                style: ButtonStyles.SECONDARY,
                                customID: `embed-${name}`
                            }
                        ]
                    },
                    {
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: ComponentTypes.BUTTON,
                                label: "Browse nin0's 88x31s",
                                style: ButtonStyles.LINK,
                                url: "https://files.nin0.dev/88x31/?layout=grid"
                            }
                        ]
                    }
                ]
            };
        } else {
            const { stdout } = await exec(
                "ssh -o StrictHostKeyChecking=no nin0@100.64.64.64 ls /srv/slop/88x31"
            );
            console.log(
                stdout
                    .replaceAll(".png", "")
                    .trim()
                    .split("\n")
                    .map(item => `\`${item}\``)
                    .join(" ")
            );
            return {
                flags: MessageFlags.IS_COMPONENTS_V2,
                components: [
                    {
                        type: ComponentTypes.CONTAINER,
                        components: [
                            {
                                type: ComponentTypes.TEXT_DISPLAY,
                                content: `-# ### 88x31s\n${stdout
                                    .replaceAll(".png", "")
                                    .trim()
                                    .split("\n")
                                    .map(item => `\`${item}\``)
                                    .join(" ")}`
                            }
                        ]
                    }
                ]
            };
        }
    },
    components: [
        {
            type: "button",
            customID: /^embed-/,
            async exec(interaction) {
                await interaction.createMessage({
                    flags: MessageFlags.EPHEMERAL,
                    content: `\`\`\`html
<a href="${
                        interaction.data.customID === "embed-nin0" ? "https://nin0.dev" : "linkhere"
                    }" rel="nofollow">
    <img src="https://files.nin0.dev${
        interaction.data.customID === "embed-nin0"
            ? "/88x31.png"
            : `/88x31/${interaction.data.customID.replace("embed-", "")}.png`
    }" width="88" height="31" />
</a>
\`\`\``,
                    embeds: [
                        {
                            description:
                                "-# you may want to set `image-rendering: pixelated;` on the button, [here's why](<https://adryd.com/pages/88x31-notes/#image-rendering-pixelated>)"
                        }
                    ]
                });
            }
        }
    ]
});
