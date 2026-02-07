import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const CONFIG = {
    PORT: process.env.PORT || 5174,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    STATE_FILE: path.join(process.cwd(), 'server', 'state.json'),
    DEMO_FILE: path.join(__dirname, 'demo.html'),
};
