
import React from 'react';
import { X, Trophy, Lock } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const ALL_BADGES = [
  { id: 'first_step', title: 'Первый шаг', description: 'Добавьте первую транзакцию', icon: '🚀' },
  { id: 'regular', title: 'Регулярность', description: 'Вносите данные 3 дня подряд', icon: '🔥' },
  { id: 'saver', title: 'Копилка', description: 'Накопите первые сбережения', icon: '🐷' },
  { id: 'investor', title: 'Инвестор', description: 'Добавьте первый инвестиционный актив', icon: '📈' },
  { id: 'pro_user', title: 'Профессионал', description: 'Достигните 5 уровня', icon: '⭐' },
];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl p-6 relative h-[70vh] flex flex-col">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Достижения
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {ALL_BADGES.map(badge => {
                const isUnlocked = achievements.find(a => a.id === badge.id);
                
                return (
                    <div 
                        key={badge.id}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isUnlocked ? 'bg-gradient-to-r from-yellow-900/20 to-gray-800 border-yellow-500/30' : 'bg-gray-800/50 border-gray-700 opacity-60'}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${isUnlocked ? 'bg-gray-800' : 'bg-gray-700'}`}>
                            {isUnlocked ? badge.icon : <Lock size={18} className="text-gray-500" />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                {badge.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                                {badge.description}
                            </p>
                            {isUnlocked && (
                                <span className="text-[10px] text-yellow-500 font-medium mt-1 block">
                                    Разблокировано
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
