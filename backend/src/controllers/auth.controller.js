import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

const credentialsSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(8).required(),
});

const googleSchema = Joi.object({ credential: Joi.string().required() });

const googleClient = config.google.clientId ? new OAuth2Client(config.google.clientId) : null;

function signToken(user) {
	return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function register(req, res, next) {
	try {
		const { error, value } = credentialsSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const existing = await User.findOne({ email: value.email });
		if (existing) return res.status(409).json({ success: false, error: { message: 'Email already registered' } });

		const passwordHash = await bcrypt.hash(value.password, 10);
		const user = await User.create({ email: value.email, passwordHash });

		res.status(201).json({
			success: true,
			data: { token: signToken(user), user: { id: user._id, email: user.email, credits: user.credits } },
		});
	} catch (err) {
		next(err);
	}
}

export async function login(req, res, next) {
	try {
		const { error, value } = credentialsSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		const user = await User.findOne({ email: value.email });
		if (!user) return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });

		const valid = user.passwordHash ? await bcrypt.compare(value.password, user.passwordHash) : false;
		if (!valid) return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });

		res.json({
			success: true,
			data: { token: signToken(user), user: { id: user._id, email: user.email, credits: user.credits } },
		});
	} catch (err) {
		next(err);
	}
}

export async function me(req, res) {
	res.json({ success: true, data: { id: req.user._id, email: req.user.email, credits: req.user.credits } });
}

// Lets the frontend know whether to render the Google button, with a single source of truth for the client ID.
export function authConfig(req, res) {
	res.json({ success: true, data: { googleClientId: config.google.clientId || null } });
}

export async function googleLogin(req, res, next) {
	try {
		if (!googleClient) {
			return res.status(503).json({ success: false, error: { message: 'Google sign-in is not configured' } });
		}

		const { error, value } = googleSchema.validate(req.body);
		if (error) return res.status(400).json({ success: false, error: { message: error.message } });

		let payload;
		try {
			const ticket = await googleClient.verifyIdToken({ idToken: value.credential, audience: config.google.clientId });
			payload = ticket.getPayload();
		} catch {
			return res.status(401).json({ success: false, error: { message: 'Invalid Google credential' } });
		}
		if (!payload?.email || !payload.email_verified) {
			return res.status(401).json({ success: false, error: { message: 'Your Google email is not verified' } });
		}

		const email = payload.email.toLowerCase();
		let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
		if (!user) {
			user = await User.create({ email, googleId: payload.sub });
		} else if (!user.googleId) {
			// Same verified email as an existing password account — link it.
			user.googleId = payload.sub;
			await user.save();
		} else if (user.googleId !== payload.sub) {
			return res.status(401).json({ success: false, error: { message: 'Invalid Google credential' } });
		}

		res.json({
			success: true,
			data: { token: signToken(user), user: { id: user._id, email: user.email, credits: user.credits } },
		});
	} catch (err) {
		next(err);
	}
}
