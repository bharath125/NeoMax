import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Generate } from './pages/Generate.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Billing } from './pages/Billing.jsx';

function NavBar() {
	const { token, logout } = useAuth();
	return (
		<nav className="border-b px-6 py-3 flex items-center justify-between">
			<Link to="/generate" className="font-semibold">ViewMax</Link>
			<div className="flex items-center gap-4 text-sm">
				<Link to="/generate">Generate</Link>
				<Link to="/dashboard">Dashboard</Link>
				<Link to="/billing">Billing</Link>
				{token && (
					<button onClick={logout} className="text-gray-500">
						Log out
					</button>
				)}
			</div>
		</nav>
	);
}

export default function App() {
	return (
		<div>
			<NavBar />
			<Routes>
				<Route path="/" element={<Navigate to="/generate" replace />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/generate"
					element={
						<ProtectedRoute>
							<Generate />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/billing"
					element={
						<ProtectedRoute>
							<Billing />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</div>
	);
}
