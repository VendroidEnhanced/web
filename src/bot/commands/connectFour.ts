import {
    AnyComponentButtonInteraction,
    ApplicationCommandOptionTypes,
    ButtonStyles,
    CommandInteraction,
    ComponentTypes,
    CreateMessageOptions,
    MessageFlags,
    User
} from "oceanic.js";
import { defineCommand } from "../../types";
import { Request, Response } from "express";

type C4User = {
    ready: boolean;
    messageID?: string;
    user: User;
    token: string;
};

enum Value {
    BLANK,
    RED,
    YELLOW
}

type C4Grid = [
    [Value, Value, Value, Value, Value, Value, Value],
    [Value, Value, Value, Value, Value, Value, Value],
    [Value, Value, Value, Value, Value, Value, Value],
    [Value, Value, Value, Value, Value, Value, Value],
    [Value, Value, Value, Value, Value, Value, Value],
    [Value, Value, Value, Value, Value, Value, Value]
];

function randomID() {
    return String(Math.floor(Math.random() * 10000000)).padStart(7, "0");
}

class C4Game {
    id: string;
    user1: C4User;
    user2: C4User;
    publicMessageID?: string;
    publicInteraction?: CommandInteraction;
    player2Interaction?: AnyComponentButtonInteraction;
    turn: Value.RED | Value.YELLOW = Value.RED;
    grid: C4Grid = Array.from({ length: 6 }, () =>
        Array.from({ length: 7 }, () => Value.BLANK)
    ) as C4Grid;

    getPublicMessage() {
        return this.publicInteraction?.getFollowup(this.publicMessageID!);
    }
    getPlayer1Message() {
        return this.publicInteraction?.getFollowup(this.user1.messageID!);
    }
    getPlayer2Message() {
        return this.player2Interaction?.getFollowup(this.user2.messageID!);
    }
    editPublicMessage(opts: CreateMessageOptions) {
        this.publicInteraction?.editFollowup(this.publicMessageID!, opts);
    }
    editPlayer1Message(opts: CreateMessageOptions) {
        this.publicInteraction?.editFollowup(this.user1.messageID!, opts);
    }
    editPlayer2Message(opts: CreateMessageOptions) {
        this.player2Interaction?.editFollowup(this.user2.messageID!, opts);
    }
    isWin():
        | {
              result: "draw" | "none";
          }
        | {
              result: "win";
              side: Value.RED | Value.YELLOW;
              winningTiles: number[][];
          } {
        let ri = 0;
        let canBeDraw = true;
        for (const row of this.grid) {
            let ci = 0;
            for (const item of row) {
                if (item === Value.BLANK) canBeDraw = false;
                if (item !== Value.BLANK) {
                    if (
                        ci <= 3 &&
                        item === this.grid[ri][ci + 1] &&
                        item === this.grid[ri][ci + 2] &&
                        item === this.grid[ri][ci + 3]
                    ) {
                        return {
                            result: "win",
                            side: item,
                            winningTiles: [
                                [ri, ci],
                                [ri, ci + 1],
                                [ri, ci + 2],
                                [ri, ci + 3]
                            ]
                        };
                    }
                    if (
                        ri <= 2 &&
                        item === this.grid[ri + 1][ci] &&
                        item === this.grid[ri + 2][ci] &&
                        item === this.grid[ri + 3][ci]
                    ) {
                        return {
                            result: "win",
                            side: item,
                            winningTiles: [
                                [ri, ci],
                                [ri + 1, ci],
                                [ri + 2, ci],
                                [ri + 3, ci]
                            ]
                        };
                    }
                    if (
                        ri <= 2 &&
                        ci <= 3 &&
                        item === this.grid[ri + 1][ci + 1] &&
                        item === this.grid[ri + 2][ci + 2] &&
                        item === this.grid[ri + 3][ci + 3]
                    ) {
                        return {
                            result: "win",
                            side: item,
                            winningTiles: [
                                [ri, ci],
                                [ri + 1, ci + 1],
                                [ri + 2, ci + 2],
                                [ri + 3, ci + 3]
                            ]
                        };
                    }
                    if (
                        ri <= 2 &&
                        ci >= 3 &&
                        item === this.grid[ri + 1][ci - 1] &&
                        item === this.grid[ri + 2][ci - 2] &&
                        item === this.grid[ri + 3][ci - 3]
                    ) {
                        return {
                            result: "win",
                            side: item,
                            winningTiles: [
                                [ri, ci],
                                [ri + 1, ci - 1],
                                [ri + 2, ci - 2],
                                [ri + 3, ci - 3]
                            ]
                        };
                    }
                }
                ci++;
            }
            ri++;
        }
        return {
            result: canBeDraw ? "draw" : "none"
        };
    }

