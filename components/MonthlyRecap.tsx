import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Crown, Sparkles, Loader2, Share2, Calendar, PieChart } from 'lucide-react';
import { Transaction, Settings, getCurrencySymbol } from '../types';
import { getMonthlyAnalysis } from '../services/geminiService';

interface MonthlyRecapProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  monthDate: Date; // The target month to recap
  settings: Settings;
}

export const MonthlyRecap: React.FC<MonthlyRecapProps> = ({ isOpen, onClose, transactions, monthDate, settings }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [analysis, setAnalysis] = useState<{ funnyComment: string, advice: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const symbol = getCurrencySymbol(settings.currency);
  const totalSlides = 5;

  const monthName = monthDate.toLocaleDateString(settings.language, { month: 'long', year: 'numeric' });

  // Filter transactions for the target month internally
  const monthlyTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === monthDate.getMonth() && 
                 tDate.getFullYear() === monthDate.getFullYear();
      });
  }, [transactions, monthDate]);

  // Calculate Stats
  const stats = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    // Categories
    const categories: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedCats.slice(0, 3);

    // Peak Spend Day
    const days: Record<number, number> = {};
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
        const d = new Date(t.date).getDate();
        days[d] = (days[d] || 0) + t.amount;
    });
    const peakDayEntry = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
    const peakDay = peakDayEntry ? parseInt(peakDayEntry[0]) : null;
    const peakAmount = peakDayEntry ? peakDayEntry[1] : 0;

    return { income, expense, balance, topCategories, peakDay, peakAmount };
  }, [monthlyTransactions]);

  // Fetch AI Analysis on Open
  useEffect(() => {
      if (isOpen && !analysis && monthlyTransactions.length > 0) {
          setIsLoading(true);
          getMonthlyAnalysis(monthlyTransactions, monthName, symbol, settings.language)
            .then(res => {
                setAnalysis(res || { funnyComment: 'Месяц прошел... интересно!', advice: 'Следите за расходами.' });
            })
            .catch(() => {
                setAnalysis({ funnyComment: 'ИИ устал считать ваши деньги 😅', advice: 'Просто тратьте меньше, чем зарабатываете.' });
            })
            .finally(() => setIsLoading(false));
      }
  }, [isOpen, monthlyTransactions, monthName, settings.language]);

  const nextSlide = () => {
      if (currentSlide < totalSlides - 1) setCurrentSlide(c => c + 1);
      else onClose();
  };

  const prevSlide = () => {
      if (currentSlide > 0) setCurrentSlide(c => c - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                        className={`h-full bg-white transition-all duration-300 ease-out ${idx < currentSlide ? 'w-full' : idx === currentSlide ? 'w-full animate-pulse' : 'w-0'}`}
                    />
                </div>
            ))}
        </div>

        <button onClick={onClose} className="absolute top-8 right-4 z-30 text-white/50 hover:text-white p-2">
            <X size={24} />
        </button>

        {/* Slide Content Area */}
        <div className="w-full h-full max-w-md relative flex flex-col" onClick={(e) => {
            const width = e.currentTarget.offsetWidth;
            const x = e.clientX;
            if (x > width / 2) nextSlide();
            else prevSlide();
        }}>
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-0 left-0 w-full h-full transition-colors duration-700 ${
                    currentSlide === 0 ? 'bg-gradient-to-b from-indigo-900 to-gray-900' : 
                    currentSlide === 1 ? 'bg-gradient-to-b from-gray-900 to-emerald-900' :
                    currentSlide === 2 ? 'bg-gradient-to-b from-red-900 to-gray-900' :
                    currentSlide === 3 ? 'bg-gradient-to-b from-amber-900 to-orange-900' :
                    'bg-gradient-to-b from-purple-900 to-indigo-900'
                }`}></div>
                <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-white/5 rounded-full blur-[80px] animate-pulse"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-8 text-center animate-slide-up key={currentSlide}">
                
                {/* Slide 0: Intro */}
                {currentSlide === 0 && (
                    <>
                        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-xl rotate-3">
                            <span className="text-5xl">🗓️</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-lg">Итоги</h2>
                        <p className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 font-bold mb-8">{monthName}</p>
                        <p className="text-gray-300 max-w-[200px]">Готовы узнать правду о ваших финансах?</p>
                        <div className="mt-16 text-xs text-white/50 animate-bounce uppercase tracking-widest font-bold">Нажмите для старта</div>
                    </>
                )}

                {/* Slide 1: Cash Flow */}
                {currentSlide === 1 && (
                    <>
                         <div className="mb-8">
                             <div className="text-xs text-emerald-300 font-bold uppercase tracking-widest mb-2">Денежный поток</div>
                             <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2">
                                 <TrendingUp size={32} /> Финансы
                             </h2>
                         </div>
                         
                         <div className="w-full space-y-4">
                             <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 flex justify-between items-center">
                                 <div className="text-left">
                                     <div className="text-xs text-emerald-300 font-bold">Доход</div>
                                     <div className="text-2xl font-bold text-white">+{stats.income.toLocaleString()} {symbol}</div>
                                 </div>
                                 <div className="bg-emerald-500/20 p-3 rounded-full"><TrendingUp className="text-emerald-400" /></div>
                             </div>

                             <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 flex justify-between items-center">
                                 <div className="text-left">
                                     <div className="text-xs text-red-300 font-bold">Расход</div>
                                     <div className="text-2xl font-bold text-white">-{stats.expense.toLocaleString()} {symbol}</div>
                                 </div>
                                 <div className="bg-red-500/20 p-3 rounded-full"><TrendingDown className="text-red-400" /></div>
                             </div>

                             <div className="mt-8 p-4 bg-black/20 rounded-2xl border border-white/5">
                                 <p className="text-gray-400 text-xs uppercase mb-1">Остаток на конец месяца</p>
                                 <p className={`text-3xl font-black ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                     {stats.balance > 0 ? '+' : ''}{stats.balance.toLocaleString()} {symbol}
                                 </p>
                             </div>
                         </div>
                    </>
                )}

                {/* Slide 2: Peak Day */}
                {currentSlide === 2 && (
                    <>
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                             <Calendar size={32} className="text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-200 mb-2">День "Транжиры"</h2>
                        
                        {stats.peakDay ? (
                            <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10 mt-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                <div className="text-6xl font-black text-white mb-2">{stats.peakDay}-е</div>
                                <div className="text-sm text-gray-300 uppercase tracking-wider font-bold">число</div>
                                <div className="mt-6 text-xl text-red-300 font-bold">
                                    -{stats.peakAmount.toLocaleString()} {symbol}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">было потрачено за один день!</p>
                            </div>
                        ) : (
                            <p className="text-white mt-4">В этом месяце вы ничего не тратили!</p>
                        )}
                    </>
                )}

                {/* Slide 3: Top Categories */}
                {currentSlide === 3 && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                <PieChart className="text-amber-400" /> Топ категорий
                            </h2>
                        </div>

                        <div className="w-full space-y-3">
                            {stats.topCategories.map(([cat, amount], index) => (
                                <div key={cat} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-900 ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-gray-300' : 'bg-orange-700'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-bold text-white text-lg">{cat}</span>
                                    </div>
                                    <span className="text-gray-200 font-medium">{amount.toLocaleString()} {symbol}</span>
                                </div>
                            ))}
                            {stats.topCategories.length === 0 && (
                                <div className="text-gray-400 italic">Нет расходов</div>
                            )}
                        </div>
                    </>
                )}

                {/* Slide 4: AI Analysis */}
                {currentSlide === 4 && (
                    <>
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 rotate-6">
                            <Sparkles size={40} className="text-white" />
                        </div>
                        
                        {isLoading ? (
                            <div className="flex flex-col items-center">
                                <Loader2 size={48} className="text-indigo-400 animate-spin mb-4" />
                                <p className="text-indigo-200 animate-pulse">ИИ анализирует вашу карму...</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-6">
                                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl">
                                    <div className="text-xs text-indigo-300 font-bold uppercase mb-3 tracking-wider">Вердикт Finguru</div>
                                    <p className="text-xl text-white font-medium leading-relaxed">
                                        "{analysis?.funnyComment}"
                                    </p>
                                </div>

                                <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                                    <div className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center justify-center gap-2">
                                        <Crown size={12} className="text-amber-400" /> Совет месяца
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {analysis?.advice}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-10 opacity-50">
                           <button className="flex items-center gap-2 text-white/50 text-xs">
                               <Share2 size={12} /> Finguru AI 
                           </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};