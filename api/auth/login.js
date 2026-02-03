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

        return res.json({
            id: user.id,
            name: user.name,
            username: user.username
        });
    } catch (error) {
        console.error('Login error', error);
        return res.status(500).send('Gagal login');
    }
}
