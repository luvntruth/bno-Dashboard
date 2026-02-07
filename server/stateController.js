import fs from 'fs';
import { CONFIG } from './config.js';

// In-memory shared state
let sharedState = {
    schedule: null,
    completedTasks: [],
    weeklyComments: {},
    userName: '',
    lastUpdated: 0,
};

// SSE Clients set
const sseClients = new Set();

// Ensure date is numeric
const ensureNumericTimestamp = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : Date.now();
};

// Load state from disk
export const loadState = () => {
    try {
        if (fs.existsSync(CONFIG.STATE_FILE)) {
            const raw = fs.readFileSync(CONFIG.STATE_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                parsed.lastUpdated = ensureNumericTimestamp(parsed.lastUpdated);
                sharedState = { ...sharedState, ...parsed };
                console.log('Loaded persisted shared state from', CONFIG.STATE_FILE);
            }
        }
    } catch (err) {
        console.warn('Failed to load persisted state:', err.message);
    }
};

// Save state to disk
const saveState = () => {
    try {
        fs.writeFile(CONFIG.STATE_FILE, JSON.stringify(sharedState, null, 2), (err) => {
            if (err) console.warn('Failed to persist shared state:', err.message);
        });
    } catch (e) {
        console.warn('Failed to persist shared state (sync):', e.message);
    }
};

// Broadcast to SSE clients
const broadcast = () => {
    const data = `data: ${JSON.stringify(sharedState)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(data);
        } catch (e) {
            console.error('SSE Broadcast error:', e);
            sseClients.delete(client);
        }
    }
};

export const getState = () => sharedState;

export const updateState = (payload) => {
    sharedState = {
        schedule: payload.schedule ?? sharedState.schedule,
        completedTasks: payload.completedTasks ?? sharedState.completedTasks,
        weeklyComments: payload.weeklyComments ?? sharedState.weeklyComments,
        userName: payload.userName ?? sharedState.userName,
        lastUpdated: ensureNumericTimestamp(payload.lastUpdated),
    };

    broadcast();
    saveState();
    return sharedState;
};

export const addClient = (res) => {
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
    });

    // Send initial data
    res.write(`data: ${JSON.stringify(sharedState)}\n\n`);
    sseClients.add(res);

    // Remove client on close
    return () => sseClients.delete(res);
};
