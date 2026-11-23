import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		provider: { type: String, required: true },
		providerOrderId: { type: String, required: true, unique: true },
		providerPaymentId: { type: String },

		packageKey: { type: String, required: true },
		credits: { type: Number, required: true },
		// Smallest currency unit (paise / cents), snapshotted at order time so later price changes don't affect it.
		amount: { type: Number, required: true },
		currency: { type: String, required: true },

		status: { type: String, enum: ['created', 'paid'], default: 'created', index: true },
		paidAt: { type: Date },
		// Guards against granting credits twice when the checkout callback and the webhook race or retry.
		creditsGranted: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

export const Payment = mongoose.model('Payment', paymentSchema);
