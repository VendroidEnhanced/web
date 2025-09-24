import { ButtonStyles, ComponentTypes } from "oceanic.js";
import { defineCommand } from "../../types";

function formatDuration(totalSeconds: number) {
    const days = Math.abs(Math.floor(totalSeconds / 86400));
    const hours = Math.abs(Math.floor((totalSeconds % 86400) / 3600));
    const minutes = Math.abs(Math.floor((totalSeconds % 3600) / 60));
    const seconds = Math.abs(totalSeconds % 60);

    return (
        [`${days} days`, `${hours} hours`, `${minutes} minutes`, `${seconds} seconds`]
            .filter(item => item[0] !== "0")
            .join(", ") || "0s"
    );
}

export default defineCommand({
    name: "when",
    aliases: ["showgirl", "tloas"],
    description: "See when The Life of a Showgirl releases",
    admin: false,
    mode: "slash",
    async exec(msg) {
        const releaseTime = 1759464000;
        const now = Math.floor(Date.now() / 1000);

        if (now > releaseTime)
            return {
                embeds: [
                    {
                        color: 0x4a9b74,
                        description: `<:showgirl:1419562060081270784> The Life of a Showgirl is out now!`
                    }
                ],
                components: [
                    {
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: ComponentTypes.BUTTON,
                                url: "https://music.apple.com/ca/album/the-life-of-a-showgirl/1833328839",
                                label: "Listen on Apple Music",
                                style: ButtonStyles.SECONDARY
                            }
                        ]
                    }
                ]
            };

        return {
            embeds: [
                {
                    color: 0x4a9b74,
                    description: `<:showgirl:1419562060081270784> The Life of a Showgirl will be out in ${formatDuration(
                        now - releaseTime
                    )}!`
                }
            ]
        };
    }
});
