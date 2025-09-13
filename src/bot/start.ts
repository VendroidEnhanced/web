import {
    AllIntents,
    Client,
    ComponentTypes,
    GuildComponentButtonInteraction,
    GuildComponentSelectMenuInteraction,
    GuildModalSubmitInteraction,
    InteractionTypes,
    MessageFlags,
    MessageReference
} from "oceanic.js";
import { Command } from "../types";
import ping from "./commands/ping";
import update from "./commands/update";
import build from "./commands/build";
import contributors from "./commands/contributors";
import announcements from "./commands/announcements";
import help from "./commands/help";
import analytics, { buildAnalyticsMessage } from "./commands/analytics";
import addVer from "./commands/addVer";

export const commands: Command[] = [
    analytics,
    help,
    ping,
    build,
    update,
    contributors,
    announcements,
    addVer
];

export const bot = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    gateway: {
        intents: AllIntents
    },
    allowedMentions: {
        users: false,
        repliedUser: false,
        roles: false,
        everyone: false
    }
});

bot.on("ready", async () => {
    console.log("Discord connected as", bot.user.tag);

    setInterval(
        async () =>
            bot.rest.channels.editMessage(
                "1414028198135730206",
                "1416491400811511979",
                await buildAnalyticsMessage("24h")
            ),
        600000
    );
    bot.rest.channels.editMessage(
        "1414028198135730206",
        "1416491400811511979",
        await buildAnalyticsMessage("24h")
    );
});

bot.on("messageReactionAdd", async msg => {
    if (msg.id === "1416491400811511979" && msg.channelID === "1414028198135730206") {
        await bot.rest.channels.editMessage(
            "1414028198135730206",
            "1416491400811511979",
            await buildAnalyticsMessage("24h")
        );
        await bot.rest.channels.deleteReactions("1414028198135730206", "1416491400811511979");
    }
});

bot.on("messageCreate", async msg => {
    if (msg.author.id === bot.user.id) return;
    if (!msg.guild) return;
    if (msg.guildID !== "1274790619146879108") return;

    if (msg.content.startsWith("!")) {
        const command = msg.content.split(/( |\n)/)[0].replace("!", "");

        for (const cd of commands) {
            if (cd.name === command) {
                if (cd.admin && msg.author.id !== "886685857560539176")
                    return msg.createReaction("💢");

                const returnValue = await cd.exec(msg);
                const messageReference: MessageReference = {
                    guildID: msg.guildID,
                    channelID: msg.channelID,
                    messageID: msg.id
                };

                typeof returnValue === "string"
                    ? await msg.channel?.createMessage({
                          content: returnValue,
                          messageReference
                      })
                    : await msg.channel?.createMessage({
                          ...returnValue,
                          messageReference
                      });
            }
        }
    }
});

bot.on("interactionCreate", async interaction => {
    switch (interaction.type) {
        case InteractionTypes.MODAL_SUBMIT: {
            for (const command of commands) {
                if (command.components) {
                    for (const component of command.components.filter(c => c.type === "modal")) {
                        if (!component.customID.test(interaction.data.customID)) continue;
                        await component.exec(interaction as GuildModalSubmitInteraction);
                    }
                }
            }
            break;
        }
        case InteractionTypes.MESSAGE_COMPONENT: {
            for (const command of commands) {
                if (command.components) {
                    for (const component of command.components) {
                        switch (component.type) {
                            case "button": {
                                if (interaction.data.componentType === ComponentTypes.BUTTON) {
                                    if (
                                        command.admin &&
                                        interaction.user.id !== "886685857560539176"
                                    )
                                        return;

                                    if (!component.customID.test(interaction.data.customID))
                                        continue;
                                    await component.exec(
                                        interaction as GuildComponentButtonInteraction
                                    );
                                }
                                break;
                            }
                            case "select": {
                                if (
                                    [
                                        ComponentTypes.ROLE_SELECT,
                                        ComponentTypes.USER_SELECT,
                                        ComponentTypes.STRING_SELECT,
                                        ComponentTypes.CHANNEL_SELECT,
                                        ComponentTypes.MENTIONABLE_SELECT
                                    ].includes(interaction.data.componentType)
                                ) {
                                    if (
                                        command.admin &&
                                        interaction.user.id !== "886685857560539176"
                                    )
                                        return;

                                    if (!component.customID.test(interaction.data.customID))
                                        continue;
                                    await component.exec(
                                        interaction as GuildComponentSelectMenuInteraction
                                    );
                                }
                            }
                        }
                    }
                }
            }
            break;
        }
    }
});

export async function connect() {
    await bot.connect();
}
