require('dotenv').config();
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database setup ----------
const db = new Database(path.join(__dirname, 'todos.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API routes ----------

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC, id DESC').all();
  res.json(todos);
});

// Create a todo
app.post('/api/todos', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const stmt = db.prepare('INSERT INTO todos (title) VALUES (?)');
  const info = stmt.run(title.trim());
  const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid);

  res.status(201).json(newTodo);
});

// Update a todo (title and/or completed)
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const title = req.body.title !== undefined ? req.body.title : existing.title;
  const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : existing.completed;

  db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?').run(title, completed, id);
  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);

  res.json(updated);
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM todos WHERE id = ?').run(id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.status(204).send();
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});