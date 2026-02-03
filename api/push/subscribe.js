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
}
