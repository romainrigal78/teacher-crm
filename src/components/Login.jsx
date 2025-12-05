import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Logo from './Logo';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: '', message: '' }), 5000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            // Successful login will be handled by App.jsx auth state listener
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;
            showAlert('success', 'Check your email for the password reset link!');
            setIsForgotPassword(false);
        } catch (error) {
            showAlert('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
            </div>

            {/* Alert Banner */}
            {alert.message && (
                <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${alert.type === 'error'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                    {alert.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-medium">{alert.message}</span>
                </div>
            )}

            {/* Login Card */}
            <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <Logo className="mb-6 scale-110" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-400 text-sm mt-2 text-center">
                        {isForgotPassword
                            ? 'Enter your email to receive a reset link'
                            : 'Sign in to manage your classes and students'}
                    </p>
                </div>

                <form onSubmit={isForgotPassword ? handleResetPassword : handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-950/50 border border-gray-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                required
                            />
                        </div>

                        {!isForgotPassword && (
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-950/50 border border-gray-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {!isForgotPassword && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isForgotPassword ? 'Send Reset Link' : 'Sign In'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {isForgotPassword && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsForgotPassword(false)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
