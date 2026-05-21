import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '@mui/material';
import { login, verifyAdminSession } from '../services/authService';
import { authStorage } from '../services/authStorage';
import logo from '../assets/ftr_logo.jpeg';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const bootstrap = async () => {
            if (!authStorage.getAccessToken() && !authStorage.getRefreshToken()) {
                return;
            }

            try {
                const session = await verifyAdminSession();
                if (mounted && session?.is_admin) {
                    navigate('/', { replace: true });
                }
            } catch {
                // ignore and stay on login
            }
        };

        bootstrap();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-sigil px-6">
            <div className="app-card w-full max-w-md p-8">
                <div className="mb-8 text-center">
                    <img src={logo} alt="Feed the Realm" className="mx-auto h-14 w-14 rounded-full border border-[rgba(245,180,74,0.5)]" />
                    <h1 className="app-title mt-4 text-3xl">Admin Gate</h1>
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">Enter the realm administration console.</p>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {error && <div className="rounded-lg border border-red-500 bg-red-900/20 p-3 text-sm text-red-400">{error}</div>}
                    <TextField
                        label="Email"
                        variant="outlined"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in...' : 'Login'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default Login;
