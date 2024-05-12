import { launchApp } from "./app/index.js";
import { development, production } from "./core/index.js";
import { launchBot } from "./bot/index.js";

const bot = launchBot(process.env.BOT_TOKEN)

export const startVercel = async (req, res) => {
    await production(req, res, bot);
};

// if (process.env.NODE_ENV === 'development') {
//     development(bot);
// } else {
//     startVercel();
// }
// startVercel()
// launchApp() 