import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { query } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const broadcast = (payload) => {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
  const { name, username, password } = req.body || {};

  if (!name || !username || !password) {
    return res.status(400).send('Data registrasi tidak lengkap');
  }

  try {
    const [existing] = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).send('Username sudah digunakan');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (id, name, username, password_hash) VALUES (?, ?, ?, ?)',
      [id, name, username, passwordHash]
    );

    return res.json({ id, name, username });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).send('Gagal mendaftar');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).send('Username atau password kosong');
  }

  try {
    const [rows] = await query(
      'SELECT id, name, username, password_hash FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).send('Username atau password salah');
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).send('Username atau password salah');
    }

    return res.json({ id: user.id, name: user.name, username: user.username });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).send('Gagal login');
  }
});

app.get('/api/transactions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).send('userId wajib');
  }

  try {
    const [rows] = await query(
      `SELECT id, user_id AS userId, contributor_name AS contributorName, amount, type, date, note
       FROM transactions
       WHERE user_id = ?
       ORDER BY date DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Fetch transactions error', error);
    return res.status(500).send('Gagal mengambil transaksi');
  }
});

app.get('/api/transactions/all', async (_req, res) => {
  try {
    const [rows] = await query(
      `SELECT id, user_id AS userId, contributor_name AS contributorName, amount, type, date, note
       FROM transactions
       ORDER BY date DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('Fetch global transactions error', error);
    return res.status(500).send('Gagal mengambil transaksi');
  }
});

app.post('/api/transactions', async (req, res) => {
  const { userId, contributorName, amount, type, note } = req.body || {};

  if (!userId || !contributorName || !amount || !type) {
    return res.status(400).send('Data transaksi tidak lengkap');
  }

  if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) {
    return res.status(400).send('Tipe transaksi tidak valid');
  }

  try {
    const id = crypto.randomUUID();
    const date = new Date();

    await query(
      `INSERT INTO transactions (id, user_id, contributor_name, amount, type, date, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, contributorName, amount, type, date, note || null]
    );

    const responsePayload = {
      id,
      userId,
      contributorName,
      amount,
      type,
      date: date.toISOString(),
      note: note || ''
    };

    broadcast({ type: 'transaction', data: responsePayload });

    return res.json(responsePayload);
  } catch (error) {
    console.error('Create transaction error', error);
    return res.status(500).send('Gagal menyimpan transaksi');
  }
});

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
