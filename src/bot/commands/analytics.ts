import { ButtonStyles, ComponentTypes, CreateMessageOptions, MessageFlags } from "oceanic.js";
import { db } from "../../database";
import { defineCommand } from "../../types";
import { Canvas } from "skia-canvas";
import { ArcElement, CategoryScale, Chart, Legend, PieController } from "chart.js";

function getRandomColor(): string {
    return `hsl(${Math.floor(Math.random() * 361)} 75.4% 69.3%)`.replaceAll("\n", "");
}

export async function buildAnalyticsMessage(range: "24h" | "all"): Promise<CreateMessageOptions> {
    const allowedVersions = await db.all("SELECT * FROM versions;");

    const requests = await db.all(
        "SELECT appVer FROM requests WHERE timestamp > ?",
        {
            "24h": Date.now() - 24 * 60 * 60 * 1000,
            all: 0
        }[range]
    );

    const versions: number[] = requests.map(r => r.appVer || 0);
    const unsortedCountPerVersion: { [version: number]: number } = {};
    for (const entry of versions) {
        if (!allowedVersions.some(av => av.id === entry)) continue;
        unsortedCountPerVersion[entry]
            ? (unsortedCountPerVersion[entry] = unsortedCountPerVersion[entry] + 1)
            : (unsortedCountPerVersion[entry] = 1);
    }
    const countPerVersion = Object.entries(unsortedCountPerVersion)
        .sort((a, b) => b[1] - a[1])
        .map(item => ({
            version: item[0],
            count: item[1]
        }));

    const total = versions.length;
    const percentages: {
        version: string;
        percent: string;
    }[] = [];
    for (const [version, count] of Object.entries(unsortedCountPerVersion)) {
        percentages.push({
            version: (() => {
                try {
                    return allowedVersions.find(av => av.id == version).name;
                } catch {
                    return version.toString();
                }
            })(),
            percent: ((count / total) * 100).toFixed(2) + "%"
        });
    }
    percentages.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

    Chart.register([CategoryScale, PieController, ArcElement, Legend]);

    const canvas = new Canvas(400, 500);
    const chart = new Chart(canvas as any, {
        type: "pie",
        data: {
            labels: countPerVersion.map(v => allowedVersions.find(av => av.id == v.version).name),
            datasets: [
                {
                    label: "Requests",
                    data: countPerVersion.map(v => v.count),
                    backgroundColor: Array.from({ length: countPerVersion.length }, () =>
                        getRandomColor()
                    )
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: "right",
                    align: "center",
                    labels: {
                        generateLabels(chart) {
                            const dataset = chart.data.datasets[0];

                            return chart.data.labels!.map((label, index) => {
                                const percentage =
                                    (((dataset.data[index] as number) / total) * 100).toFixed(2) +
                                    "%";
                                return {
                                    text: `${label} (${percentage})`,
                                    fillStyle: (dataset.backgroundColor as string[])[index],
                                    hidden: false,
                                    index,
                                    fontColor: (dataset.backgroundColor as string[])[index]
                                };
                            });
                        }
                    }
                }
            }
        }
    });

    const pngBuffer = await canvas.toBuffer("png", { matte: "transparent" });
    chart.destroy();

    const now = Date.now();
    return {
        flags: MessageFlags.IS_COMPONENTS_V2,
        files: [
            {
                name: "graph.png",
                contents: pngBuffer
            }
        ],
        components: [
            {
                type: ComponentTypes.CONTAINER,
                components: [
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: `### Most used versions ${
                            {
                                "24h": "in the last 24 hours",
                                all: "overall"
                            }[range]
                        }`
                    },
                    {
                        type: ComponentTypes.TEXT_DISPLAY,
                        content: percentages
                            .slice(0, 9)
                            .map(
                                (p, index) =>
                                    `${index + 1}. **${p.version}** ~ ${p.percent} (${
                                        countPerVersion.find(
                                            rv =>
                                                rv.version ==
                                                allowedVersions.find(av => av.name == p.version).id
                                        )?.count || 0
                                    })`
                            )
                            .join("\n")
                    },
                    {
                        type: ComponentTypes.MEDIA_GALLERY,
                        items: [
                            {
                                media: {
                                    url: "attachment://graph.png"
                                }
                            }
                        ]
                    },
                    // @ts-ignore
                    ...(range === "24h"
                        ? [
                              {
                                  type: ComponentTypes.SECTION,
                                  components: [
                                      {
                                          type: ComponentTypes.TEXT_DISPLAY,
                                          content: `-# Last updated: <t:${Math.floor(
                                              now / 1000
                                          )}:D> <t:${Math.floor(now / 1000)}:T>`
                                      }
                                  ],
                                  accessory: {
                                      type: ComponentTypes.BUTTON,
                                      label: "See alltime stats",
                                      style: ButtonStyles.PRIMARY,
                                      customID: "alltime"
                                  }
                              }
                          ]
                        : [])
                ]
            }
        ]
    };
}

export default defineCommand({
    name: "analytics",
    description: "Display version statistics",
    admin: false,
    async exec(_msg) {
        return await buildAnalyticsMessage("24h");
    },
    components: [
        {
            type: "button",
            customID: /^alltime$/,
            async exec(interaction) {
                await interaction.createMessage({
                    ...(await buildAnalyticsMessage("all")),
                    flags: MessageFlags.EPHEMERAL | MessageFlags.IS_COMPONENTS_V2
                });
            }
        }
    ]
});
