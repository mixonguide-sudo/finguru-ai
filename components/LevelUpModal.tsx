
import React from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';
import { getLevelTitle } from '../services/gamification';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, newLevel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full max-w-sm rounded-3xl border border-yellow-500/30 shadow-2xl p-8 text-center relative overflow-hidden">
        
        {/* Confetti/Rays Background Effect */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 mb-4 animate-bounce">
                <Trophy size={40} className="text-white" />
            </div>

            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-wide">Новый Уровень!</h2>
            <p className="text-yellow-400 font-bold text-lg mb-4">{getLevelTitle(newLevel)}</p>

            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <p className="text-gray-300 text-sm leading-relaxed">
                    Поздравляем! Вы стали на шаг ближе к финансовой свободе. Продолжайте вести учет!
                </p>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Sparkles size={18} />
                Отлично!
            </button>
        </div>
      </div>
    </div>
  );
};
