import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

/**
 * Shell reutilizable para todos los modales del sistema.
 * Maneja: portal, backdrop, animación, bordes redondeados y barra superior gradiente.
 *
 * Props:
 *   onClose      — fn: cierra el modal al hacer click en el backdrop
 *   children     — contenido del modal (header, body, footer)
 *   maxWidth     — clase Tailwind de ancho máximo (default: 'max-w-2xl')
 *   noGradient   — omite la barra superior de gradiente (para dialogs simples)
 */
export default function ModalContainer({ onClose, children, maxWidth = 'max-w-2xl', noGradient = false }) {
    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-eyr-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={`bg-white w-full ${maxWidth} rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
                onClick={e => e.stopPropagation()}
            >
                {!noGradient && (
                    <div className="h-2 bg-gradient-to-r from-eyr-primary via-[#742fe5] to-[#53ddfc] shrink-0" />
                )}
                {children}
            </motion.div>
        </div>,
        document.body
    );
}
