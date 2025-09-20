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
import say from "./commands/say";
import restart from "./commands/restart";
import faq from "./commands/faq";

export const commands: Command[] = [
    analytics,
    help,
    ping,
    build,
    update,
    contributors,
    announcements,
    addVer,
    say,
    restart,
    faq
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

const disabledTasks: string[] = [];

bot.on("ready", async () => {
    console.log("Discord connected as", bot.user.tag);

    for (const command of commands.filter(c => c.tasks)) {
        for (const [id, task] of Object.entries(command.tasks!)) {
            await task.exec();
            setInterval(() => {
                if (!disabledTasks.includes(id)) task.exec();
            }, task.interval);
        }
    }
});

bot.on("messageCreate", async msg => {
    if (msg.author.id === bot.user.id) return;
    if (!msg.guild) return;
    if (msg.guildID !== process.env.ALLOWED_GUILD) return;

    if (msg.content.startsWith(process.env.PREFIX!)) {
        const command = msg.content
            .toLowerCase()
            .split(/( |\n)/)[0]
            .replace(process.env.PREFIX!, "");

        for (const cd of commands) {
            if (cd.name === command || cd.aliases!.includes(command)) {
                if (cd.admin && msg.author.id !== process.env.ADMIN_ID)
                    return msg.createReaction("💢");

                const returnValue = await cd.exec(msg);
                const messageReference: MessageReference = {
                    guildID: msg.guildID,
                    channelID: msg.channelID,
                    messageID: msg.id
                };

                if (!returnValue) return;
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
                                        interaction.user.id !== process.env.ADMIN_ID
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
                                        interaction.user.id !== process.env.ADMIN_ID
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
