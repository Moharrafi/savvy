import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

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
}
