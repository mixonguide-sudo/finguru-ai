
import React from 'react';
import { UserProfile } from '../types';
import { getLevelTitle } from '../services/gamification';
import { Flame, Star, Trophy } from 'lucide-react';

interface GamificationBarProps {
  profile: UserProfile;
  onOpenAchievements: () => void;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ profile, onOpenAchievements }) => {
  const progressPercent = Math.min(100, (profile.currentXp / profile.nextLevelXp) * 100);
  const title = getLevelTitle(profile.level);

  return (
    <div 
        onClick={onOpenAchievements}
        className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-3 border border-gray-700/50 shadow-lg mb-4 animate-fade-in cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/40 border border-white/10">
                {profile.level}
             </div>
             <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
             </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ваш статус</div>
            <div className="text-sm font-bold text-white flex items-center gap-1">
                {title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {/* Trophy Icon */}
            <div className="bg-gray-800/80 p-1.5 rounded-lg border border-yellow-500/30 text-yellow-400">
                <Trophy size={16} />
            </div>

            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-700">
                <Flame size={16} className={`${profile.streakDays > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-600'}`} />
                <span className={`text-sm font-bold ${profile.streakDays > 0 ? 'text-orange-100' : 'text-gray-500'}`}>
                    {profile.streakDays} <span className="text-[10px] font-normal opacity-70">дн.</span>
                </span>
            </div>
        </div>
      </div>

      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1">
         <span className="text-[10px] text-gray-500 font-medium">XP</span>
         <span className="text-[10px] text-gray-400 font-medium">{Math.round(profile.currentXp)} / {profile.nextLevelXp}</span>
      </div>
    </div>
  );
};
