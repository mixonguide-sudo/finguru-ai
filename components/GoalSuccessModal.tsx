
import React from 'react';
import { X, Trophy, Sparkles, Share2 } from 'lucide-react';
import { SavingsGoal } from '../types';

interface GoalSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  symbol: string;
}

export const GoalSuccessModal: React.FC<GoalSuccessModalProps> = ({ isOpen, onClose, goal, symbol }) => {
  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Confetti Background Effect (CSS only simulation) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute top-10 left-1/2 w-1 h-12 bg-gradient-to-b from-transparent to-white opacity-20 rotate-45"></div>
      </div>

      <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full max-w-sm rounded-3xl border border-yellow-500/50 shadow-2xl p-8 text-center relative overflow-hidden animate-bounce-in">
        
        {/* Glow effect behind trophy */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-[60px] pointer-events-none"></div>

        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-colors z-20"
        >
            <X size={20} />
        </button>

        <div className="relative z-10">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 mb-6 animate-[bounce_2s_infinite]">
                <Trophy size={48} className="text-white drop-shadow-md" />
            </div>

            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Цель Достигнута!</h2>
            <div className="bg-gray-800/80 border border-yellow-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Вы накопили</p>
                <p className="text-2xl font-bold text-yellow-400">
                    {goal.amount.toLocaleString()} {symbol}
                </p>
                <p className="text-white font-medium mt-1">{goal.name}</p>
            </div>

            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
                Поздравляем! Ваша дисциплина принесла плоды. Время поставить новую цель или наградить себя! 🎁
            </p>

            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 rounded-xl font-bold text-white shadow-lg shadow-amber-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Sparkles size={18} fill="white" />
                Ура, я молодец!
            </button>
        </div>
      </div>
    </div>
  );
};
