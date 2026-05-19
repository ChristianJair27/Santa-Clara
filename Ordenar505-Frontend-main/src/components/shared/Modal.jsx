import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Importa AnimatePresence
import { IoClose } from 'react-icons/io5'; // Un ícono de cierre más moderno

const Modal = React.forwardRef(({ isOpen, onClose, title, children, innerRef }, ref) => {
  // AnimatePresence permite que los componentes se animen cuando se montan y desmontan
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"> {/* Aumenta la opacidad y añade padding global */}
          <motion.div
            ref={innerRef}
            initial={{ opacity: 0, scale: 0.9, y: 50 }} // Añadido y: 50 para un efecto de "subida"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }} // Coherente con la entrada
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            // Ajustes de diseño para que sea más coherente con el resto de la UI
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 transform transition-all duration-300 ease-in-out" // Fondo blanco, bordes más redondeados, sombra más profunda
          >
            {/* Header del Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200"> {/* Color de borde más claro */}
              <h2 className="text-2xl text-gray-800 font-bold">{title}</h2> {/* Color de texto más estándar, tamaño de fuente mayor */}
              <button
                className="text-gray-500 text-3xl hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300" // Ícono de cierre más grande y con efectos
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <IoClose /> {/* Usamos un ícono de React para un cierre más limpio */}
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6"> {/* Padding interno generoso */}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = "Modal";

export default Modal;