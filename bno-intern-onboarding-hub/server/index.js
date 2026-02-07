import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5174;
const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  console.log('Gemini proxy initialized');
} else {
  console.warn('GEMINI_API_KEY not set. The /api/gemini endpoint will return 500.');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', gemini: !!ai });
});

// Serve demo page
app.get('/demo', (req, res) => {
  const demoPath = path.join(__dirname, 'demo.html');
  res.sendFile(demoPath);
});

// In-memory shared state for simple collaboration
let sharedState = {
  schedule: null,
  completedTasks: [],
  weeklyComments: {},
  userName: '',
  lastUpdated: 0,
};

// State file path
const STATE_FILE = path.join(process.cwd(), 'server', 'state.json');

// Load persisted state if exists
try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // ensure lastUpdated is numeric
      const maybeLast = Number(parsed.lastUpdated);
      if (!Number.isFinite(maybeLast)) parsed.lastUpdated = Date.now();
      else parsed.lastUpdated = maybeLast;
      sharedState = { ...sharedState, ...parsed };
      console.log('Loaded persisted shared state from', STATE_FILE);
    }
  }
} catch (err) {
  console.warn('Failed to load persisted state:', err && err.message ? err.message : err);
}

// SSE clients
const sseClients = new Set();

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });

  res.write(`data: ${JSON.stringify(sharedState)}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/state', (req, res) => {
  return res.json(sharedState);
});

app.post('/api/state', (req, res) => {
  const payload = req.body || {};
  // merge incoming state
  // normalize lastUpdated to a finite number
  const parsedLast = Number(payload.lastUpdated);
  sharedState = {
    schedule: payload.schedule ?? sharedState.schedule,
    completedTasks: payload.completedTasks ?? sharedState.completedTasks,
    weeklyComments: payload.weeklyComments ?? sharedState.weeklyComments,
    userName: payload.userName ?? sharedState.userName,
    lastUpdated: Number.isFinite(parsedLast) ? parsedLast : Date.now(),
  };

  // broadcast to SSE clients
  const data = `data: ${JSON.stringify(sharedState)}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch (e) { /* ignore */ }
  }
  // persist to disk (best-effort)
  try {
    fs.writeFile(STATE_FILE, JSON.stringify(sharedState, null, 2), (err) => {
      if (err) console.warn('Failed to persist shared state:', err && err.message ? err.message : err);
    });
  } catch (e) {
    console.warn('Failed to persist shared state (sync):', e && e.message ? e.message : e);
  }

  return res.json({ ok: true });
});

app.post('/api/gemini', async (req, res) => {
  const { programName } = req.body || {};
  if (!programName) return res.status(400).json({ error: 'programName is required' });
  if (!ai) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 BnO 컴퍼니의 시니어 운영 매니저입니다. 신입 인턴에게 '${programName}' 프로그램의 원활한 퍼실리테이션(진행)을 위한 팁을 3줄 내외로 조언해주세요. 말투는 친절하고 전문적인 사수 느낌으로 한국어로 조언해주세요.`,
    });

    const text = response && response.text ? response.text : '';
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' });
    return res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    const message = err && err.message ? err.message : String(err);
    return res.status(500).json({ error: 'Gemini request failed', detail: message });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy server listening on http://localhost:${PORT}`);
});
