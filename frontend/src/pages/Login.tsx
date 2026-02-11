import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGamepad } from 'react-icons/fa';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

interface LoginForm {
    username: string;
    password: string;
}

const Login = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState<LoginForm>({
        username: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const { username, password } = form;

        if (!username || !password) {
            setError('Username and password are required');
            return;
        }

        try {
            setLoading(true);

            /* 1️⃣ Resolve username → email */
            const resolveRes = await axios.post('https://thunder-management.vercel.app//api/auth/resolve-username', {
                username
            });

            const email = resolveRes.data.email;

            /* 2️⃣ Firebase login with email */
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            if (!user.emailVerified) {
                setError('Please verify your email before logging in');
                return;
            }

            /* 3️⃣ Get ID token */
            const token = await user.getIdToken();

            /* 4️⃣ Get role */
            const meRes = await axios.get('https://thunder-management.vercel.app//api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const role = meRes.data.user.role;

            if (role === 'owner') {
                navigate('/owner');
            } else {
                navigate('/employee');
            }

        } catch (err: any) {
            console.error(err);

            if (err.response?.status === 404) {
                setError('Username not found');
            } else if (
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/user-not-found'
            ) {
                setError('Invalid username or password');
            } else {
                setError('Login failed. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card cyber-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <FaGamepad size={40} color="var(--accent-yellow)" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Login to access your dashboard</p>
                </div>

                <form className="auth-form" onSubmit={handleLogin}>
                    {error && <p className="error-text">{error}</p>}

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary full-width-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/signup" className="link-text">
                            Sign Up
                        </Link>
                    </p>
                </div> */}
            </div>
            <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: radial-gradient(circle at 50% 50%, #1a3c5e 0%, var(--bg-dark) 70%);
          padding: 1rem;
        }

        .auth-card {
          width: 100%;
          max-width: 450px;
          padding: 2.5rem;
          background: rgba(15, 22, 35, 0.8);
          backdrop-filter: blur(10px);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          background: rgba(251, 191, 36, 0.1);
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
        }

        .auth-header h2 {
          font-family: var(--font-display);
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group label {
          display: block;
          color: var(--text-secondary);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .full-width-btn {
          width: 100%;
          margin-top: 1rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .link-text {
          color: var(--accent-yellow);
          text-decoration: none;
          font-weight: 500;
        }
        .link-text.sm {
          font-size: 0.85rem;
        }
        .link-text:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
};

export default Login;
