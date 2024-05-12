import cors from 'cors';
import express from 'express';

const PORT = 3000
const MESSAGE_PATH = "/api"

function launchApi() {
    // Setup HTTP api
    const api = express()
    api.use(express.json())
    api.use(cors())

    // Listen to server start on port
    api.listen(PORT, () => console.log(`express is up on port ${PORT}`))

    return api
}

export { PORT, MESSAGE_PATH, launchApi }