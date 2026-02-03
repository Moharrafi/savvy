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
}
