
import React, { useMemo } from 'react';
import { Transaction, Settings, getCurrencySymbol } from '../types';
import { t } from '../utils/translations';
import { X, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Calendar } from 'lucide-react';

interface WeeklyBriefProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  settings: Settings;
}

export const WeeklyBrief: React.FC<WeeklyBriefProps> = ({ isOpen, onClose, transactions, settings }) => {
  const symbol = getCurrencySymbol(settings.currency);

  // Calculate dates
  const { startOfWeek, endOfWeek, startOfLastWeek, endOfLastWeek } = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
    
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - day + 1); // Monday

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const startLast = new Date(start);
    startLast.setDate(start.getDate() - 7);
    
    const endLast = new Date(end);
    endLast.setDate(end.getDate() - 7);

    return { startOfWeek: start, endOfWeek: end, startOfLastWeek: startLast, endOfLastWeek: endLast };
  }, []);

  // Process Data
  const stats = useMemo(() => {
    const currentWeekTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startOfWeek && d <= endOfWeek;
    });

    const lastWeekTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startOfLastWeek && d <= endOfLastWeek;
    });

    const income = currentWeekTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentWeekTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpense = lastWeekTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Top Category
    const categories: Record<string, number> = {};
    currentWeekTx.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    // Trend
    let expenseTrend = 0;
    if (lastExpense > 0) {
      expenseTrend = ((expense - lastExpense) / lastExpense) * 100;
    }

    return { income, expense, topCategory, expenseTrend, hasData: currentWeekTx.length > 0 };
  }, [transactions, startOfWeek, endOfWeek, startOfLastWeek, endOfLastWeek]);

  if (!isOpen || !stats.hasData) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl overflow-hidden relative animate-slide-up">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="p-6 relative z-10">
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <Calendar size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-300 font-medium">
                    {startOfWeek.getDate()} - {endOfWeek.getDate()} {startOfWeek.toLocaleString('default', { month: 'short' })}
                </span>
             </div>
             <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
               <X size={20} />
             </button>
           </div>

           <h2 className="text-2xl font-black text-white mb-1">{t('brief.title', settings.language)}</h2>
           <p className="text-gray-400 text-sm mb-8">Краткая сводка ваших финансов</p>

           <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/50 backdrop-blur-md">
                   <div className="text-xs text-gray-400 mb-1">{t('brief.earned', settings.language)}</div>
                   <div className="text-lg font-bold text-emerald-400">+{stats.income.toLocaleString()} {symbol}</div>
               </div>
               <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/50 backdrop-blur-md">
                   <div className="text-xs text-gray-400 mb-1">{t('brief.spent', settings.language)}</div>
                   <div className="text-lg font-bold text-red-400">-{stats.expense.toLocaleString()} {symbol}</div>
               </div>
           </div>

           {/* Comparison Card */}
           <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 mb-4">
               <div className="flex items-center justify-between mb-2">
                   <span className="text-sm font-medium text-gray-200">Тренд расходов</span>
                   {stats.expenseTrend !== 0 && (
                       <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${stats.expenseTrend > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                           {stats.expenseTrend > 0 ? <TrendingUp size={12}/> : <ArrowDownRight size={12}/>}
                           {Math.abs(stats.expenseTrend).toFixed(1)}%
                       </span>
                   )}
               </div>
               <p className="text-xs text-gray-500">
                   {stats.expenseTrend > 0 
                     ? `Вы потратили больше, чем на прошлой неделе.` 
                     : stats.expenseTrend < 0 
                        ? `Отлично! Вы тратите меньше, чем на прошлой неделе.` 
                        : `Расходы на уровне прошлой недели.`}
               </p>
           </div>

           {/* Top Category */}
           {stats.topCategory && (
               <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 rounded-2xl border border-indigo-500/20 mb-6">
                   <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                       {stats.topCategory[0][0]}
                   </div>
                   <div>
                       <div className="text-xs text-indigo-300 font-medium mb-0.5">{t('brief.top_cat', settings.language)}</div>
                       <div className="font-bold text-white">
                           {stats.topCategory[0]} <span className="text-gray-400 font-normal">({stats.topCategory[1].toLocaleString()} {symbol})</span>
                       </div>
                   </div>
               </div>
           )}

           <button 
             onClick={onClose}
             className="w-full py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold shadow-lg shadow-white/10 transition-all active:scale-95"
           >
             {t('brief.continue', settings.language)}
           </button>
        </div>
      </div>
    </div>
  );
};
