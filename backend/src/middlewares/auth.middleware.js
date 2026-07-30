import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
	try {
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : null;
		if (!token) return res.status(401).json({ success: false, error: { message: 'Missing token' } });

		const payload = jwt.verify(token, config.jwtSecret);
		const user = await User.findById(payload.sub).select('_id email credits role');
		if (!user) return res.status(401).json({ success: false, error: { message: 'Invalid token' } });

		req.user = user;
		next();
	} catch (err) {
		res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
	}
}
