import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');
const envPath = path.join(__dirname, '..', '.env');

// Parse .env manually
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'MY_GEMINI_API_KEY';
try {
  const envContent = await fs.readFile(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
  if (match && match[1]) {
    GEMINI_API_KEY = match[1].trim();
  }
} catch (e) {
  console.log('No parent .env found or error parsing: ', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Config Route
app.get('/api/config', (req, res) => {
  res.json({ GEMINI_API_KEY });
});

// Helper function to read/write JSON Database
async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, return default structure
    const defaultStructure = {
      users: {
        id: 1,
        name: '',
        age: 25,
        height: 170.0,
        weight: 70.0,
        targetWeight: 65.0,
        activityLevel: 'Moderate',
        goal: 'Lose Weight',
        healthConditions: '',
        preferredLanguage: 'EN',
        dailyCalorieTarget: 2000,
        isLoggedIn: false,
        dietPreference: 'Balanced',
        isDarkMode: false
      },
      meals: [],
      weight_records: [],
      water_logs: {} // dateStr -> liters (Float)
    };
    await writeDb(defaultStructure);
    return defaultStructure;
  }
}

async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// User Routes
app.get('/api/user', async (req, res) => {
  try {
    const db = await readDb();
    res.json({
      ...db.users,
      isLoggedIn: !!db.users.isLoggedIn
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const db = await readDb();
    const {
      name, age, height, weight, targetWeight,
      activityLevel, goal, healthConditions,
      preferredLanguage, dailyCalorieTarget, isLoggedIn,
      dietPreference, isDarkMode
    } = req.body;

    db.users = {
      id: 1,
      name: name ?? db.users.name,
      age: age ?? db.users.age,
      height: height ?? db.users.height,
      weight: weight ?? db.users.weight,
      targetWeight: targetWeight ?? db.users.targetWeight,
      activityLevel: activityLevel ?? db.users.activityLevel,
      goal: goal ?? db.users.goal,
      healthConditions: healthConditions ?? db.users.healthConditions,
      preferredLanguage: preferredLanguage ?? db.users.preferredLanguage,
      dailyCalorieTarget: dailyCalorieTarget ?? db.users.dailyCalorieTarget,
      isLoggedIn: isLoggedIn !== undefined ? !!isLoggedIn : db.users.isLoggedIn,
      dietPreference: dietPreference ?? db.users.dietPreference,
      isDarkMode: isDarkMode !== undefined ? !!isDarkMode : db.users.isDarkMode
    };

    await writeDb(db);
    res.json({
      ...db.users,
      isLoggedIn: !!db.users.isLoggedIn
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meals Routes
app.get('/api/meals', async (req, res) => {
  try {
    const db = await readDb();
    // Sort descending by timestamp
    const meals = [...db.meals].sort((a, b) => b.timestamp - a.timestamp);
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const db = await readDb();
    const { name, emoji, calories, protein, carbs, fat, mealType, healthScore, timestamp } = req.body;
    
    // Generate new incremental ID
    const nextId = db.meals.length > 0 ? Math.max(...db.meals.map(m => m.id)) + 1 : 1;
    
    const newMeal = {
      id: nextId,
      name: name || '',
      emoji: emoji || '🍽️',
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      mealType: mealType || 'Snack',
      healthScore: healthScore ?? 7,
      timestamp: timestamp ?? Date.now()
    };

    db.meals.push(newMeal);
    await writeDb(db);
    res.status(201).json(newMeal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meals/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = parseInt(req.params.id);
    db.meals = db.meals.filter(m => m.id !== id);
    await writeDb(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Weight Records Routes
app.get('/api/weight_records', async (req, res) => {
  try {
    const db = await readDb();
    const records = [...db.weight_records].sort((a, b) => b.timestamp - a.timestamp);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/weight_records', async (req, res) => {
  try {
    const db = await readDb();
    const { weight, timestamp } = req.body;
    
    const nextId = db.weight_records.length > 0 ? Math.max(...db.weight_records.map(r => r.id)) + 1 : 1;
    
    const newRecord = {
      id: nextId,
      weight: parseFloat(weight) || 0.0,
      timestamp: timestamp ?? Date.now()
    };

    db.weight_records.push(newRecord);
    await writeDb(db);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/weight_records/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = parseInt(req.params.id);
    db.weight_records = db.weight_records.filter(r => r.id !== id);
    await writeDb(db);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Water Logs Routes
app.get('/api/water_logs/:dateStr', async (req, res) => {
  try {
    const db = await readDb();
    const dateStr = req.params.dateStr;
    const liters = db.water_logs[dateStr] ?? 0.0;
    res.json({ dateStr, liters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/water_logs', async (req, res) => {
  try {
    const db = await readDb();
    const { dateStr, liters } = req.body;
    db.water_logs[dateStr] = parseFloat(liters) || 0.0;
    await writeDb(db);
    res.json({ dateStr, liters: db.water_logs[dateStr] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
