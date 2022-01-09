import * as fs from "fs";

import _ from "lodash";
import { z } from "zod";

const configSchema = z.object({
  bot_token: z.string().nonempty(),
  client_id: z.string().nonempty(),
  mcserver_address: z.string().nonempty().default("localhost"),
  mcserver_port: z.number().default(25565),
  polling_interval: z.number().default(10000),
});

export const getConfig = _.memoize((pathname = "config.json") => {
  let rawConfig;
  try {
    rawConfig = JSON.parse(fs.readFileSync(pathname, "utf-8"));
  } catch (_err) {
    console.error(`The file "${pathname}" must exist`);
    process.exit(1);
  }

  try {
    const parsed = configSchema.parse(rawConfig);

    return new Proxy(parsed, {
      get(obj, key) {
        if (key in obj) return obj[key];
        else throw new Error(`Invalid config key was accessed: ${key}`);
      },
    });
  } catch (err) {
    console.error(
      `The file "${pathname}" has errors:\n` +
        err.issues
          ?.map((is) => "  " + is.path.join(" > ") + ": " + is.message)
          .join("\n") || err.message
    );
    process.exit(1);
  }
});
