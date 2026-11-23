import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { GoogleButton } from '../components/GoogleButton.jsx';
import { Spinner } from '../components/Icon.jsx';
import { apiErrorMessage } from '../lib/jobs.js';

export function Register() {
	const { token, register, loginWithGoogle } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	if (token) return <Navigate to="/generate" replace />;

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSubmitting(true);
		try {
			await register(email, password);
			navigate('/generate');
		} catch (err) {
			setError(apiErrorMessage(err, 'Could not create your account. Please try again.'));
		} finally {
			setSubmitting(false);
		}
	}

	async function handleGoogle(credential) {
		setError('');
		try {
			await loginWithGoogle(credential);
			navigate('/generate');
		} catch (err) {
			setError(apiErrorMessage(err, 'Google sign-in failed. Please try again.'));
		}
	}

	return (
		<AuthLayout
			title="Create your account"
			subtitle="Start with free credits — no card needed."
			footer={
				<>
					Already have an account?{' '}
					<Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
						Log in
					</Link>
				</>
			}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="email" className="label">
						Email
					</label>
					<input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						placeholder="you@example.com"
						required
						className="input"
					/>
				</div>
				<PasswordField
					id="password"
					label="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="new-password"
					minLength={8}
					hint="At least 8 characters."
				/>
				{error && (
					<p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
						{error}
					</p>
				)}
				<button type="submit" disabled={submitting} className="btn-primary w-full">
					{submitting && <Spinner className="h-4 w-4" />}
					{submitting ? 'Creating account…' : 'Create account'}
				</button>
			</form>
			<GoogleButton onCredential={handleGoogle} onError={setError} />
		</AuthLayout>
	);
}
