import React, { useState, useEffect, useRef } from 'react';
import { useAuth, getRoleLabel } from '../context/AuthContext';
import { User, Save, Shield, Lock, Sparkles, Camera, Trash2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { readFileAsDataUrl } from '../lib/cropImage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AvatarCropModal from './AvatarCropModal';

export default function Settings() {
    const { user, updateUser, changePassword } = useAuth();
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const fileInputRef = useRef(null);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        updateUser(user.id, { name });
        toast.success('Nombre actualizado correctamente');
        setIsEditing(false);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so same file can be re-selected
        e.target.value = '';

        if (!file.type.startsWith('image/')) {
            toast.error('Solo se permiten archivos de imagen');
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        setCropImageSrc(dataUrl);
    };

    const handleCropSave = async (croppedDataUrl) => {
        try {
            await updateUser(user.id, { avatar: croppedDataUrl });

            // Verify the write persisted
            const snap = await getDoc(doc(db, 'users', user.id));
            if (!snap.exists() || !snap.data().avatar) {
                throw new Error('La foto no se guardo en la base de datos');
            }

            setCropImageSrc(null);
            toast.success('Foto de perfil actualizada');
        } catch (error) {
            toast.error('Error al guardar la foto: ' + error.message);
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            await updateUser(user.id, { avatar: null });
            toast.success('Foto de perfil eliminada');
        } catch (error) {
            toast.error('Error al eliminar la foto: ' + error.message);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        setIsChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success('Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            const msg = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
                ? 'La contraseña actual es incorrecta'
                : error.code === 'auth/weak-password'
                    ? 'La nueva contraseña es demasiado débil'
                    : error.code === 'auth/too-many-requests'
                        ? 'Demasiados intentos. Intenta más tarde'
                        : 'Error al cambiar contraseña: ' + error.message;
            toast.error(msg);
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!user) return null;

    const isAdmin = ['director', 'admin', 'super_admin'].includes(user.role);
    const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto pb-20 relative px-4 sm:px-6">

            {/* Ambient Background Mesh */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[90px] animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-indigo-200/20 rounded-full blur-[80px]" />
            </div>

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    Configuración
                    <span className="p-2 bg-slate-100/50 rounded-xl backdrop-blur-sm">
                        <Sparkles className="w-5 h-5 text-slate-400" />
                    </span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Personaliza tu perfil y preferencias.</p>
            </div>

            {/* Content Grid */}
            <div className="grid gap-8">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <User className="w-32 h-32 text-slate-900" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            Perfil de Usuario
                        </h2>

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-8 sm:flex-row sm:items-start gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-indigo-700">{initials}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex flex-col items-center sm:items-start gap-2 pt-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    Cambiar Foto
                                </button>
                                {user.avatar && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar Foto
                                    </button>
                                )}
                                <p className="text-xs text-slate-400">JPG, PNG o GIF. Max 5MB.</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <form onSubmit={handleSubmit} className="max-w-md space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Nombre Completo
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isAdmin}
                                        className={`w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                                        ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                    {!isAdmin && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                {!isAdmin && (
                                    <p className="text-xs text-amber-600 font-medium ml-1 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Solo el administrador puede modificar el nombre.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Rol en el Sistema
                                </label>
                                <div className="w-full bg-slate-100/50 border border-slate-200/50 rounded-xl px-4 py-4 font-medium text-slate-600 flex items-center gap-2 cursor-not-allowed opacity-80">
                                    {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    <span className="capitalize">
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-300 hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Guardar Cambios
                                </motion.button>
                            )}
                        </form>
                    </div>
                </motion.div>

                {/* Change Password Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <KeyRound className="w-32 h-32 text-slate-900" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-500" />
                            Cambiar Contraseña
                        </h2>

                        <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Contraseña Actual
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-4 pr-12 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Ingresa tu contraseña actual"
                                        required
                                        disabled={isChangingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-4 pr-12 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        disabled={isChangingPassword}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-slate-50/50 border rounded-xl px-4 py-4 font-medium focus:outline-none focus:ring-2 transition-all ${
                                        confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                            : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    placeholder="Repite la nueva contraseña"
                                    required
                                    disabled={isChangingPassword}
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-xs text-red-500 font-medium ml-1">Las contraseñas no coinciden</p>
                                )}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-300 hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cambiando...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        Cambiar Contraseña
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* System Info Card (Placeholder for visual balance) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 shadow-lg shadow-slate-100/50 border border-white/50"
                >
                    <h2 className="text-lg font-bold text-slate-800 mb-4 opacity-70">Información del Sistema</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-500">
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <span className="block font-semibold text-slate-700">Versión</span>
                            v1.0.2 (Alpha)
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <span className="block font-semibold text-slate-700">Licencia</span>
                            Escuela Demo Standard
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Crop Modal */}
            {cropImageSrc && (
                <AvatarCropModal
                    imageSrc={cropImageSrc}
                    onClose={() => setCropImageSrc(null)}
                    onSave={handleCropSave}
                />
            )}
        </div>
    );
}
