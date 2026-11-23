import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		// Absent for accounts created via Google sign-in.
		passwordHash: { type: String },
		googleId: { type: String, unique: true, sparse: true },
		credits: { type: Number, default: 50 },
		role: { type: String, enum: ['user', 'admin'], default: 'user' },
	},
	{ timestamps: true },
);

export const User = mongoose.model('User', userSchema);
