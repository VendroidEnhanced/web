import { ApplicationCommandOptionTypes } from "oceanic.js";
import { defineCommand } from "../../types";
import util from "node:util";
import child_process from "node:child_process";
const exec = util.promisify(child_process.exec);

const CADDYFILE_TEMPLATE = `@abandonware host abandonware.nin0.dev
handle @abandonware {
	reverse_proxy URL {
		header_up Host HOST
		transport http {
			tls
			tls_server_name HOST
		}
	}
}`;

export default defineCommand({
    name: "abandonware",
    description: "set/edit abandonware point",
    admin: true,
    options: [
        {
            name: "url",
            required: false,
            description: "url",
            type: ApplicationCommandOptionTypes.STRING
        }
    ],
    mode: "slash",
    async exec(int) {
        const possibleUrl = int.data.options.getString("url");
        if (!possibleUrl) {
            const { stdout } = await exec(
                "ssh -o StrictHostKeyChecking=no nin0@100.64.64.64 cat /srv/sites/abandonware.caddy"
            );
            const [, fullURL, hostname] =
                stdout.match(/reverse_proxy (https?:\/\/(.+)) {/) || Array(3).fill(undefined);

            if (!fullURL || !hostname) return "couldn't get current abandonware";
            return `[abandonware.nin0.dev](https://abandonware.nin0.dev) currently points to [${hostname}](<${fullURL}>)`;
        } else {
            try {
                const url = new URL(
                    possibleUrl.includes("http") ? possibleUrl : `https://${possibleUrl}`
                );
                await exec(
                    `ssh -o StrictHostKeyChecking=no nin0@100.64.64.64 "echo '${CADDYFILE_TEMPLATE.replaceAll(
                        "URL",
                        url.toString().replace(/\/+$/, "")
                    )
                        .replaceAll("HOST", url.hostname)
                        .replace(/'/g, "'\\''")}' > /srv/sites/abandonware.caddy"`
                );
                await exec(
                    `ssh -o StrictHostKeyChecking=no nin0@100.64.64.64 docker exec -t caddy "sh -c 'cd /etc/caddy && /usr/bin/caddy reload'"`
                );

                return `[abandonware.nin0.dev](https://abandonware.nin0.dev?${Date.now()}) now points to [${
                    url.hostname
                }](<${url.toString()}>)`;
            } catch (e) {
                console.error(e);
                return "couldn't set abandonware";
            }
        }
    }
});
