'use client';

import { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const BottomSheetContext = createContext();

export function BottomSheetProvider({ children }) {
  const [sheet, setSheet] = useState(null);

  const openBottomSheet = (config) => {
    setSheet(config);
  };

  const closeBottomSheet = () => {
    setSheet(null);
  };

  return (
    <BottomSheetContext.Provider value={{ openBottomSheet, closeBottomSheet }}>
      {children}
      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBottomSheet}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-full ${
                sheet.size === 'large' ? 'max-w-4xl' : 'max-w-xl'
              } bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{sheet.title}</h3>
                  {sheet.description && (
                    <p className="text-xs font-bold text-[#444] uppercase tracking-widest mt-1">{sheet.description}</p>
                  )}
                </div>
                <button
                  onClick={closeBottomSheet}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {sheet.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </BottomSheetContext.Provider>
  );
}

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (context === undefined) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
};
