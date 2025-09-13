import {
    ButtonStyles,
    ComponentTypes,
    CreateMessageOptions,
    MessageFlags,
    TextInputStyles
} from "oceanic.js";
import { db } from "../../database";
import { defineCommand } from "../../types";
import { bot } from "../start";

async function buildContributorMessage(): Promise<CreateMessageOptions> {
    const contributors: {
        id: string;
        description: string;
    }[] = await db.all("SELECT * FROM contributors;");

    const contribExtras = await Promise.all(
        contributors.map(async c => ({
            ...c,
            user: await bot.rest.users.get(c.id)
        }))
    );

    return {
        flags: MessageFlags.IS_COMPONENTS_V2,
        components: [
            {
                type: ComponentTypes.CONTAINER,
                components: [
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: `### Contributors`
                    },
                    // @ts-ignore
                    ...contribExtras.map(contributor => ({
                        type: ComponentTypes.SECTION,
                        components: [
                            {
                                type: ComponentTypes.TEXT_DISPLAY,
                                content: `<@${contributor.user.id}> (\`@${contributor.user.tag}\`)\n${contributor.description}\n-# \`${contributor.id}\``
                            }
                        ],
                        accessory: {
                            type: ComponentTypes.BUTTON,
                            customID: `rmcontrib-${contributor.id}`,
                            emoji: {
                                name: "delete",
                                id: "1416328520292110346",
                                animated: false
                            },
                            style: ButtonStyles.DANGER
                        }
                    })),
                    {
                        // @ts-ignore
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                // @ts-ignore
                                type: ComponentTypes.USER_SELECT,
                                customID: "addcontrib",
                                placeholder: "Add contributor"
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

export default defineCommand({
    name: "contributors",
    description: "Manage contributor badges",
    async exec(msg) {
        return await buildContributorMessage();
    },
    components: [
        {
            type: "button",
            customID: /^rmcontrib.+/,
            async exec(interaction) {
                await db.run(
                    "DELETE FROM contributors WHERE id=?",
                    interaction.data.customID.replace("rmcontrib-", "")
                );

                await interaction.editParent(await buildContributorMessage());
            }
        },
        {
            type: "select",
            customID: /^addcontrib$/,
            async exec(interaction) {
                const user = interaction.data.values.getUsers(true)[0];

                await interaction.createModal({
                    title: `Add ${user.tag} as contributor`,
                    customID: `addcontrib-${user.id}`,
                    components: [
                        {
                            type: ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentTypes.TEXT_INPUT,
                                    label: "Description",
                                    customID: "description",
                                    value: "Contributor",
                                    style: TextInputStyles.SHORT
                                }
                            ]
                        }
                    ]
                });
            }
        },
        {
            type: "modal",
            customID: /^addcontrib-.+/,
            async exec(interaction) {
                await db.run(
                    "INSERT INTO contributors VALUES (?, ?)",
                    interaction.data.customID.replace("addcontrib-", ""),
                    interaction.data.components.getTextInput("description", true)
                );

                await interaction.editParent(await buildContributorMessage());
            }
        }
    ]
});
