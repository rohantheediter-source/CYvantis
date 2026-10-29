import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg'
}) => {
  if (!isOpen) return null;

  const widthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0E1A1F]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widthMap[maxWidth]} bg-[#0E1A1F]/95 backdrop-blur-2xl border border-[#6967FB]/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden z-10`}
      >
        <div className="p-5 border-b border-[#6967FB]/20 flex items-center justify-between bg-[#122026]/90">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C8F904]" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#9FB0B7] hover:text-[#C8F904] p-2 rounded-xl hover:bg-[#6967FB]/20 border border-transparent hover:border-[#C8F904]/40 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
