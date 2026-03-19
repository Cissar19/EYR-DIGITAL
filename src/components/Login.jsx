import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, School, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import logoEyr from '../assets/logo_eyr.png';

export default function Login() {
    const { login, resetPassword, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    // If already authenticated, redirect to dashboard
    if (user && !loading) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
            toast.success("Bienvenido!");
        } catch (error) {
            const msg = error.code === 'auth/invalid-credential'
                ? 'Credenciales invalidas'
                : error.code === 'auth/user-not-found'
                    ? 'Usuario no encontrado'
                    : error.code === 'auth/wrong-password'
                        ? 'Contrasena incorrecta'
                        : error.message;
            toast.error("Error: " + msg);
        } finally {
            setIsLoading(false);
        }
    };


    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) {
            toast.error('Ingresa tu correo electrónico');
            return;
        }
        setIsResetting(true);
        try {
            await resetPassword(resetEmail.trim());
            toast.success('Se envió un enlace de recuperación a tu correo');
            setShowForgotPassword(false);
            setResetEmail('');
        } catch (error) {
            const msg = error.code === 'auth/invalid-email'
                ? 'Correo electrónico inválido'
                : error.code === 'auth/too-many-requests'
                    ? 'Demasiados intentos. Intenta más tarde'
                    : 'Si el correo existe, recibirás un enlace de recuperación';
            toast.info(msg);
            setShowForgotPassword(false);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-white p-3 rounded-2xl shadow-lg mb-4">
                            <img
                                src={logoEyr}
                                alt="Centro Educacional Ernesto Yanez Rivera"
                                className="h-20 w-auto object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Bienvenido</h2>
                        <p className="text-indigo-200 text-sm">Escuela Ernesto Yañez Rivera Digital</p>
                        <p className="text-indigo-200 text-sm">Primera escuela digital</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-indigo-200" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-indigo-200/50 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
                                    placeholder="Correo Electronico"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-200" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-indigo-200/50 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
                                    placeholder="Contrasena"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    Ingresar <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Forgot Password Link */}
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setResetEmail(email);
                                setShowForgotPassword(true);
                            }}
                            className="text-sm text-indigo-200/70 hover:text-white transition-colors underline underline-offset-2"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                </div>

                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center p-6"
                    >
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)} />
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-2">Recuperar Contraseña</h3>
                            <p className="text-indigo-200/70 text-sm mb-6">
                                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                            </p>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-indigo-200" />
                                    </div>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-indigo-200/50 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
                                        placeholder="Correo Electrónico"
                                        required
                                        disabled={isResetting}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="flex-1 py-3 px-4 border border-white/10 rounded-xl text-sm font-bold text-indigo-200 hover:bg-white/5 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResetting}
                                        className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 transition-all disabled:opacity-70"
                                    >
                                        {isResetting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Enviando...
                                            </span>
                                        ) : (
                                            'Enviar Enlace'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
