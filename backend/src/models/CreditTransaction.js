import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		amount: { type: Number, required: true },
		type: { type: String, enum: ['topup', 'reserve', 'refund'], required: true },
		job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
	},
	{ timestamps: true },
);

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
