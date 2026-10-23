// Course API: a small REST API for todos, stored in PostgreSQL.
// All configuration comes from environment variables (see .env.example).

// Load .env if there is one. Real deployments set the variables instead.
try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const express = require('express');
const { pool, ensureSchema, describeError } = require('./db');
const { validateTitle } = require('./validate');
const { version } = require('./package.json');

const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'course-api', version });
});

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/api/todos', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, done, created_at FROM todos ORDER BY id'
  );
  res.json(rows);
});

app.post('/api/todos', async (req, res) => {
  const error = validateTitle(req.body?.title);
  if (error) return res.status(400).json({ error });
  const { rows } = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done, created_at',
    [req.body.title.trim()]
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/todos/:id', async (req, res) => {
  const { title, done } = req.body;
  if (title !== undefined) {
    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
  }
  const { rows } = await pool.query(
    'UPDATE todos SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3 RETURNING id, title, done, created_at',
    [title !== undefined ? title.trim() : undefined, done, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'todo not found' });
  res.json(rows[0]);
});

app.delete('/api/todos/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'todo not found' });
  const { rows } = await pool.query(
    'DELETE FROM todos WHERE id = $1 RETURNING id, title, done, created_at',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'todo not found' });
  res.status(204).end();
});

async function start() {
  try {
    await ensureSchema();
    console.log('Database ready');
  } catch (err) {
    console.error('Database not reachable (' + describeError(err) + '). The API keeps running; /api/todos answers 500 until a database is available.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing the server');
    server.close(() => pool.end().then(() => process.exit(0)));
  });
}

start();
