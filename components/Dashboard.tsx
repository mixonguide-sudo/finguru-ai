
import React, { useMemo, useState } from 'react';
import { Transaction, Settings, getCurrencySymbol, UserProfile, Investment } from '../types';
import { t } from '../utils/translations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { 
  ArrowUpCircle, ArrowDownCircle, Briefcase, Landmark, Bitcoin, TrendingUp as TrendingUpIcon, 
  Home, PiggyBank, Trash2, RefreshCw, Plus, Upload, 
  Utensils, Car, ShoppingBag, HeartPulse, Gamepad2, CircleHelp, Plane, Edit2,
  AlertTriangle, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from './ui/Card';
import { GamificationBar } from './GamificationBar';
import { convertCurrency } from '../services/currencyService';
import { toLocalISOString } from '../utils/dateUtils';

interface DashboardProps {
  transactions: Transaction[];
  settings: Settings;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  userProfile: UserProfile;
  onOpenHistory: () => void;
  isPremium: boolean;
  onOpenPremium: () => void;
  investments?: Investment[];
  onAddInvestment?: (inv: Investment) => void;
  onRemoveInvestment?: (id: string) => void;
  onEditInvestment?: (inv: Investment) => void;
  onRefreshInvestments?: () => void;
  openInvestModal?: () => void;
  onOpenAchievements: () => void;
  onTopUpInvestment?: (inv: Investment) => void;
  onOpenImport: () => void;
}

// ... (keep helper functions like getCategoryIcon, getCategoryEmoji same) ...
const getCategoryIcon = (categoryName: string, size: number = 14) => {
    switch (categoryName) {
        case 'Еда': return <Utensils size={size} />;
        case 'Транспорт': return <Car size={size} />;
        case 'Жилье': return <Home size={size} />;
        case 'Покупки': return <ShoppingBag size={size} />;
        case 'Здоровье': return <HeartPulse size={size} />;
        case 'Развлечения': return <Gamepad2 size={size} />;
        case 'Путешествия': return <Plane size={size} />;
        case 'Сбережения': return <PiggyBank size={size} />;
        default: return <CircleHelp size={size} />;
    }
};

const getCategoryEmoji = (categoryName: string) => {
    switch (categoryName) {
        case 'Еда': return '🍔';
        case 'Транспорт': return '🚕';
        case 'Жилье': return '🏠';
        case 'Покупки': return '🛍️';
        case 'Здоровье': return '💊';
        case 'Развлечения': return '🎮';
        case 'Путешествия': return '✈️';
        case 'Сбережения': return '💰';
        default: return '📝';
    }
};

