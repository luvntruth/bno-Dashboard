import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './config.js';
import * as StateController from './stateController.js';

// Initialize App
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
let ai = null;
if (CONFIG.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
  console.log('Gemini proxy initialized');
} else {
  console.warn('GEMINI_API_KEY not set. The /api/gemini endpoint will return 500.');
}

// Load initial state
StateController.loadState();

// --- Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', gemini: !!ai });
});

app.get('/demo', (req, res) => {
  res.sendFile(CONFIG.DEMO_FILE);
});

// SSE Endpoint
app.get('/api/events', (req, res) => {
  const cleanup = StateController.addClient(res);
  req.on('close', cleanup);
});

// State Endpoints
app.get('/api/state', (req, res) => {
  res.json(StateController.getState());
});

app.post('/api/state', (req, res) => {
  StateController.updateState(req.body || {});
  res.json({ ok: true });
});

// Gemini Endpoint
app.post('/api/gemini', async (req, res) => {
  const { programName } = req.body || {};

  if (!programName) {
    return res.status(400).json({ error: 'programName is required' });
  }

  if (!ai) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Updated model name if needed, or keep as 'gemini-1.5-flash'
      contents: `당신은 BnO 컴퍼니의 시니어 운영 매니저입니다. 신입 인턴에게 '${programName}' 프로그램의 원활한 퍼실리테이션(진행)을 위한 팁을 3줄 내외로 조언해주세요. 말투는 친절하고 전문적인 사수 느낌으로 한국어로 조언해주세요.`,
    });

    const text = response?.text ? response.text : '';

    if (!text) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    return res.json({ text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'Gemini request failed', detail: err.message });
  }
});

// Start Server
app.listen(CONFIG.PORT, () => {
  console.log(`Gemini proxy server listening on http://localhost:${CONFIG.PORT}`);
});
