
import React from 'react';
import { SavingsGoal } from '../types';
import { Plus, Trash2, CheckCircle2, Calendar, Edit2, AlertCircle } from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  symbol: string;
  onAddFunds: (goal: SavingsGoal) => void;
  onRemove: (id: string) => void;
  onEdit?: (goal: SavingsGoal) => void;
  plannedMonthlyAmount?: number; // New prop from BudgetView
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, symbol, onAddFunds, onRemove, onEdit, plannedMonthlyAmount = 0 }) => {
  const percent = Math.min(100, Math.max(0, (goal.savedAmount / goal.amount) * 100));
  const isCompleted = percent >= 100;

  // Calculate vertical position of the wave. 
  const waveTop = 100 - (percent * 1.25); 

  const targetDateObj = goal.targetDate ? new Date(goal.targetDate) : null;
  const formattedTargetDate = targetDateObj 
    ? targetDateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : null;

  // Calculate Projected Date
  let projectedDateStr = null;
  let isLate = false;

  if (!isCompleted && plannedMonthlyAmount > 0) {
      const remaining = goal.amount - goal.savedAmount;
      const monthsNeeded = Math.ceil(remaining / plannedMonthlyAmount);
      
      const projDate = new Date();
      projDate.setMonth(projDate.getMonth() + monthsNeeded);
      
      projectedDateStr = projDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });

      // Check if projection is later than target
      if (targetDateObj && projDate > targetDateObj) {
          isLate = true;
      }
  }

  return (
    <div className="relative w-full h-52 bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-700/50 group transition-transform active:scale-[0.98]">
      
      {/* Liquid Background Layer */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl z-0">
        {/* Back Wave (Darker/Slower) */}
        <div 
          className="wave bg-[#65a30d]/60" // Lime-600 equivalent
          style={{ 
            top: `${waveTop + 5}%`, 
            animationDuration: '12s',
            marginLeft: '10px'
          }} 
        />
        {/* Front Wave (Lighter/Faster) */}
        <div 
          className="wave bg-[#84cc16]" // Lime-500 equivalent
          style={{ 
            top: `${waveTop}%`, 
            animationDuration: '8s' 
          }} 
        />
      </div>

      {/* Content Layer - High Z-index to stay on top of liquid */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        
        {/* Header: Name, Amount, Delete */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide truncate max-w-[200px]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {goal.name}
            </h3>
            <p className="text-sm font-bold text-white mt-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
               {goal.savedAmount.toLocaleString()} / {goal.amount.toLocaleString()} {symbol}
            </p>
            
            <div className="mt-2 flex flex-col gap-0.5">
                {formattedTargetDate && (
                    <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        <Calendar size={10} />
                        Цель: {formattedTargetDate}
                    </div>
                )}
                {projectedDateStr && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${isLate ? 'text-red-200' : 'text-emerald-100'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        {isLate && <AlertCircle size={10} />}
                        Прогноз: {projectedDateStr}
                    </div>
                )}
            </div>
          </div>
          
          <div className="flex gap-1">
             {onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                    className="text-white hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-sm"
                >
                    <Edit2 size={16} className="drop-shadow-md" />
                </button>
             )}
             <button 
                onClick={(e) => { e.stopPropagation(); onRemove(goal.id); }}
                className="text-white hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-sm"
             >
                <Trash2 size={16} className="drop-shadow-md" />
             </button>
          </div>
        </div>

        {/* Footer: Percentage & Action Button */}
        <div className="flex justify-between items-end">
          <div className="text-5xl font-black text-white tracking-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
             {Math.round(percent)}<span className="text-2xl ml-1">%</span>
          </div>
          
          {!isCompleted ? (
            <button 
                onClick={() => onAddFunds(goal)}
                className="bg-white hover:bg-gray-100 text-emerald-700 pl-3 pr-4 py-2.5 rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-2 font-black border-2 border-transparent hover:border-emerald-100"
            >
                <Plus size={20} strokeWidth={3} />
                <span>Пополнить</span>
            </button>
          ) : (
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-white font-bold text-sm border border-white/30 shadow-lg drop-shadow-md">
                <CheckCircle2 size={18} className="text-white" />
                <span>Готово!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
