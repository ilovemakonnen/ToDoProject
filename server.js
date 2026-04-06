require('dotenv').config();

const express = require('express');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './db.json';

async function loadDB() {
  try {
    return await fs.readJson(DB_PATH);
  } catch {
    return { users: [], tasks: [] };
  }
}


async function saveDB(data) {
  await fs.writeJson(DB_PATH, data, { spaces: 2 });
}


function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send('No token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
}


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.status(400).send('Invalid data');
  }

  const db = await loadDB();

  const exists = db.users.find(u => u.username === username);
  if (exists) {
    return res.status(400).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.users.push({
    username,
    password: hashedPassword
  });

  await saveDB(db);

  res.send('User created');
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const db = await loadDB();

  const user = db.users.find(u => u.username === username);

  if (!user) {
    return res.status(400).send('User not found');
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).send('Wrong password');
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});


app.get('/tasks', auth, async (req, res) => {
  const db = await loadDB();

  const tasks = db.tasks.filter(
    t => t.username === req.user.username
  );

  res.json(tasks);
});


app.post('/tasks', auth, async (req, res) => {
  const { text, priority } = req.body;

  if (!text) {
    return res.status(400).send('Empty task');
  }

  const db = await loadDB();

  const newTask = {
    id: Date.now(),
    username: req.user.username,
    text,
    priority: priority || 'low'
  };

  db.tasks.push(newTask);

  await saveDB(db);

  res.json(newTask);
});


app.delete('/tasks/:id', auth, async (req, res) => {
  const db = await loadDB();

  db.tasks = db.tasks.filter(
    t => t.id != req.params.id
  );

  await saveDB(db);

  res.send('Deleted');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});