    getGridText(allowLinks: boolean, user?: 1 | 2, winningTiles: number[][] = []) {
        return this.grid
            .map((line, ri) =>
                line
                    .map((item, ci) => {
                        let symbol = "";
                        const isWinTile = winningTiles.some(t => t[0] === ri && t[1] === ci);
                        switch (item) {
                            case Value.BLANK: {
                                symbol = "🔳";
                                break;
                            }
                            case Value.RED: {
                                symbol = isWinTile ? "❤️" : "🔴";
                                break;
                            }
                            case Value.YELLOW: {
                                symbol = isWinTile ? "💛" : "🟡";
                                break;
                            }
                        }
                        return `${allowLinks ? "[" : ""}\` ${symbol} \`${
                            allowLinks
                                ? `](https://${process.env.VENDROID_BASE_URL}/c4/${this.id}/${
                                      this[`user${user!}`].token
                                  }/${ci})`
                                : ""
                        }`;
                    })
                    .join(" ")
            )
            .join("\n");
    }

    constructor(user1: User, user2: User) {
        this.id = randomID();
        this.user1 = {
            user: user1,
            ready: false,
            token: randomID()
        };
        this.user2 = {
            user: user2,
            ready: false,
            token: randomID()
        };
        games.push(this);
    }

    test() {
        this;
    }
}

function getGame(id: string): C4Game | undefined {
    return games.find(g => g.id === id);
}
const games: C4Game[] = [];

function h1(string: string) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect 4</title>
    <style>
        h1 {
            display: block;
            width: 100%;
            text-align: center;
            font-family: sans-serif;
            color: white;
        }
        body {
            background-color: #202020;
        }
    </style>
</head>
<body>
    <h1>${string}</h1>
</body>
</html>
    `;
}

const yourTurnText = `, it's your turn!
## DO NOT DISMISS THIS MESSAGE
To play, click on a blank tile. You can click anywhere in the column.
-# You may see a \"Leaving Discord\" popup when clicking on a tile. That's because every tile is a link. I suggest to enable the \"Trust ${process.env.VENDROID_BASE_URL} links from now on\" option to save some time.\n`;
const waitingTurnText = "## DO NOT DISMISS THIS MESSAGE\nWaiting for your opponent to play...";

