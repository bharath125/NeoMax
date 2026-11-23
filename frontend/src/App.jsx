import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import { Landing } from './pages/Landing.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Generate } from './pages/Generate.jsx';
import { Images } from './pages/Images.jsx';
import { Library } from './pages/Library.jsx';
import { Scene } from './pages/Scene.jsx';
import { Billing } from './pages/Billing.jsx';

export default function App() {
	const { token } = useAuth();

	return (
		<Routes>
			<Route path="/" element={token ? <Navigate to="/generate" replace /> : <Landing />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route
				element={
					<ProtectedRoute>
						<AppLayout />
					</ProtectedRoute>
				}
			>
				<Route path="/generate" element={<Generate />} />
				<Route path="/images" element={<Images />} />
				<Route path="/library" element={<Library />} />
				<Route path="/library/:sceneId" element={<Scene />} />
				<Route path="/billing" element={<Billing />} />
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
