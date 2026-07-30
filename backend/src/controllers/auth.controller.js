import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

const credentialsSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(8).required(),
});

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

		const valid = await bcrypt.compare(value.password, user.passwordHash);
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
