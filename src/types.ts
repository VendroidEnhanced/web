import {
    ApplicationCommandOptions,
    CommandInteraction,
    CreateMessageOptions,
    GuildComponentButtonInteraction,
    GuildComponentSelectMenuInteraction,
    GuildModalSubmitInteraction,
    Message
} from "oceanic.js";

interface BaseInteractionHandler {
    customID: RegExp;
    type: "button" | "select" | "modal";
}

interface ButtonInteractionHandler extends BaseInteractionHandler {
    type: "button";
    exec: (interaction: GuildComponentButtonInteraction) => void;
}

interface SelectInteractionHandler extends BaseInteractionHandler {
    type: "select";
    exec: (interaction: GuildComponentSelectMenuInteraction) => void;
}

interface ModalInteractionHandler extends BaseInteractionHandler {
    type: "modal";
    exec: (interaction: GuildModalSubmitInteraction) => void;
}

type AnyInteractionHandler =
    | ButtonInteractionHandler
    | SelectInteractionHandler
    | ModalInteractionHandler;

interface BaseCommand {
    name: string;
    aliases?: string[];
    description: string;
    admin?: boolean;
    components?: AnyInteractionHandler[];
    tasks?: {
        [id: string]: {
            interval: number;
            exec: () => void;
        };
    };
    options?: ApplicationCommandOptions[];
    mode?: "text" | "slash";
}

interface SlashCommand extends BaseCommand {
    mode?: "slash";
    options: ApplicationCommandOptions[];
    exec: (msg: CommandInteraction) => Promise<string | CreateMessageOptions | null>;
}

interface TextCommand extends BaseCommand {
    mode?: "text";
    options: ApplicationCommandOptions[];
    exec: (msg: Message) => Promise<string | CreateMessageOptions | null>;
}

export type Command = SlashCommand | TextCommand;

export const Duration = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
};

export function defineCommand(command: Command): Command {
    // @ts-expect-error
    return {
        name: command.name,
        aliases: command.aliases || [],
        description: command.description,
        exec: command.exec,
        components: command.components,
        admin: (() => {
            if (typeof command.admin === "undefined") return true;
            else return command.admin;
        })(),
        mode: (() => {
            if (typeof command.mode === "undefined") return "text";
            else return command.mode;
        })(),
        options: command.options || [],
        tasks: command.tasks
    };
}