export default defineCommand({
    name: "connect-four",
    description: "Play a Game of Connect Four",
    admin: false,
    mode: "slash",
    options: [
        {
            type: ApplicationCommandOptionTypes.USER,
            name: "user",
            required: true,
            description: "Who to challenge"
        }
    ],
    async exec(interaction) {
        const challenged = interaction.data.options.getUser("user", true);
        if (challenged.id === interaction.user.id)
            return {
                content: "You cannot challenge yourself, idiot."
            };
        if (challenged.bot) return { content: "You cannot challenge a bot." };

        const game = new C4Game(interaction.user, challenged);
        game.user1.ready = true;

        const publicMessage = await interaction.createFollowup({
            content: `${challenged.mention}, ${interaction.user.mention} has challenged you to a Connect 4 game.`,
            embeds: [
                {
                    title: "Instructions",
                    description:
                        "Connect 4 is a game where you can throw pieces in columns. Each person has a color.\nWhen you put a piece in a column, it will go as low as possible.\nTo win, put 4 pieces of your color next to each other either vertically, horizontally, or diagonally."
                }
            ],
            allowedMentions: {
                users: true,
                roles: true,
                everyone: true,
                repliedUser: true
            },
            components: [
                {
                    type: ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: ComponentTypes.BUTTON,
                            style: ButtonStyles.PRIMARY,
                            label: "Accept challenge",
                            customID: `c4-accept-${game.id}`
                        }
                    ]
                }
            ]
        });
        game.publicMessageID = publicMessage.message.id;
        game.publicInteraction = interaction;
        const challengerPM = await interaction.createFollowup({
            content: "## DO NOT DISMISS THIS MESSAGE\n\nWaiting for your opponent to accept...",
            flags: MessageFlags.EPHEMERAL
        });
        game.user1.messageID = challengerPM.message.id;

        return null;
    },
    web: {
        "/c4/:game/:user/:column": async (req, res) => {
            const { game: gameID, user: userID } = req.params;
            const column = parseInt(req.params.column);
            if (Number.isNaN(column)) return res.status(400).send(h1("Invalid Column"));
            const game = getGame(gameID);
            if (!game) return res.status(400).send(h1("This game is dead, remake one"));
            const grid = game.grid;

            const user = game.user1.token === userID ? 1 : game.user2.token === userID ? 2 : 0;
            if (user === 0) return res.status(400).send(h1("Invalid User"));
            if ((user == 1 && game.turn === Value.YELLOW) || (user == 2 && game.turn === Value.RED))
                return res.status(400).send(h1("It's not your turn"));

            const tile = [, Value.RED, Value.YELLOW][user];
            if (!tile) throw "";
            let didWork = false;
            for (let i = 5; i >= 0; i--) {
                const item = game.grid[i][column];
                if (item === Value.BLANK) {
                    game.grid[i][column] = tile;
                    didWork = true;
                    break;
                }
            }
            if (!didWork) return res.status(400).send(h1("Column is filled, try another one"));
            game.turn = game.turn === Value.RED ? Value.YELLOW : Value.RED;

            const outcome = game.isWin();
            switch (outcome.result) {
                case "draw": {
                    await game.publicInteraction!.deleteFollowup(
                        (await game.getPlayer1Message())!.id
                    );
                    await game.player2Interaction!.deleteFollowup(
                        (await game.getPlayer2Message())!.id
                    );
                    await game.publicInteraction!.createFollowup({
                        content: `Game over!

It was a draw between ${game.user1.user.mention} and ${game.user2.user.mention}.`,
                        embeds: [
                            {
                                title: "Connect 4",
                                description: game.getGridText(false)
                            }
                        ]
                    });
                    await game.publicInteraction!.deleteFollowup(
                        (
                            await game.getPublicMessage()!
                        ).id
                    );
                    games.splice(games.indexOf(game), 1);
                    break;
                }
                case "win": {
                    await game.publicInteraction!.deleteFollowup(
                        (await game.getPlayer1Message())!.id
                    );
                    await game.player2Interaction!.deleteFollowup(
                        (await game.getPlayer2Message())!.id
                    );
                    const winner = outcome.side === Value.RED ? game.user1.user : game.user2.user;
                    const loser = outcome.side === Value.RED ? game.user2.user : game.user1.user;
                    await game.publicInteraction!.createFollowup({
                        content: `Game over!

${outcome.side === Value.RED ? "🔴" : "🟡"} ${winner.mention} won.
${outcome.side === Value.YELLOW ? "🔴" : "🟡"} ${loser.mention} lost.`,
                        embeds: [
                            {
                                title: "Connect 4",
                                color: outcome.side === Value.RED ? 0xdb273b : 0xffff00,
                                description: game.getGridText(false, 1, outcome.winningTiles)
                            }
                        ]
                    });
                    await game.publicInteraction!.deleteFollowup(
                        (
                            await game.getPublicMessage()!
                        ).id
                    );
                    games.splice(games.indexOf(game), 1);
                    break;
                }
                case "none": {
                    await game.editPublicMessage({
                        content: `🔴 ${game.user1.user.mention}
🟡 ${game.user2.user.mention}`,
                        embeds: [
                            {
                                title: "Connect 4",
                                color: game.turn === Value.RED ? 0xdb273b : 0xffff00,
                                description: game.getGridText(false)
                            }
                        ]
                    });
                    await game[`editPlayer${user}Message`]({
                        content:
                            waitingTurnText +
                            `\nYou are ${user === 1 ? "🔴 **red**" : "🟡 **yellow**"}.`,
                        allowedMentions: {
                            users: true,
                            roles: true,
                            everyone: true,
                            repliedUser: true
                        },
                        embeds: [
                            {
                                description: game.getGridText(false)
                            }
                        ]
                    });
                    await game[`editPlayer${user === 1 ? 2 : 1}Message`]({
                        content:
                            game[`user${user === 1 ? 2 : 1}`].user.mention +
                            yourTurnText +
                            `\nYou are ${user === 1 ? "🟡 **yellow**" : "🔴 **red**"}.`,
                        allowedMentions: {
                            users: true,
                            roles: true,
                            everyone: true,
                            repliedUser: true
                        },
                        embeds: [
                            {
                                description: game.getGridText(true, user === 1 ? 2 : 1)
                            }
                        ]
                    });
                    break;
                }
            }
            res.send(h1("Go back to Discord."));
        }
    },
    components: [
        {
            type: "button",
            customID: /c4-accept-.+/,
            async exec(interaction) {
                await interaction.defer(MessageFlags.EPHEMERAL);
                const gameID = interaction.data.customID.replace("c4-accept-", "");
                const game = getGame(gameID);
                if (!game) return;
                if (interaction.user.id !== game.user2.user.id) return;
                await game.editPublicMessage({
                    content: `🔴 ${game.user1.user.mention}
🟡 ${game.user2.user.mention}`,
                    allowedMentions: {
                        users: [],
                        repliedUser: false,
                        everyone: false,
                        roles: []
                    },
                    embeds: [
                        {
                            title: "Connect 4",
                            color: 0xdb273b,
                            description: game.getGridText(false)
                        }
                    ],
                    components: []
                });

                await game.editPlayer1Message({
                    content: game.user1.user.mention + yourTurnText + `\nYou are 🔴 **red**.`,
                    allowedMentions: {
                        users: true,
                        roles: true,
                        everyone: true,
                        repliedUser: true
                    },
                    embeds: [
                        {
                            description: game.getGridText(true, 1)
                        }
                    ]
                });
                const p2R = await interaction.createFollowup({
                    content: waitingTurnText + `\nYou are 🟡 **yellow**.`,
                    allowedMentions: {
                        users: true,
                        roles: true,
                        everyone: true,
                        repliedUser: true
                    },
                    embeds: [
                        {
                            description: game.getGridText(false)
                        }
                    ],
                    flags: MessageFlags.EPHEMERAL
                });
                game.player2Interaction = interaction;
                game.user2.messageID = p2R.message.id;
            }
        }
    ]
});
