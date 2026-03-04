import { useState } from 'react';
import API from '../config/api.js';
import { set, KEYS } from '../config/storage.js';
import './LoginForm.css';

export default function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;

      await set(KEYS.ACCESS_TOKEN, token);
      if (refreshToken) {
        await set(KEYS.REFRESH_TOKEN, refreshToken);
      }
      await set(KEYS.USER, user);

      onSuccess(user);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <p className="login-prompt">Sign in to your ShelfQuest account</p>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
