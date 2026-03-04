import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, School, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import logoEyr from '../assets/logo_eyr.png';

export default function Login() {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    const handleDevFill = (role) => {
        const devCredentials = {
            admin: 'ccontrerasr@eduhuechuraba.cl',
            teacher: 'dalvaradov@eduhuechuraba.cl',
            director: 'director@escuela.cl',
            utp: 'utp@escuela.cl',
            inspector: 'inspectoria@escuela.cl',
        };
        setEmail(devCredentials[role] || devCredentials.teacher);
        setPassword('123456');
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
                        <p className="text-indigo-200 text-sm">Sistema de Gestion Administrativa</p>
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

                    {/* Dev Helpers */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-center text-xs text-indigo-300/60 mb-3 uppercase tracking-wider font-semibold">Modo Desarrollo</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { key: 'admin', label: 'Admin' },
                                { key: 'director', label: 'Director' },
                                { key: 'utp', label: 'Jefa UTP' },
                                { key: 'inspector', label: 'Inspectoria' },
                                { key: 'teacher', label: 'Docente' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleDevFill(item.key)}
                                    disabled={isLoading}
                                    className="text-[11px] text-indigo-200/70 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all disabled:opacity-50"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
