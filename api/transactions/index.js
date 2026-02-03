import crypto from 'crypto';
import webpush from 'web-push';
import { query } from '../_lib/db.js';

// Initialize VAPID for push notifications
const isPushEnabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (isPushEnabled) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@savvy.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
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

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET /api/transactions?userId=xxx
    if (req.method === 'GET') {
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
    }

    // POST /api/transactions
    if (req.method === 'POST') {
        const { userId, contributorName, amount, type, note, date } = req.body || {};

        if (!userId || !contributorName || !amount || !type) {
            return res.status(400).send('Data transaksi tidak lengkap');
        }

        if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) {
            return res.status(400).send('Tipe transaksi tidak valid');
        }

        try {
            const id = crypto.randomUUID();
            const transactionDate = date ? new Date(date) : new Date();
            if (Number.isNaN(transactionDate.getTime())) {
                return res.status(400).send('Tanggal transaksi tidak valid');
            }

            await query(
                `INSERT INTO transactions (id, user_id, contributor_name, amount, type, date, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, contributorName, amount, type, transactionDate, note || null]
            );

            const responsePayload = {
                id,
                userId,
                contributorName,
                amount,
                type,
                date: transactionDate.toISOString(),
                note: note || ''
            };

            // Send push notifications to all users except the creator
            await sendPushToAll(
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
    }

    return res.status(405).send('Method not allowed');
}
