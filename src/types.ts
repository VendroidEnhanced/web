import {
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

export type Command = {
    name: string;
    description: string;
    admin?: boolean;
    exec: (msg: Message) => Promise<string | CreateMessageOptions | null>;
    components?: AnyInteractionHandler[];
    tasks?: {
        [id: string]: {
            interval: number;
            exec: () => void;
        };
    };
};

export const Duration = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
};

export function defineCommand(command: Command): Command {
    return {
        name: command.name,
        description: command.description,
        exec: command.exec,
        components: command.components,
        admin: (() => {
            if (typeof command.admin === "undefined") return true;
            else return command.admin;
        })(),
        tasks: command.tasks
    };
}
