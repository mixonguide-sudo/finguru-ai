
import React, { useState } from 'react';
import { X, Trophy, Flame, Star, Medal, Target, Shield, Lock } from 'lucide-react';
import { UserProfile, Achievement } from '../types';
import { getLevelTitle } from '../services/gamification';

interface GamificationHubProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const ALL_BADGES: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_step', title: 'Первый шаг', description: 'Добавьте первую транзакцию', icon: '🚀' },
  { id: 'regular', title: 'Регулярность', description: 'Вносите данные 3 дня подряд', icon: '🔥' },
  { id: 'saver', title: 'Копилка', description: 'Накопите первые сбережения', icon: '🐷' },
  { id: 'investor', title: 'Инвестор', description: 'Добавьте первый инвестиционный актив', icon: '📈' },
  { id: 'pro_user', title: 'Профессионал', description: 'Достигните 5 уровня', icon: '⭐' },
];

export const GamificationHub: React.FC<GamificationHubProps> = ({ isOpen, onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'badges'>('overview');

  if (!isOpen) return null;

  const nextLevelPct = Math.min(100, (profile.currentXp / profile.nextLevelXp) * 100);

  // Mock Leaderboard
  const leaderboard = [
      { name: 'Алихан', level: 18, xp: 12500, avatar: '🦁' },
      { name: 'Елена', level: 15, xp: 7200, avatar: '🦊' },
      { name: 'Вы', level: profile.level, xp: Math.round(profile.currentXp), avatar: '👤', isMe: true },
      { name: 'Макс', level: 8, xp: 1600, avatar: '🐼' },
      { name: 'Дмитрий', level: 4, xp: 450, avatar: '🐨' },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-indigo-500/30 shadow-2xl relative h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm relative z-10">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="text-yellow-400" /> Центр Успеха
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-gray-900 relative z-10">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
                Профиль
            </button>
            <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
                Лидеры
            </button>
            <button 
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'badges' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
                Значки
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>

            {activeTab === 'overview' && (
                <div className="space-y-6 relative z-10">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/40 border-4 border-gray-900 mb-4 relative">
                            {profile.level}
                            <div className="absolute -bottom-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-gray-900">
                                LVL
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{getLevelTitle(profile.level)}</h3>
                        <p className="text-gray-400 text-sm">Ваш текущий статус</p>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 space-y-3">
                        <div className="flex justify-between text-sm font-bold text-gray-300">
                            <span>XP Прогресс</span>
                            <span>{Math.round(profile.currentXp)} / {profile.nextLevelXp}</span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${nextLevelPct}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Вносите доходы и расходы, чтобы получать опыт!
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center">
                            <Flame size={24} className="text-orange-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{profile.streakDays}</span>
                            <span className="text-xs text-gray-400">Дней подряд</span>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center justify-center">
                            <Target size={24} className="text-emerald-500 mb-2" />
                            <span className="text-2xl font-bold text-white">{profile.totalTransactions}</span>
                            <span className="text-xs text-gray-400">Операций</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div className="space-y-3 relative z-10">
                    <div className="bg-amber-900/20 p-4 rounded-2xl border border-amber-500/20 mb-4 text-center">
                        <p className="text-xs text-amber-200">
                            Рейтинг обновляется ежедневно. Станьте лучшим инвестором!
                        </p>
                    </div>
                    {leaderboard.map((user, idx) => (
                        <div 
                            key={idx} 
                            className={`flex items-center gap-4 p-3 rounded-xl border ${user.isMe ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-gray-800/50 border-gray-700'}`}
                        >
                            <div className="w-8 font-bold text-gray-500 text-center">#{idx + 1}</div>
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg">
                                {user.avatar}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                    {user.name}
                                    {idx === 0 && <Medal size={14} className="text-yellow-400" />}
                                </div>
                                <div className="text-xs text-gray-400">{getLevelTitle(user.level)}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-indigo-400 text-sm">{user.xp} XP</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'badges' && (
                <div className="space-y-3 relative z-10">
                    {ALL_BADGES.map(badge => {
                        const isUnlocked = profile.achievements?.find(a => a.id === badge.id);
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
            )}
        </div>
      </div>
    </div>
  );
};
