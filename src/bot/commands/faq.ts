import { ComponentTypes, MessageFlags, User } from "oceanic.js";
import { defineCommand, Duration } from "../../types";

let faq: {
    [tag: string]: {
        q: string;
        a: string;
    };
};

function buildFAQMessage(id: string, invokingUser?: User) {
    return {
        flags: MessageFlags.IS_COMPONENTS_V2,
        components: [
            {
                type: ComponentTypes.CONTAINER,
                components: [
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: `### ${faq[id].q}`
                    },
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: faq[id].a
                    },
                    ...(invokingUser
                        ? [
                              {
                                  type: ComponentTypes.TEXT_DISPLAY,
                                  content: `-# Auto-response invoked by ${invokingUser.tag}`
                              }
                          ]
                        : [])
                ]
            }
        ]
    };
}

export default defineCommand({
    name: "faq",
    aliases: ["f"],
    description: "See the FAQ or get an entry",
    admin: false,
    mode: "text",
    // @ts-expect-error
    async exec(msg) {
        if (msg.content.split(" ").length > 1) {
            const [, id] = msg.content.toLowerCase().split(" ");

            if (faq[id]) {
                if (msg.referencedMessage) {
                    msg.delete();
                    await msg.channel?.createMessage(
                        // @ts-expect-error
                        {
                            ...buildFAQMessage(id, msg.author),
                            messageReference: {
                                channelID: msg.channelID,
                                guildID: msg.guildID!,
                                messageID: msg.referencedMessage.id
                            },
                            allowedMentions: {
                                repliedUser: true,
                                users: false,
                                roles: false,
                                everyone: false
                            }
                        }
                    );
                    return null;
                }

                return buildFAQMessage(id);
            } else {
                await msg.createReaction("❓");
                return null;
            }
        }

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
