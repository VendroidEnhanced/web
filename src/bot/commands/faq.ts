import { ComponentTypes, MessageFlags } from "oceanic.js";
import { defineCommand, Duration } from "../../types";

let faq: {
    [tag: string]: {
        q: string;
        a: string;
    };
};

export default defineCommand({
    name: "faq",
    description: "See the FAQ or get an entry",
    admin: false,
    async exec(msg) {
        return {
            flags: MessageFlags.IS_COMPONENTS_V2,
            components: [
                {
                    type: ComponentTypes.CONTAINER,
                    components: [
                        {
                            type: ComponentTypes.TEXT_DISPLAY,
                            content: "### FAQ"
                        },
                        {
                            type: ComponentTypes.TEXT_DISPLAY,
                            content: Object.entries(faq)
                                .map(
                                    ([key, { q: question }], index) =>
                                        `${index + 1}. ${question} (\`${key}\`)`
                                )
                                .join("\n")
                        },
                        {
                            type: ComponentTypes.TEXT_DISPLAY,
                            content: `-# Use \`${process.env.PREFIX}faq [tag]\` to show a question`
                        }
                    ]
                }
            ]
        };
    },
    tasks: {
        updateFAQ: {
            interval: 1 * Duration.HOUR,
            async exec() {
                faq = await (
                    await fetch(
                        "https://raw.githubusercontent.com/VendroidEnhanced/site/refs/heads/main/src/faq.json"
                    )
                ).json();
            }
        }
    }
});
