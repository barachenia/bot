import e from "cors";
import { launchApi, MESSAGE_PATH } from "../http/index.js";
import { startVercel } from "../index.js";
import fetch from "node-fetch";

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

function launchApp() {
    // const bot = launchBot(process.env.BOT_TOKEN)
    console.log('launchApp')

    const api = launchApi()
    // Listen to post requests on messages endpoint
    api.post(MESSAGE_PATH, async (request, response) => {
        await handle(request, response)
    })
}

async function handle(req, res) {
    try {
        console.log('startVercel')
        await startVercel(req, res);
    } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Server Error</h1><p>Sorry, there was a problem</p>');
        console.error(e.message);
    }
}

export { handle, launchApp }