import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

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
}
