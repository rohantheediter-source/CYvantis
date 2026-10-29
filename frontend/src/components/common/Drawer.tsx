import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-[#0E1A1F]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0E1A1F]/95 backdrop-blur-2xl border-l border-[#6967FB]/30 text-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#6967FB]/20 flex items-center justify-between bg-[#122026]/90">
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5 font-mono">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C8F904]" />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[#9FB0B7] hover:text-[#C8F904] p-2 rounded-xl hover:bg-[#6967FB]/20 border border-transparent hover:border-[#C8F904]/40 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
