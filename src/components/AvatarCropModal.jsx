import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, ImageIcon } from 'lucide-react';
import { getCroppedImg } from '../lib/cropImage';
import ModalContainer from './ModalContainer';

export default function AvatarCropModal({ imageSrc, onClose, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setSaving(true);
        try {
            const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
            await onSave(croppedDataUrl);
        } catch {
            setSaving(false);
        }
    };

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-md">
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-eyr-primary-container flex items-center justify-center text-eyr-primary shrink-0">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-headline font-extrabold text-eyr-on-surface">Recortar Foto</h3>
                        <p className="text-sm text-eyr-on-variant">Ajusta el encuadre de tu foto de perfil</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-red-50 text-eyr-on-variant hover:text-red-500 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Cropper Area */}
            <div className="relative w-full aspect-square bg-eyr-on-surface shrink-0">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
            </div>

            {/* Zoom Control */}
            <div className="px-8 py-4 flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-eyr-on-variant shrink-0" />
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-eyr-surface-high rounded-full appearance-none cursor-pointer accent-eyr-primary"
                />
                <ZoomIn className="w-4 h-4 text-eyr-on-variant shrink-0" />
            </div>

            {/* Footer */}
            <div className="p-6 bg-eyr-surface-mid flex items-center justify-between shrink-0">
                <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl font-bold text-eyr-on-variant hover:bg-red-50 hover:text-red-500 transition-all"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 rounded-2xl font-extrabold bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white shadow-xl shadow-eyr-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                    {saving ? 'Guardando...' : 'Guardar foto'}
                </button>
            </div>
        </ModalContainer>
    );
}
