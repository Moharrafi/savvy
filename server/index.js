import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import webpush from 'web-push';
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

const isPushEnabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (isPushEnabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@savvy.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys missing. Push notifications are disabled.');
}

const sendPushToAll = async (payload, excludeUserId = null) => {
  if (!isPushEnabled) return;
  try {
    const [rows] = await query(
      'SELECT id, user_id AS userId, endpoint, p256dh, auth FROM push_subscriptions'
    );

    await Promise.all(
      rows.map(async (sub) => {
        if (excludeUserId && sub.userId === excludeUserId) return;
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify(payload)
          );
        } catch (error) {
          const statusCode = error?.statusCode || error?.status;
          if (statusCode === 404 || statusCode === 410) {
            await query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
          } else {
            console.error('Push send error', error);
          }
        }
      })
    );
  } catch (error) {
    console.error('Push dispatch error', error);
  }
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

app.post('/api/auth/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body || {};

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).send('Data tidak lengkap');
  }

  if (newPassword.length < 6) {
    return res.status(400).send('Password baru minimal 6 karakter');
  }

  try {
    const [rows] = await query(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).send('User tidak ditemukan');
    }

    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).send('Password sekarang salah');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({ ok: true });
  } catch (error) {
    console.error('Change password error', error);
    return res.status(500).send('Gagal mengganti password');
  }
});

app.post('/api/push/subscribe', async (req, res) => {
  const { userId, subscription } = req.body || {};
  if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).send('Data subscription tidak lengkap');
  }

  try {
    const { endpoint, keys } = subscription;
    const [existing] = await query('SELECT id FROM push_subscriptions WHERE endpoint = ? LIMIT 1', [endpoint]);
    if (existing.length > 0) {
      await query(
        'UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE endpoint = ?',
        [userId, keys.p256dh, keys.auth, endpoint]
      );
    } else {
      await query(
        'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
        [userId, endpoint, keys.p256dh, keys.auth]
      );
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error('Subscribe error', error);
    return res.status(500).send('Gagal menyimpan subscription');
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
    sendPushToAll(
      {
        title: type === 'DEPOSIT' ? 'Tabungan Masuk' : 'Penarikan Dana',
        body: `${contributorName} ${type === 'DEPOSIT' ? 'menabung' : 'menarik'} Rp ${Number(amount).toLocaleString('id-ID')}`,
        data: { type, userId }
      },
      userId
    );

    return res.json(responsePayload);
  } catch (error) {
    console.error('Create transaction error', error);
    return res.status(500).send('Gagal menyimpan transaksi');
  }
});

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
