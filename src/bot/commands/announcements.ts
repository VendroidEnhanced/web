import {
    ButtonStyles,
    ComponentTypes,
    CreateMessageOptions,
    MessageFlags,
    TextInputStyles
} from "oceanic.js";
import { db } from "../../database";
import { defineCommand } from "../../types";

async function buildAnnouncementsMessage(): Promise<CreateMessageOptions> {
    const announcements: {
        id: number;
        title: string;
        text: string;
        isUpdate: boolean;
        minVersion: number;
        maxVersion: number;
        published: boolean;
    }[] = await db.all("SELECT * FROM announcements;");

    return {
        flags: MessageFlags.IS_COMPONENTS_V2,
        components: [
            {
                type: ComponentTypes.CONTAINER,
                components: [
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: "### Announcements"
                    },
                    // @ts-ignore
                    ...announcements.map(announcement => ({
                        type: ComponentTypes.SECTION,
                        components: [
                            {
                                type: ComponentTypes.TEXT_DISPLAY,
                                content: `${
                                    [
                                        [
                                            "<:update:1416347050076798977>",
                                            "<:announcement:1416347060512227439>"
                                        ],
                                        [
                                            "<:updateLocked:1416348040414888058>",
                                            "<:announcementLocked:1416348050624086046>"
                                        ]
                                    ][announcement.published ? 0 : 1][announcement.isUpdate ? 0 : 1]
                                }  ${announcement.title} (\`${announcement.id}\`)`
                            }
                        ],
                        accessory: {
                            type: ComponentTypes.BUTTON,
                            customID: `showannouncement-${announcement.id}`,
                            emoji: {
                                name: "more",
                                id: "1416346342120357939",
                                animated: false
                            },
                            style: ButtonStyles.PRIMARY
                        }
                    })),
                    {
                        // @ts-ignore
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                // @ts-ignore
                                type: ComponentTypes.BUTTON,
                                customID: `newannouncement`,
                                label: "New announcement",
                                style: ButtonStyles.PRIMARY
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

async function buildAnnouncementMessage(id: number): Promise<CreateMessageOptions> {
    const announcement: {
        id: number;
        title: string;
        text: string;
        isUpdate: boolean;
        minVersion: number;
        maxVersion: number;
        published: boolean;
    } = (await db.all("SELECT * FROM announcements WHERE id=?", id))[0];

    return {
        components: [
            {
                type: ComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: ComponentTypes.BUTTON,
                        customID: "lsannouncements",
                        label: "Back",
                        style: ButtonStyles.SECONDARY
                    }
                ]
            },
            {
                type: ComponentTypes.CONTAINER,
                components: [
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: `### ${
                            [
                                [
                                    "<:update:1416347050076798977>",
                                    "<:announcement:1416347060512227439>"
                                ],
                                [
                                    "<:updateLocked:1416348040414888058>",
                                    "<:announcementLocked:1416348050624086046>"
                                ]
                            ][announcement.published ? 0 : 1][announcement.isUpdate ? 0 : 1]
                        }  ${announcement.title} (\`${announcement.id}\`)\n${
                            announcement.text
                        }\n\n-# Visible on ${(() => {
                            if (!announcement.minVersion && !announcement.maxVersion)
                                return "all versions";
                            if (announcement.minVersion && !announcement.maxVersion)
                                return `versions above v${announcement.minVersion}`;
                            if (!announcement.minVersion && announcement.maxVersion)
                                return `versions below v${announcement.maxVersion}`;
                            if (announcement.minVersion && announcement.maxVersion)
                                return `versions between v${announcement.minVersion} and v${announcement.maxVersion}`;
                        })()}`
                    },
                    {
                        type: ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: ComponentTypes.BUTTON,
                                ...(announcement.published
                                    ? {
                                          style: ButtonStyles.SUCCESS,
                                          label: "Published",
                                          customID: `unpublish-${announcement.id}`
                                      }
                                    : {
                                          style: ButtonStyles.PRIMARY,
                                          label: "Publish",
                                          customID: `publish-${announcement.id}`
                                      })
                            },
                            {
                                type: ComponentTypes.BUTTON,
                                style: ButtonStyles.DANGER,
                                label: "Delete",
                                customID: `delete-${announcement.id}`
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

export default defineCommand({
    name: "announcements",
    description: "Manage announcements",
    async exec(msg) {
        return await buildAnnouncementsMessage();
    },
    components: [
        {
            type: "button",
            customID: /showannouncement-.+/,
            async exec(interaction) {
                await interaction.editParent(
                    await buildAnnouncementMessage(
                        parseInt(interaction.data.customID.replace("showannouncement-", ""))
                    )
                );
            }
        },
        {
            type: "button",
            customID: /^unpublish-.+/,
            async exec(interaction) {
                await db.run(
                    "UPDATE announcements SET published=false WHERE id=?",
                    interaction.data.customID.replace("unpublish-", "")
                );
                await interaction.editParent(
                    await buildAnnouncementMessage(
                        parseInt(interaction.data.customID.replace("unpublish-", ""))
                    )
                );
            }
        },
        {
            type: "button",
            customID: /^publish-.+/,
            async exec(interaction) {
                await db.run(
                    "UPDATE announcements SET published=true WHERE id=?",
                    interaction.data.customID.replace("publish-", "")
                );
                await interaction.editParent(
                    await buildAnnouncementMessage(
                        parseInt(interaction.data.customID.replace("publish-", ""))
                    )
                );
            }
        },
        {
            type: "button",
            customID: /^delete-.+/,
            async exec(interaction) {
                await db.run(
                    "DELETE FROM announcements WHERE id=?",
                    interaction.data.customID.replace("delete-", "")
                );
                await interaction.editParent(await buildAnnouncementsMessage());
            }
        },
        {
            type: "button",
            customID: /^lsannouncements$/,
            async exec(interaction) {
                await interaction.editParent(await buildAnnouncementsMessage());
            }
        },
        {
            type: "button",
            customID: /^newannouncement$/,
            async exec(interaction) {
                await interaction.createModal({
                    title: `New announcement`,
                    customID: `addannouncement`,
                    components: [
                        {
                            type: ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentTypes.TEXT_INPUT,
                                    label: "Is update?",
                                    customID: "update",
                                    placeholder: "Enter any character for yes",
                                    style: TextInputStyles.SHORT,
                                    required: false,
                                    maxLength: 1
                                }
                            ]
                        },
                        {
                            type: ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentTypes.TEXT_INPUT,
                                    label: "Versions",
                                    customID: "versions",
                                    placeholder: "Separate min-max like that. 0 for any",
                                    style: TextInputStyles.SHORT,
                                    required: true
                                }
                            ]
                        },
                        {
                            type: ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentTypes.TEXT_INPUT,
                                    label: "Title",
                                    customID: "title",
                                    style: TextInputStyles.SHORT,
                                    required: true
                                }
                            ]
                        },
                        {
                            type: ComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentTypes.TEXT_INPUT,
                                    label: "Description",
                                    customID: "description",
                                    style: TextInputStyles.PARAGRAPH,
                                    required: true
                                }
                            ]
                        }
                    ]
                });
            }
        },
        {
            type: "modal",
            customID: /^addannouncement$/,
            async exec(interaction) {
                const title = interaction.data.components.getTextInput("title", true);
                const text = interaction.data.components.getTextInput("description", true);
                const isUpdate = !!interaction.data.components.getTextInput("update");
                const [minVersion, maxVersion] = interaction.data.components
                    .getTextInput("versions", true)
                    .split("-");

                const sql = await db.run(
                    "INSERT INTO announcements (title, text, isUpdate, minVersion, maxVersion, published) VALUES (?, ?, ?, ?, ?, false)",
                    title,
                    text,
                    isUpdate,
                    minVersion,
                    maxVersion
                );

                if (!sql.lastID) return;
                await interaction.editParent(await buildAnnouncementMessage(sql.lastID));
            }
        }
    ]
});
