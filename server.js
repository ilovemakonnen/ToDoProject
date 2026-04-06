require('dotenv').config();
const express = require('express');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const DB_PATH = './db.json';

// загрузка БД
async function loadDB() {
  return await fs.readJson(DB_PATH);
}

// сохранение БД
async function saveDB(data) {
  return await fs.writeJson(DB_PATH, data, { spaces: 2 });
}

// middleware авторизации
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Нет токена" });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Неверный токен" });
  }
}

//
// РЕГИСТРАЦИЯ
//
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Введите логин и пароль" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Пароль должен быть минимум 6 символов" });
  }

  const db = await loadDB();

  const exists = db.users.find(u => u.username === username);

  if (exists) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.users.push({
    username,
    password: hashedPassword
  });

  await saveDB(db);

  return res.json({ message: "Регистрация успешна" });
});

//
// ЛОГИН
//
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const db = await loadDB();

  const user = db.users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ error: "Пользователь не найден" });
  }

  const valid = bcrypt.compareSync(password, user.password);

  if (!valid) {
    return res.status(400).json({ error: "Неверный пароль" });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return res.json({ token });
});

//
// ПОЛУЧЕНИЕ ЗАДАЧ
//
app.get('/tasks', auth, async (req, res) => {
  const db = await loadDB();

  const tasks = db.tasks.filter(
    t => t.username === req.user.username
  );

  return res.json(tasks);
});

//
// ДОБАВЛЕНИЕ ЗАДАЧИ
//
app.post('/tasks', auth, async (req, res) => {
  const { text, priority } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Пустая задача" });
  }

  const db = await loadDB();

  const task = {
    id: Date.now(),
    username: req.user.username,
    text,
    priority: priority || "low"
  };

  db.tasks.push(task);

  await saveDB(db);

  return res.json(task);
});

//
// УДАЛЕНИЕ ЗАДАЧИ
//
app.delete('/tasks/:id', auth, async (req, res) => {
  const db = await loadDB();

  db.tasks = db.tasks.filter(
    t => t.id != req.params.id
  );

  await saveDB(db);

  return res.json({ message: "Удалено" });
});

//
// СТАРТ СЕРВЕРА
//
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});