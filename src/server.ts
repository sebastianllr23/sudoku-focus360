import express from 'express';
import cors from 'cors';
import path from 'path';
import { validateCube, solveCube, rotateFace, CubeState, FACE_NAMES } from './sudokube';

import fs from 'fs';
import { promises as fsPromises } from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// History store (JSON file persistence - BONUS)
const HISTORY_FILE = path.join(__dirname, '../history.json');

interface HistoryEntry {
  timestamp: string;
  action: string;
  payload: any;
  result: any;
}

// Initialize history file if it doesn't exist
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await fsPromises.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function addToHistory(action: string, payload: any, result: any) {
  try {
    const history = await getHistory();
    history.push({
      timestamp: new Date().toISOString(),
      action,
      payload,
      result
    });
    // Keep only the last 50 entries
    if (history.length > 50) {
      history.shift();
    }
    await fsPromises.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving history to file', err);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Validate Cube
app.post('/api/sudokube/validate', (req, res) => {
  try {
    const cube: CubeState = req.body;
    if (!cube || !cube.faces) {
      return res.status(400).json({ error: 'Invalid payload: missing faces object.' });
    }
    const result = validateCube(cube);
    addToHistory('validate', cube, result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Solve Cube
app.post('/api/sudokube/solve', (req, res) => {
  try {
    const cube: CubeState = req.body;
    if (!cube || !cube.faces) {
      return res.status(400).json({ error: 'Invalid payload: missing faces object.' });
    }
    const result = solveCube(cube);
    addToHistory('solve', cube, result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Rotate Face
app.post('/api/sudokube/rotate', (req, res) => {
  try {
    const { face, direction, state } = req.body;
    
    if (!face || !FACE_NAMES.includes(face)) {
      return res.status(400).json({ error: `Invalid or missing face. Must be one of ${FACE_NAMES.join(', ')}.` });
    }
    if (direction !== 'clockwise' && direction !== 'counterclockwise') {
      return res.status(400).json({ error: 'Direction must be "clockwise" or "counterclockwise".' });
    }
    if (!state || !state.faces || !state.faces[face]) {
      return res.status(400).json({ error: 'Invalid state provided or missing face data.' });
    }

    const faceData = state.faces[face];
    const rotatedFace = rotateFace(faceData, direction);
    
    // Construct the new state to return
    const newState = {
      ...state,
      faces: {
        ...state.faces,
        [face]: rotatedFace
      }
    };

    addToHistory('rotate', { face, direction }, { success: true });
    res.status(200).json({ rotated: rotatedFace, newState });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// History endpoint
app.get('/api/sudokube/history', async (req, res) => {
  const history = await getHistory();
  res.status(200).json({ history });
});

app.listen(PORT, () => {
  console.log(`Sudoku-Cubo API is running on http://localhost:${PORT}`);
});