type ChartPeriod = 'week' | 'month' | '6months' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  settings, 
  onDelete, 
  onEdit,
  userProfile, 
  onOpenHistory,
  isPremium,
  onOpenPremium,
  investments = [],
  onAddInvestment,
  onRemoveInvestment,
  onEditInvestment,
  onRefreshInvestments,
  openInvestModal,
  onOpenAchievements,
  onTopUpInvestment,
  onOpenImport
}) => {
  const symbol = getCurrencySymbol(settings.currency);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  
  // Chart Filter State
  const [period, setPeriod] = useState<ChartPeriod>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleRefresh = async () => {
      if (onRefreshInvestments) {
          setIsRefreshing(true);
          await onRefreshInvestments();
          setIsRefreshing(false);
      }
  };

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  const KZT_THRESHOLD = 100000;
  const lowBalanceThreshold = convertCurrency(KZT_THRESHOLD, 'KZT', settings.currency);
  const isLowBalance = balance < lowBalanceThreshold && balance > 0;

  const totalAssets = investments.reduce((acc, inv) => {
      return acc + convertCurrency(inv.amount, inv.currency, settings.currency);
  }, 0);

  const monthlyPassiveIncome = investments.reduce((acc, inv) => {
      let monthlyIncome = 0;
      if (inv.revenue) {
          monthlyIncome = inv.revenue;
      } else if (inv.apy) {
          monthlyIncome = (inv.amount * (inv.apy / 100)) / 12;
      }
      return acc + convertCurrency(monthlyIncome, inv.currency, settings.currency);
  }, 0);

  // Prepare Chart Data based on selected Period
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    let daysCount = 7;
    let isMonthlyAggregation = false;

    if (period === 'month') daysCount = 30;
    if (period === '6months') {
        isMonthlyAggregation = true;
        daysCount = 6; // 6 months
    }
    
    if (period === 'custom') {
        if (customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // If range > 31 days, switch to monthly aggregation automatically for readability
            if (daysCount > 31) isMonthlyAggregation = true;
        } else {
            return []; // Waiting for input
        }
    }

    if (isMonthlyAggregation) {
        // Aggregate by Month
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(1); // Set to first of month to avoid overflow issues
            d.setMonth(d.getMonth() - i);
            
            const monthLabel = d.toLocaleDateString(settings.language, { month: 'short' });
            
            const monthTransactions = transactions.filter(t => {
                if (t.type !== 'expense') return false;
                const tDate = new Date(t.date);
                return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            });

            const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            data.push({ day: monthLabel, amount: total, topCat: null }); // No top cat for monthly view yet
        }
    } else {
        // Aggregate by Day
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(today);
            if (period === 'custom' && customStart) {
                const start = new Date(customStart);
                d.setTime(start.getTime());
                d.setDate(d.getDate() + (daysCount - 1 - i));
            } else {
                d.setDate(today.getDate() - i);
            }
            
            const dayLabel = d.toLocaleDateString(settings.language, { weekday: 'short', day: 'numeric' });
            
            const dayTransactions = transactions.filter(t => {
                if (t.type !== 'expense') return false;
                const tDate = new Date(t.date);
                return tDate.getDate() === d.getDate() && 
                       tDate.getMonth() === d.getMonth() && 
                       tDate.getFullYear() === d.getFullYear();
            });

            const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

            // Find top category
            const catMap: Record<string, number> = {};
            dayTransactions.forEach(t => {
                catMap[t.category] = (catMap[t.category] || 0) + t.amount;
            });
            const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

            data.push({ 
                day: dayLabel, 
                amount: dayTotal, 
                topCat: topCategory ? topCategory[0] : null
            });
        }
    }
    return data;
  }, [transactions, settings.language, period, customStart, customEnd]);

  const recentTransactions = transactions.slice(0, 5);

  const getAssetIcon = (type: string) => {
      switch(type) {
          case 'crypto': return <Bitcoin size={18} />;
          case 'stocks': return <TrendingUpIcon size={18} />;
          case 'property': return <Home size={18} />;
          case 'other': return <PiggyBank size={18} />;
          default: return <Landmark size={18} />;
      }
  };

  const CustomBarLabel = (props: any) => {
    const { x, y, width, value, payload } = props;
    if (value === 0 || !payload) return null;

    const formattedVal = value >= 1000 
        ? `${(value / 1000).toFixed(1).replace('.0', '')}k` 
        : value;

    return (
      <g>
        {payload.topCat && (
            <text x={x + width / 2} y={y - 25} textAnchor="middle" fontSize={16}>
                {getCategoryEmoji(payload.topCat)}
            </text>
        )}
        <text x={x + width / 2} y={y - 5} fill="#ffffff" textAnchor="middle" fontSize={10} fontWeight="bold" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}>
            {formattedVal}
        </text>
      </g>
    );
  };
  
  const hasChartData = chartData.some(d => d.amount > 0);

  const displayedInvestments = showAllAssets ? investments : investments.slice(0, 3);

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in relative z-10">
      <GamificationBar profile={userProfile} onOpenAchievements={onOpenAchievements} />

      {isLowBalance && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3 animate-slide-up">
              <div className="bg-orange-500/20 p-2 rounded-full text-orange-400 shrink-0">
                  <AlertTriangle size={18} />
              </div>
              <div>
                  <h4 className="text-orange-200 font-bold text-sm">Низкий баланс</h4>
                  <p className="text-orange-200/70 text-xs mt-0.5">
                      Ваш остаток менее {lowBalanceThreshold.toLocaleString()} {symbol}. Будьте осторожны.
                  </p>
              </div>
          </div>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-900 to-gray-900 border-indigo-500/30">
        <div className="flex justify-between items-start mb-4 relative">
            <div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{t('balance', settings.language)}</h3>
                <div className="text-3xl font-bold text-white tracking-tight">
                {balance.toLocaleString()} {symbol}
                </div>
            </div>
            <button 
                onClick={onOpenImport}
                className="absolute right-0 top-0 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20 flex items-center gap-1.5 shadow-sm active:scale-95"
            >
                <Upload size={14} />
                <span className="text-xs font-bold">Импорт</span>
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3 border border-gray-700/50">
            <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 shrink-0"><ArrowUpCircle size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{t('income', settings.language)}</p>
              <p className="font-bold text-emerald-400 text-sm truncate">+{income.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-3 border border-gray-700/50">
            <div className="bg-red-500/20 p-2 rounded-full text-red-400 shrink-0"><ArrowDownCircle size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{t('expense', settings.language)}</p>
              <p className="font-bold text-red-400 text-sm truncate">-{expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Chart Section with Filters */}
      <div className="w-full mt-4 mb-12 pb-6 border-b border-gray-800"> 
         <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="text-sm font-bold text-gray-400">Расходы</h3>
             
             {/* Period Filter Buttons */}
             <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                 <button 
                    onClick={() => { setPeriod('week'); setShowCustomPicker(false); }} 
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${period === 'week' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                 >
                    Нед
                 </button>
                 <button 
                    onClick={() => { setPeriod('month'); setShowCustomPicker(false); }} 
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${period === 'month' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                 >
                    Мес
                 </button>
                 <button 
                    onClick={() => { setPeriod('6months'); setShowCustomPicker(false); }} 
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${period === '6months' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                 >
                    6 Мес
                 </button>
                 <button 
                    onClick={() => { setPeriod('custom'); setShowCustomPicker(!showCustomPicker); }} 
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${period === 'custom' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                 >
                    <Calendar size={12} />
                 </button>
             </div>
         </div>

         {/* Custom Date Picker */}
         {showCustomPicker && period === 'custom' && (
             <div className="bg-gray-800/50 p-2 rounded-lg mb-4 flex gap-2 animate-fade-in border border-gray-700">
                 <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white outline-none w-full"
                 />
                 <span className="text-gray-500 self-center">-</span>
                 <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white outline-none w-full"
                 />
             </div>
         )}
         
         <div className="h-64 w-full relative">
            {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 40, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#374151" opacity={0.3} strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="day" 
                        stroke="#4b5563" 
                        tick={{fill: '#9ca3af', fontSize: 10}} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval={period === 'month' ? 4 : 0} // Skip labels for month view to fit
                    />
                    <YAxis hide={true} domain={[0, 'dataMax + 1000']} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#f87171' : '#374151'} />
                    ))}
                    <LabelList dataKey="amount" content={<CustomBarLabel />} />
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gray-800/30 rounded-xl border border-gray-700/30 border-dashed">
                    <TrendingUpIcon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Нет данных за этот период</p>
                </div>
            )}
         </div>
      </div>

      {/* Assets & Recent (No changes below this) */}
      <div className="space-y-3">
          <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-300 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-400" />
                  {t('assets.title', settings.language)}
              </h3>
              <div className="flex gap-2">
                  <button 
                     onClick={handleRefresh}
                     disabled={isRefreshing}
                     className={`p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                  >
                      <RefreshCw size={16} />
                  </button>
                  <button 
                      onClick={openInvestModal}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                      <Plus size={14} /> {t('add', settings.language)}
                  </button>
              </div>
          </div>

          <Card className="border-blue-500/20">
              <div className="flex justify-between items-end mb-4">
                  <div>
                      <p className="text-xs text-gray-400 mb-1">{t('assets.total', settings.language)}</p>
                      <p className="text-2xl font-bold text-white">{totalAssets.toLocaleString()} {symbol}</p>
                  </div>
                  {monthlyPassiveIncome > 0 && (
                      <div className="text-right">
                          <p className="text-[10px] text-gray-500 mb-0.5">{t('assets.passive', settings.language)}</p>
                          <p className="text-sm font-bold text-emerald-400">+{Math.round(monthlyPassiveIncome).toLocaleString()} / {t('assets.mo', settings.language)}</p>
                      </div>
                  )}
              </div>
              
              {investments.length > 0 ? (
                  <div className="space-y-2">
                      {displayedInvestments.map(inv => (
                          <div 
                              key={inv.id} 
                              className="bg-gray-900/50 p-3 rounded-xl flex items-center justify-between border border-gray-800 transition-colors"
                          >
                             <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg ${inv.type === 'crypto' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                     {getAssetIcon(inv.type)}
                                 </div>
                                 <div>
                                     <div className="font-bold text-sm text-gray-200">{inv.name}</div>
                                     <div className="text-[10px] text-gray-500 flex gap-2">
                                         {inv.type === 'stocks' && inv.ticker && <span>{inv.ticker}</span>}
                                         {inv.quantity && <span>{inv.quantity} шт.</span>}
                                     </div>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="text-right mr-1">
                                     <div className="font-bold text-gray-200 text-sm">
                                         {convertCurrency(inv.amount, inv.currency, settings.currency).toLocaleString()} {symbol}
                                     </div>
                                     {inv.currentPrice && inv.buyPrice && (
                                         <div className={`text-[10px] font-bold ${inv.currentPrice >= inv.buyPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                                             {((inv.currentPrice - inv.buyPrice) / inv.buyPrice * 100).toFixed(1)}%
                                         </div>
                                     )}
                                 </div>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); onEditInvestment && onEditInvestment(inv); }}
                                     className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700"
                                     title="Изменить"
                                 >
                                     <Edit2 size={14} />
                                 </button>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); onTopUpInvestment && onTopUpInvestment(inv); }}
                                     className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                                     title="Пополнить"
                                 >
                                     <Plus size={14} />
                                 </button>
                             </div>
                          </div>
                      ))}
                      {investments.length > 3 && (
                          <button 
                              onClick={() => setShowAllAssets(!showAllAssets)}
                              className="w-full py-2 text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                          >
                              {showAllAssets ? (
                                  <>Свернуть <ChevronUp size={12} /></>
                              ) : (
                                  <>Показать все ({investments.length}) <ChevronDown size={12} /></>
                              )}
                          </button>
                      )}
                  </div>
              ) : (
                  <div className="text-center py-4 bg-gray-900/30 rounded-xl border border-gray-700/30 border-dashed">
                      <p className="text-xs text-gray-500">Добавьте активы для отслеживания капитала</p>
                  </div>
              )}
          </Card>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                {t('recent', settings.language)}
            </h3>
            <button onClick={onOpenHistory} className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                {t('history_btn', settings.language)}
            </button>
        </div>

        {recentTransactions.length > 0 ? (
            <div className="space-y-3">
            {recentTransactions.map((t) => (
                <div 
                key={t.id} 
                onClick={() => onEdit(t)}
                className="flex justify-between items-center bg-gray-800 p-3 rounded-2xl border border-gray-700/50 shadow-sm hover:bg-gray-750 transition-all active:scale-[0.98]"
                >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {getCategoryIcon(t.category)}
                    </div>
                    <div>
                    <p className="font-bold text-sm text-gray-200">{t.category}</p>
                    <p className="text-xs text-gray-500 max-w-[120px] truncate">{t.description || t.date.split('T')[0]}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} {symbol}
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                        className="text-gray-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 border-dashed">
                <p className="text-sm">Нет операций</p>
                <p className="text-xs mt-1">Нажмите "+" чтобы добавить</p>
            </div>
        )}
      </div>
    </div>
  );
};
