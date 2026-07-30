import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Register() {
	const { register } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSubmitting(true);
		try {
			await register(email, password);
			navigate('/generate');
		} catch (err) {
			setError(err.response?.data?.error?.message || 'Registration failed');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="max-w-sm mx-auto mt-24 flex flex-col gap-4">
			<h1 className="text-2xl font-semibold">Create your ViewMax account</h1>
			<form onSubmit={handleSubmit} className="flex flex-col gap-3">
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="border rounded-md px-3 py-2"
					required
				/>
				<input
					type="password"
					placeholder="Password (min 8 characters)"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="border rounded-md px-3 py-2"
					required
					minLength={8}
				/>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button
					type="submit"
					disabled={submitting}
					className="bg-black text-white rounded-md py-2 disabled:opacity-50"
				>
					{submitting ? 'Creating…' : 'Create account'}
				</button>
			</form>
			<p className="text-sm text-gray-600">
				Already have an account? <Link to="/login" className="underline">Log in</Link>
			</p>
		</div>
	);
}
