import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '@mui/material';
import { login } from '../services/authService';
import logo from '../assets/ftr_logo.jpeg';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
    navigate('/');
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
