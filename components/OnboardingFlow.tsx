import React, { useState, useMemo } from 'react';
import { Transaction, Settings, CategoryBucket, BudgetStrategy, getCurrencySymbol, SavingsGoal, CategoryPlan, CATEGORIES } from '../types';
import { Plus, Trash2, ArrowRight, ArrowLeft, Target, Heart, ShieldAlert, Check, X } from 'lucide-react';
import { toLocalISOString } from '../utils/dateUtils';

interface OnboardingFlowProps {
  onComplete: (
      transactions: Transaction[], 
      categoryMap: Record<string, CategoryBucket>,
      strategy: BudgetStrategy,
      goals: SavingsGoal[],
      plans: CategoryPlan[]
  ) => void;
  settings: Settings;
  onOpenPremium: () => void;
  onClose?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, settings, onOpenPremium, onClose }) => {
  const [step, setStep] = useState(1);
  const symbol = getCurrencySymbol(settings.currency);

  // Step 1: Income
  const [income, setIncome] = useState<string>('');
  
  // Step 2: Fixed Expenses (Needs)
  const [fixedExpenses, setFixedExpenses] = useState<{name: string, amount: number}[]>([]);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Step 3: Strategy
  const [strategy, setStrategy] = useState<BudgetStrategy>({ needs: 50, wants: 30, savings: 20 });

  // Step 4: Goals
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const addFixed = () => {
      if(newName && newAmount) {
          setFixedExpenses([...fixedExpenses, { name: newName, amount: parseFloat(newAmount) }]);
          setNewName('');
          setNewAmount('');
      }
  };

  const removeFixed = (idx: number) => {
      setFixedExpenses(fixedExpenses.filter((_, i) => i !== idx));
  };

  const addGoal = () => {
      if(newGoalName && newGoalAmount) {
          const g: SavingsGoal = {
              id: Date.now().toString() + Math.random(),
              name: newGoalName,
              amount: parseFloat(newGoalAmount),
              savedAmount: 0,
              createdAt: toLocalISOString(new Date())
          };
          setGoals([...goals, g]);
          setNewGoalName('');
          setNewGoalAmount('');
      }
  };

  const removeGoal = (id: string) => {
      setGoals(goals.filter(g => g.id !== id));
  };

  const calculateStrategy = () => {
      // Simple logic to adjust needs based on fixed expenses ratio
      const inc = parseFloat(income);
      const fixedTotal = fixedExpenses.reduce((sum, i) => sum + i.amount, 0);
      
      if (inc > 0) {
          let needsPct = Math.round((fixedTotal / inc) * 100);
          if (needsPct < 50) needsPct = 50; 
          if (needsPct > 80) needsPct = 80; // Cap at 80%

          const remaining = 100 - needsPct;
          const savingsPct = Math.round(remaining * 0.4); // 20% of total usually, let's say 40% of remaining
          const wantsPct = 100 - needsPct - savingsPct;

          setStrategy({ needs: needsPct, wants: wantsPct, savings: savingsPct, projectedIncome: inc });
      }
  };

  // Trigger calculation when entering strategy step
  useMemo(() => {
      if (step === 3) calculateStrategy();
  }, [step]);

  const handleFinish = () => {
      const inc = parseFloat(income) || 0;
      const categoryMap: Record<string, CategoryBucket> = {};
      const newPlans: CategoryPlan[] = [];
      const newTx: Transaction[] = [];

      // Map fixed expenses
      fixedExpenses.forEach(e => {
          categoryMap[e.name] = 'needs';
          // Create a plan for it
          newPlans.push({ category: e.name, limit: e.amount });
      });

      // Default needs mapping
      categoryMap['Жилье'] = 'needs';
      categoryMap['Транспорт'] = 'needs';
      categoryMap['Еда'] = 'needs';
      categoryMap['Здоровье'] = 'needs';

      // Default wants mapping
      categoryMap['Развлечения'] = 'lifestyle';
      categoryMap['Покупки'] = 'lifestyle';
      categoryMap['Путешествия'] = 'lifestyle';

      // Goals mapping
      goals.forEach(g => {
          categoryMap[g.name] = 'goals';
          // Plan for goal = (Amount / 12) or remaining budget? 
          // Let's set monthly contribution based on Strategy Savings % / number of goals
          const monthlySavingsBudget = inc * (strategy.savings / 100);
          const perGoal = Math.round(monthlySavingsBudget / (goals.length || 1));
          newPlans.push({ category: g.name, limit: perGoal });
      });

      onComplete(
          newTx,
          categoryMap,
          { ...strategy, projectedIncome: inc },
          goals,
          newPlans
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 p-4 animate-fade-in">
        <div className="w-full max-w-lg bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Настройка Фин. Модели</h2>
                    <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                        ))}
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 bg-gray-700 rounded-full text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {step === 1 && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Ваш Доход</h3>
                            <p className="text-gray-400 text-sm">Укажите средний ежемесячный доход. Это база для расчетов.</p>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-2">Сумма в месяц ({symbol})</label>
                            <input 
                                type="number" 
                                value={income}
                                onChange={e => setIncome(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-2xl font-bold text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={32} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Обязательные расходы</h3>
                            <p className="text-gray-400 text-sm">Аренда, кредиты, коммуналка. То, что нужно платить железно.</p>
                        </div>

                        <div className="space-y-3">
                            {fixedExpenses.map((ex, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
                                    <span className="font-medium text-white">{ex.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold">{ex.amount.toLocaleString()} {symbol}</span>
                                        <button onClick={() => removeFixed(idx)} className="text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                placeholder="Название (Аренда)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="flex-[2] bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none"
                            />
                            <input 
                                type="number"
                                placeholder="Сумма"
                                value={newAmount}
                                onChange={e => setNewAmount(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none"
                            />
                            <button onClick={addFixed} className="bg-emerald-600 p-3 rounded-xl text-white hover:bg-emerald-500">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="text-center">
                             <h3 className="text-xl font-bold text-white mb-2">Ваша Стратегия</h3>
                             <p className="text-gray-400 text-sm">Мы рассчитали идеальные пропорции. Можете подкорректировать.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Needs */}
                            <div className="bg-gray-900 p-4 rounded-xl border border-emerald-500/30">
                                <div className="flex justify-between mb-2">
                                    <span className="text-emerald-400 font-bold flex items-center gap-2"><ShieldAlert size={16}/> Нужды (Needs)</span>
                                    <span className="text-white font-bold">{strategy.needs}%</span>
                                </div>
                                <input 
                                    type="range" min="30" max="90" 
                                    value={strategy.needs} 
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value);
                                        const remaining = 100 - n;
                                        setStrategy({ ...strategy, needs: n, wants: Math.round(remaining * 0.6), savings: Math.round(remaining * 0.4) });
                                    }}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {Math.round(parseFloat(income || '0') * (strategy.needs / 100)).toLocaleString()} {symbol}
                                </div>
                            </div>

                             {/* Wants */}
                             <div className="bg-gray-900 p-4 rounded-xl border border-amber-500/30">
                                <div className="flex justify-between mb-2">
                                    <span className="text-amber-400 font-bold flex items-center gap-2"><Heart size={16}/> Жизнь (Wants)</span>
                                    <span className="text-white font-bold">{strategy.wants}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max={100 - strategy.needs} 
                                    value={strategy.wants} 
                                    onChange={(e) => {
                                        const w = parseInt(e.target.value);
                                        setStrategy({ ...strategy, wants: w, savings: 100 - strategy.needs - w });
                                    }}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {Math.round(parseFloat(income || '0') * (strategy.wants / 100)).toLocaleString()} {symbol}
                                </div>
                            </div>

                             {/* Savings */}
                             <div className="bg-gray-900 p-4 rounded-xl border border-blue-500/30">
                                <div className="flex justify-between mb-2">
                                    <span className="text-blue-400 font-bold flex items-center gap-2"><Target size={16}/> Цели (Savings)</span>
                                    <span className="text-white font-bold">{strategy.savings}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-lg overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${strategy.savings}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {Math.round(parseFloat(income || '0') * (strategy.savings / 100)).toLocaleString()} {symbol}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-slide-up">
                         <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target size={32} className="text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">На что копим?</h3>
                            <p className="text-gray-400 text-sm">Добавьте финансовые цели, чтобы мы зарезервировали под них бюджет.</p>
                        </div>

                         <div className="space-y-3">
                            {goals.map((g) => (
                                <div key={g.id} className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-700">
                                    <span className="font-medium text-white">{g.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold">{g.amount.toLocaleString()} {symbol}</span>
                                        <button onClick={() => removeGoal(g.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                placeholder="Цель (Отпуск)"
                                value={newGoalName}
                                onChange={e => setNewGoalName(e.target.value)}
                                className="flex-[2] bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none"
                            />
                            <input 
                                type="number"
                                placeholder="Сумма"
                                value={newGoalAmount}
                                onChange={e => setNewGoalAmount(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none"
                            />
                            <button onClick={addGoal} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-between gap-4">
                {step > 1 ? (
                     <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                        Назад
                    </button>
                ) : (
                    <div></div>
                )}
               
                {step < 4 ? (
                    <button 
                        onClick={handleNext} 
                        disabled={step === 1 && !income}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white flex items-center justify-center gap-2"
                    >
                        Далее <ArrowRight size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish} 
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
                    >
                        Завершить <Check size={20} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};