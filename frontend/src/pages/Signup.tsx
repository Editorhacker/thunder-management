import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGamepad } from 'react-icons/fa';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,

} from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios, { AxiosError } from 'axios';

/* ---------------------------------------
   Types
--------------------------------------- */
type Role = 'employee' | 'owner';

interface SignupForm {
    name: string;
    email: string;
    username: string;
    password: string;
}

interface ApiErrorResponse {
    message: string;
}

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState<SignupForm>({
        name: '',
        email: '',
        username: '',
        password: ''
    });

    const [role, setRole] = useState<Role>('employee');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    /* ---------------------------------------
       Handlers
    --------------------------------------- */
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { name, email, username, password } = form;

        if (!name || !email || !username || !password) {
            setError('All fields are required');
            return;
        }

        let firebaseUser = null;

        try {
            setLoading(true);

            /* 1️⃣ Create Firebase Auth user */
            const userCredential: UserCredential =
                await createUserWithEmailAndPassword(auth, email, password);

            firebaseUser = userCredential.user;

            /* 2️⃣ Send verification email */
            await sendEmailVerification(userCredential.user);

            /* 3️⃣ Save profile via backend */
            await axios.post('https://thunder-management.vercel.app//api/auth/signup', {
                uid: userCredential.user.uid,
                name,
                email,
                username,
                role,
                password
            });

            setSuccess(
                'Account created successfully. Please verify your email before login.'
            );

            setTimeout(() => navigate('/login'), 2500);

        } catch (err: unknown) {
            console.error(err);

            /* 🔥 ROLLBACK Firebase user if backend failed */
            if (firebaseUser) {
                try {
                    await firebaseUser.delete();
                    console.warn('Rolled back Firebase Auth user');
                } catch (deleteError) {
                    console.error('Failed to rollback Firebase user', deleteError);
                }
            }

            /* Firebase Errors */
            if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                (err as { code: string }).code === 'auth/email-already-in-use'
            ) {
                setError('Email already in use');
                return;
            }

            /* Backend Errors */
            const axiosError = err as AxiosError<ApiErrorResponse>;
            if (axiosError.response?.data?.message) {
                setError(axiosError.response.data.message);
                return;
            }

            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------------
       JSX
    --------------------------------------- */
    return (
        <div className="auth-container">
            <div className="auth-card cyber-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <FaGamepad size={40} color="var(--accent-yellow)" />
                    </div>
                    <h2>Join the Squad</h2>
                    <p>Create account for Thunder Gaming Cafe</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="error-text">{error}</p>}
                    {success && <p className="success-text">{success}</p>}

                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="johndoe123"
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
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${role === 'employee' ? 'active' : ''}`}
                                onClick={() => setRole('employee')}
                            >
                                Employee
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${role === 'owner' ? 'active' : ''}`}
                                onClick={() => setRole('owner')}
                            >
                                Owner
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary full-width-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="link-text">
                            Login
                        </Link>
                    </p>
                </div>
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

        .role-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }

        .role-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 0.75rem;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .role-btn.active {
          background: var(--primary-blue);
          color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
        .link-text:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
};

export default Signup;



