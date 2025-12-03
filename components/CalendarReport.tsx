import React, { useState, useMemo } from 'react';
import { Transaction, Settings, getCurrencySymbol, RecurringExpense } from '../types';
import { t } from '../utils/translations';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Minus, Plus, Clock, ChevronDown, ChevronUp, Layers, PlayCircle } from 'lucide-react';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyRecap } from './MonthlyRecap';

interface CalendarReportProps {
  transactions: Transaction[];
  settings: Settings;
  recurringExpenses?: RecurringExpense[]; // Added prop
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

export const CalendarReport: React.FC<CalendarReportProps> = ({ 
    transactions, 
    settings, 
    recurringExpenses = [],
    onDelete, 
    onEdit, 
    onAddTransaction 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  
  // State for expanded transaction groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const symbol = getCurrencySymbol(settings.currency);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthData = useMemo(() => {
    const map: Record<number, { income: number; expense: number; count: number }> = {};
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear()) {
        const day = tDate.getDate();
        if (!map[day]) map[day] = { income: 0, expense: 0, count: 0 };
        if (t.type === 'income') map[day].income += t.amount;
        else map[day].expense += t.amount;
        map[day].count++;
      }
    });
    return map;
  }, [transactions, currentDate]);

  // Calculate which days have recurring payments due
  const duePayments = useMemo(() => {
      const map: Record<number, RecurringExpense[]> = {};
      recurringExpenses.forEach(exp => {
          if (exp.active && exp.paymentDay) {
              if (!map[exp.paymentDay]) map[exp.paymentDay] = [];
              map[exp.paymentDay].push(exp);
          }
      });
      return map;
  }, [recurringExpenses]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        tDate.getDate() === selectedDate.getDate() &&
        tDate.getMonth() === selectedDate.getMonth() &&
        tDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, transactions]);
  
  // Transactions exist for current month (check for button visibility)
  const hasMonthData = useMemo(() => {
      return transactions.some(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === currentDate.getMonth() && 
                 tDate.getFullYear() === currentDate.getFullYear();
      });
  }, [transactions, currentDate]);

  // Group transactions by Category + Type
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      
      selectedDayTransactions.forEach(t => {
          // Key combines category and type to separate Income/Expense with same name just in case
          const key = `${t.category}-${t.type}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(t);
      });

      // Convert map to array for rendering, sort by income first then expense, or just simple Object.entries
      return Object.entries(groups).sort((a, b) => {
          // Sort priorities: Income first, then by total amount desc
          const typeA = a[1][0].type;
          const typeB = b[1][0].type;
          if (typeA !== typeB) return typeA === 'income' ? -1 : 1;
          
          const totalA = a[1].reduce((sum, t) => sum + t.amount, 0);
          const totalB = b[1].reduce((sum, t) => sum + t.amount, 0);
          return totalB - totalA;
      });
  }, [selectedDayTransactions]);

  const toggleGroup = (key: string) => {
      setExpandedGroups(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  const selectedDayDue = useMemo(() => {
      if (!selectedDate) return [];
      return duePayments[selectedDate.getDate()] || [];
  }, [selectedDate, duePayments]);

  const isPastDate = useMemo(() => {
    if (!selectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() < today.getTime();
  }, [selectedDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const renderDay = (day: number) => {
    const data = monthData[day];
    const dues = duePayments[day]; // Check for recurring dues
    
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

    let indicatorColor = 'bg-transparent';
    if (data) {
        if (data.income > data.expense) indicatorColor = 'bg-emerald-500';
        else if (data.expense > 0) indicatorColor = 'bg-red-500';
    }

    return (
      <div 
        key={day}
        onClick={() => {
            setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            setExpandedGroups({}); // Reset expanded groups on date change
        }}
        className={`
          relative h-12 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border
          ${isSelected ? 'bg-blue-600 border-blue-400 shadow-lg z-10' : 'bg-gray-800/50 border-transparent hover:bg-gray-800'}
          ${isToday && !isSelected ? 'border-blue-500/50' : ''}
        `}
      >
        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>{day}</span>
        <div className="flex gap-1 mt-1 items-center">
            {data && (
               <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></div>
            )}
            {dues && dues.length > 0 && (
               <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`}></div>
            )}
        </div>
      </div>
    );
  };

  const weekDays = settings.language === 'en' 
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const monthNames = settings.language === 'en'
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const monthNamesKz = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];

  const getMonthName = (date: Date) => {
      if (settings.language === 'kz') return monthNamesKz[date.getMonth()];
      return monthNames[date.getMonth()];
  };

  return (
    <div className="p-4 pb-32 space-y-6 animate-fade-in relative">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <CalendarIcon className="text-blue-400" />
               {t('nav.report', settings.language)}
            </h2>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded-md text-gray-400">
                    <ChevronLeft size={20}/>
                </button>
                <span className="text-sm font-bold w-24 text-center capitalize">
                    {getMonthName(currentDate)} {currentDate.getFullYear()}
                </span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded-md text-gray-400">
                    <ChevronRight size={20}/>
                </button>
            </div>
        </div>

        <div className="bg-gray-900 rounded-2xl">
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => renderDay(i + 1))}
            </div>
        </div>

        {selectedDate && (
            <div className="animate-slide-up">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-gray-200 capitalize">
                        {selectedDate.getDate()} {getMonthName(selectedDate)}
                    </h3>
                    {isPastDate && (
                         <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                         >
                             <Plus size={14} /> {t('add', settings.language)}
                         </button>
                    )}
                </div>

                <div className="space-y-3">
                    {/* Render Recurring Dues first */}
                    {selectedDayDue.length > 0 && selectedDayDue.map(due => (
                        <div key={`due-${due.id}`} className="flex justify-between items-center bg-amber-900/20 p-3 rounded-xl border border-amber-500/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-amber-200">{due.name}</p>
                                    <p className="text-xs text-amber-200/70">{t('cal.recurring_due', settings.language)}</p>
                                </div>
                            </div>
                            <div className="font-bold text-amber-400">
                                {due.amount.toLocaleString()} {symbol}
                            </div>
                        </div>
                    ))}

                    {groupedTransactions.length > 0 ? (
                        groupedTransactions.map(([key, groupTxs]) => {
                            const firstTx = groupTxs[0];
                            const isGroup = groupTxs.length > 1;
                            const totalAmount = groupTxs.reduce((sum, t) => sum + t.amount, 0);
                            const isExpanded = expandedGroups[key];

                            if (isGroup) {
                                return (
                                    <div key={key} className="space-y-2">
                                        {/* Group Header */}
                                        <div 
                                            onClick={() => toggleGroup(key)}
                                            className="flex justify-between items-center bg-gray-800 hover:bg-gray-750 p-3 rounded-xl border border-gray-700/80 cursor-pointer shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${firstTx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    <Layers size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-200 flex items-center gap-2">
                                                        {firstTx.category}
                                                        <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-400 font-normal">
                                                            {groupTxs.length}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {groupTxs.length} операций
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`font-bold ${firstTx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                                    {firstTx.type === 'income' ? '+' : '-'}{totalAmount.toLocaleString()} {symbol}
                                                </div>
                                                <div className="text-gray-500">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Items */}
                                        {isExpanded && (
                                            <div className="pl-4 space-y-2 border-l-2 border-gray-700 ml-4 animate-slide-up">
                                                {groupTxs.map(t => (
                                                    <div 
                                                        key={t.id}
                                                        onDoubleClick={() => onEdit(t)}
                                                        className="flex justify-between items-center bg-gray-900/50 p-2 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-gray-400 truncate max-w-[150px]">{t.description || 'Без описания'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-2">
                                                            <span className={`text-xs font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                                {t.amount.toLocaleString()} {symbol}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                                                className="text-gray-600 hover:text-red-400 p-1"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                // Single Transaction (Normal Render)
                                const t = firstTx;
                                return (
                                    <div 
                                        key={t.id} 
                                        onDoubleClick={() => onEdit(t)}
                                        className="flex justify-between items-center bg-gray-800 hover:bg-gray-700 transition-colors p-3 rounded-xl border border-gray-700 cursor-pointer select-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {t.category.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-200">{t.category}</p>
                                                <p className="text-xs text-gray-500">{t.description || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {symbol}
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : (
                        selectedDayDue.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm bg-gray-800/30 rounded-xl border border-gray-700 border-dashed">
                                {t('cal.empty', settings.language)}
                            </div>
                        )
                    )}
                </div>
            </div>
        )}
        
        {/* Monthly Recap Button - Fixed at bottom of content or absolute if needed */}
        {hasMonthData && (
             <div className="fixed bottom-24 left-4 right-4 z-20">
                 <button 
                    onClick={() => setIsRecapOpen(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-4 rounded-2xl shadow-xl flex items-center justify-between group transition-all transform hover:scale-[1.02] active:scale-95"
                 >
                     <div className="flex items-center gap-3">
                         <div className="bg-white/20 p-2 rounded-xl">
                             <PlayCircle size={24} className="text-white fill-white/20" />
                         </div>
                         <div className="text-left">
                             <div className="font-bold text-white text-sm uppercase tracking-wide">Итоги месяца</div>
                             <div className="text-xs text-indigo-200">{getMonthName(currentDate)} в сторис</div>
                         </div>
                     </div>
                     <ChevronRight className="text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                 </button>
             </div>
        )}

        {isAddModalOpen && (
            <AddTransactionModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={onAddTransaction}
                defaultDate={selectedDate || undefined}
            />
        )}

        {isRecapOpen && (
            <MonthlyRecap 
                isOpen={isRecapOpen}
                onClose={() => setIsRecapOpen(false)}
                transactions={transactions} 
                monthDate={currentDate}
                settings={settings}
            />
        )}
    </div>
  );
};