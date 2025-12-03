
import React, { useEffect, useState, useMemo } from 'react';
import { Transaction, FinancialAdvice, BudgetStrategy, SavingsGoal, Settings, RecurringExpense, CategoryPlan, getCurrencySymbol, CategoryBucket } from '../types';
import { getBudgetAdvice } from '../services/geminiService';
import { Card } from './ui/Card';
import { Target, TrendingUp, RefreshCw, Settings as SettingsIcon, Plus, Wallet, Sparkles, CheckCircle, Calculator, Lock, ShieldAlert, Heart, ChevronDown, ChevronRight, Edit3, SlidersHorizontal, Info } from 'lucide-react';
import { AddGoalModal } from './AddGoalModal';
import { AddFundsModal } from './AddFundsModal';
import { RecurringExpenses } from './RecurringExpenses';
import { SavingsGoalCard } from './SavingsGoalCard';
import { OnboardingFlow } from './OnboardingFlow';

interface BudgetViewProps {
  transactions: Transaction[];
  strategy: BudgetStrategy;
  onUpdateStrategy: (s: BudgetStrategy) => void;
  savingsGoals: SavingsGoal[];
  onAddGoal: (g: SavingsGoal) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  settings: Settings;
  recurringExpenses: RecurringExpense[];
  onAddRecurring: (r: RecurringExpense) => void;
  onRemoveRecurring: (id: string) => void;
  onUpdateRecurring: (r: RecurringExpense) => void;
  categoryPlans: CategoryPlan[];
  onUpdatePlans: (p: CategoryPlan[]) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  isPremium: boolean;
  onOpenPremium: () => void;
  checkLimits: (type: 'goals') => boolean;
  onGoalCompleted?: (goal: SavingsGoal) => void;
  onSetupComplete?: (
      transactions: Transaction[], 
      categoryMap: Record<string, CategoryBucket>,
      strategy: BudgetStrategy,
      goals: SavingsGoal[],
      plans: CategoryPlan[]
  ) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ 
  transactions, 
  strategy, 
  onUpdateStrategy,
  savingsGoals,
  onAddGoal,
  onRemoveGoal,
  onUpdateGoal,
  settings,
  recurringExpenses,
  onAddRecurring,
  onRemoveRecurring,
  onUpdateRecurring,
  categoryPlans,
  onUpdatePlans,
  onAddTransaction,
  isPremium,
  onOpenPremium,
  checkLimits,
  onGoalCompleted,
  onSetupComplete
}) => {
  const [advice, setAdvice] = useState<FinancialAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [expandedBucket, setExpandedBucket] = useState<CategoryBucket | null>(null);
  
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  
  const symbol = getCurrencySymbol(settings.currency);

  const isSetupTrulyComplete = settings.isSetupComplete && 
                               settings.categoryMap && 
                               Object.keys(settings.categoryMap).length > 0;

  // If no category map but user is here, force setup (unless already open)
  useEffect(() => {
      if (!isSetupTrulyComplete && !isSetupModalOpen) {
          // Optional: Auto open or just show the big card as done in render
      }
  }, [isSetupTrulyComplete]);
  
  const monthlyTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const recurringTotal = recurringExpenses.reduce((sum, r) => sum + r.amount, 0);
    
  const baseIncome = strategy.projectedIncome || (monthlyIncome > 0 ? monthlyIncome : 0);

  // Calculate Bucket Targets based on Category Plans (Specific Amounts)
  const bucketTargets = useMemo(() => {
      const targets = { needs: 0, lifestyle: 0, goals: 0 };
      let hasPlans = false;
      
      categoryPlans.forEach(p => {
          const bucket = settings.categoryMap?.[p.category] || 'lifestyle';
          // Type guard for bucket
          if (bucket === 'needs' || bucket === 'goals' || bucket === 'lifestyle') {
              targets[bucket] += p.limit;
              hasPlans = true;
          }
      });

      // Fallback: Use percentages if no plans exist but strategy exists
      if (!hasPlans && baseIncome > 0) {
          targets.needs = Math.round(baseIncome * (strategy.needs / 100));
          targets.lifestyle = Math.round(baseIncome * (strategy.wants / 100));
          targets.goals = Math.round(baseIncome * (strategy.savings / 100));
      }

      return targets;
  }, [categoryPlans, settings.categoryMap, baseIncome, strategy]);

  const buckets = useMemo(() => {
      const b = {
          needs: { total: 0, categories: {} as Record<string, {spent: number, limit: number}> },
          lifestyle: { total: 0, categories: {} as Record<string, {spent: number, limit: number}> },
          goals: { total: 0, categories: {} as Record<string, {spent: number, limit: number}> }
      };

      // 1. Fill with planned categories first
      categoryPlans.forEach(plan => {
          const bucketKey = settings.categoryMap?.[plan.category] || 'lifestyle';
          const safeKey = (bucketKey === 'needs' || bucketKey === 'goals') ? bucketKey : 'lifestyle';
          
          if (!b[safeKey].categories[plan.category]) {
              b[safeKey].categories[plan.category] = { spent: 0, limit: plan.limit };
          } else {
              b[safeKey].categories[plan.category].limit = plan.limit;
          }
      });

      // 2. Add actual transactions
      monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
          const bucketKey = settings.categoryMap?.[t.category] || 'lifestyle';
          const safeKey = (bucketKey === 'needs' || bucketKey === 'goals') ? bucketKey : 'lifestyle';
          
          b[safeKey].total += t.amount;
          
          if (!b[safeKey].categories[t.category]) {
              b[safeKey].categories[t.category] = { spent: 0, limit: 0 };
          }
          b[safeKey].categories[t.category].spent += t.amount;
      });

      return b;
  }, [monthlyTransactions, settings.categoryMap, categoryPlans]);

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getBudgetAdvice(monthlyIncome, monthlyExpense, symbol, settings.language);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const handleAddFunds = (amount: number) => {
      if (selectedGoal) {
          const newAmount = (selectedGoal.savedAmount || 0) + amount;
          if (newAmount >= selectedGoal.amount && selectedGoal.savedAmount < selectedGoal.amount) {
              if (onGoalCompleted) {
                  onGoalCompleted({ ...selectedGoal, savedAmount: newAmount });
              }
          }
          onUpdateGoal({ ...selectedGoal, savedAmount: newAmount });
          onAddTransaction({
              amount: amount,
              category: 'Сбережения',
              type: 'expense',
              currency: settings.currency,
              description: `В копилку: ${selectedGoal.name}`,
              date: new Date().toISOString(),
              isManual: true
          });
      }
  };

  const openFundsModal = (goal: SavingsGoal) => {
      setSelectedGoal(goal);
      setIsFundsModalOpen(true);
  };

  const handleAddGoalClick = () => {
      setEditingGoal(null);
      if (checkLimits('goals')) {
          setIsGoalModalOpen(true);
      } else {
          onOpenPremium();
      }
  };

  const handleEditGoalClick = (goal: SavingsGoal) => {
      setEditingGoal(goal);
      setIsGoalModalOpen(true);
  };

  // Logic is Correct: Income - Actual Expense - Recurring
  const freeCashFlow = baseIncome - monthlyExpense - recurringTotal;

  const renderBucketCard = (type: CategoryBucket, title: string, target: number, icon: React.ReactNode, colorClass: string) => {
      const data = buckets[type];
      const spent = data.total;
      const pct = target > 0 ? (spent / target) * 100 : 0;
      const isExpanded = expandedBucket === type;
      
      return (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-3 transition-all">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750"
                onClick={() => setExpandedBucket(isExpanded ? null : type)}
              >
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-900 ${colorClass}`}>{icon}</div>
                      <div>
                          <div className="text-sm font-bold text-gray-200">{title}</div>
                          <div className="text-xs text-gray-500">
                             <span className="text-gray-300">{spent.toLocaleString()}</span> / {target.toLocaleString()} {symbol}
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="text-right">
                          <div className={`text-sm font-bold ${pct > 100 ? 'text-red-400' : 'text-gray-300'}`}>
                              {Math.round(pct)}%
                          </div>
                      </div>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-500"/> : <ChevronRight size={16} className="text-gray-500"/>}
                  </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1 bg-gray-900 w-full">
                  <div className={`h-full ${pct > 100 ? 'bg-red-500' : colorClass.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
              </div>

              {/* Subcategories */}
              {isExpanded && (
                  <div className="bg-gray-900/50 p-3 space-y-2 border-t border-gray-700 animate-slide-up">
                      {Object.entries(data.categories).map(([cat, s]) => {
                          const stats = s as { spent: number; limit: number };
                          const catPct = stats.limit > 0 ? (stats.spent / stats.limit) * 100 : 0;
                          return (
                            <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-xs items-center">
                                    <span className="text-gray-300">{cat}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{stats.spent.toLocaleString()}</span>
                                        <span className="text-gray-600"> / {stats.limit.toLocaleString()}</span>
                                    </div>
                                </div>
                                {stats.limit > 0 && (
                                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${catPct > 100 ? 'bg-red-500' : 'bg-gray-600'}`} 
                                            style={{ width: `${Math.min(100, catPct)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                          );
                      })}
                      {Object.keys(data.categories).length === 0 && (
                          <div className="text-xs text-gray-600 text-center py-2">Нет категорий</div>
                      )}
                  </div>
              )}
          </div>
      );
  };
  
  const handleSetupCompleteWrapper = (
      newTxs: Transaction[], 
      map: Record<string, CategoryBucket>, 
      newStrategy: BudgetStrategy, 
      newGoals: SavingsGoal[],
      newPlans: CategoryPlan[]
  ) => {
      if (onSetupComplete) {
          onSetupComplete(newTxs, map, newStrategy, newGoals, newPlans);
      }
      setIsSetupModalOpen(false);
  };

  // Structure Visualization Data
  const totalTarget = bucketTargets.needs + bucketTargets.lifestyle + bucketTargets.goals;
  const needsPct = totalTarget > 0 ? (bucketTargets.needs / totalTarget) * 100 : 0;
  const lifestylePct = totalTarget > 0 ? (bucketTargets.lifestyle / totalTarget) * 100 : 0;
  const goalsPct = totalTarget > 0 ? 100 - needsPct - lifestylePct : 0;

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            План
            </h2>
        </div>
        
        {isSetupTrulyComplete && (
            <button 
                onClick={() => setIsSetupModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 rounded-lg text-xs font-bold text-emerald-400 hover:bg-gray-700 border border-emerald-500/20 transition-colors"
            >
                <SlidersHorizontal size={14} />
                Настроить бюджет
            </button>
        )}
      </div>

      {!isSetupTrulyComplete ? (
          /* Needs Setup CTA */
          <div 
             onClick={() => setIsSetupModalOpen(true)}
             className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-6 rounded-2xl border border-indigo-500/50 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group mt-4"
          >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/30 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/50 animate-pulse">
                      <Target size={32} className="text-white" />
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-white mb-2">Настроить Фин. Модель</h3>
                      <p className="text-sm text-indigo-200 leading-relaxed">
                          Создайте структуру бюджета, укажите доход и цели, чтобы приложение начало работать на вас.
                      </p>
                  </div>
                  <button className="px-6 py-2 bg-white text-indigo-900 font-bold rounded-xl text-sm shadow-md">
                      Начать
                  </button>
              </div>
          </div>
      ) : (
          /* Standard Budget View */
          <>
            {/* Cash Flow Card */}
            <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm text-gray-400 flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-400"/> 
                        Свободный остаток
                    </h3>
                    <span className="text-xs text-gray-500">План</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <div className={`text-2xl font-bold ${freeCashFlow >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {freeCashFlow.toLocaleString()} {symbol}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 flex flex-col gap-0.5">
                            <span>Доход: {baseIncome.toLocaleString()}</span>
                            <span>Расходы: -{monthlyExpense.toLocaleString()}</span>
                            <span className="flex items-center gap-1 text-amber-500">
                                Кредиты/Подписки: -{recurringTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <button onClick={fetchAdvice} disabled={loadingAdvice} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                      <RefreshCw size={16} className={`${loadingAdvice ? 'animate-spin' : ''} text-emerald-400`} />
                    </button>
                </div>
            </Card>
            
            {/* 3 Buckets Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target size={16} /> Структура Бюджета
                </h3>

                {/* Structure Bar */}
                {totalTarget > 0 && (
                    <div className="mb-4">
                        <div className="flex h-3 rounded-full overflow-hidden w-full mb-2 bg-gray-800">
                            <div className="bg-emerald-500" style={{ width: `${needsPct}%` }}></div>
                            <div className="bg-amber-500" style={{ width: `${lifestylePct}%` }}></div>
                            <div className="bg-indigo-500" style={{ width: `${goalsPct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 px-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span>Обязательные {Math.round(needsPct)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span>Жизнь {Math.round(lifestylePct)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span>Цели {Math.round(goalsPct)}%</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Bucket Cards in requested order */}
                {renderBucketCard('needs', 'Обязательные', bucketTargets.needs, <ShieldAlert size={18}/>, 'text-emerald-400')}
                {renderBucketCard('lifestyle', 'Уровень жизни', bucketTargets.lifestyle, <Heart size={18}/>, 'text-amber-400')}
                {renderBucketCard('goals', 'Накопления (Цели)', bucketTargets.goals, <Target size={18}/>, 'text-indigo-400')}
            </div>
            
            <RecurringExpenses 
                expenses={recurringExpenses} 
                onAdd={onAddRecurring} 
                onRemove={onRemoveRecurring}
                onUpdate={onUpdateRecurring}
                settings={settings}
            />
            
            {/* Goals Section */}
            <Card className="relative overflow-hidden border-indigo-500/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10 mb-4">
                    <div>
                        <h3 className="text-indigo-200 text-sm font-medium mb-1">Ваши Цели</h3>
                        <div className="text-xs text-gray-400">План: {bucketTargets.goals.toLocaleString()} {symbol} / мес</div>
                    </div>
                    <button 
                        onClick={handleAddGoalClick}
                        className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-900/40 transition-transform active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                <div className="relative z-10 space-y-3">
                    {savingsGoals.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {savingsGoals.map(goal => {
                                // Find specific plan for this goal
                                const plan = categoryPlans.find(p => p.category === goal.name);
                                return (
                                    <SavingsGoalCard 
                                        key={goal.id} 
                                        goal={goal} 
                                        symbol={symbol}
                                        onAddFunds={openFundsModal}
                                        onRemove={onRemoveGoal}
                                        onEdit={handleEditGoalClick}
                                        plannedMonthlyAmount={plan ? plan.limit : 0}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-gray-900/30 rounded-xl border border-gray-700/30 border-dashed">
                            <p className="text-sm text-gray-400">Добавьте цель, чтобы начать копить.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Advice Section */}
            {advice && (
                <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="text-emerald-400" size={20} />
                        <h3 className="font-bold text-lg text-gray-100">Мнение ИИ</h3>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm leading-relaxed">{advice.message}</p>
                    
                    <div className="space-y-2">
                        {advice.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-800">
                            <div className="min-w-[4px] h-[4px] rounded-full bg-emerald-400 mt-1.5"></div>
                            {item}
                        </div>
                        ))}
                    </div>
                </div>
                </div>
            )}
          </>
      )}

      {/* Modals */}
      {isSetupModalOpen && (
          <OnboardingFlow 
            onComplete={handleSetupCompleteWrapper}
            settings={settings}
            onOpenPremium={onOpenPremium}
            onClose={() => setIsSetupModalOpen(false)}
          />
      )}

      <AddGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }} 
        onAdd={onAddGoal}
        onUpdate={onUpdateGoal}
        editingGoal={editingGoal}
      />
      
      <AddFundsModal
        isOpen={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        onAddFunds={handleAddFunds}
        goal={selectedGoal}
        symbol={symbol}
      />
    </div>
  );
};
