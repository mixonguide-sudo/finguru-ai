
import React, { useState } from 'react';
import { CategoryPlan, Transaction, Settings, CATEGORIES, getCurrencySymbol } from '../types';
import { t } from '../utils/translations';
import { predictCategoryBudget } from '../services/geminiService';
import { Card } from './ui/Card';
import { Sparkles, Save } from 'lucide-react';

interface CategoryPlanningProps {
  plans: CategoryPlan[];
  transactions: Transaction[];
  onUpdatePlans: (plans: CategoryPlan[]) => void;
  settings: Settings;
}

export const CategoryPlanning: React.FC<CategoryPlanningProps> = ({ plans, transactions, onUpdatePlans, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPlans, setLocalPlans] = useState(plans);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const symbol = getCurrencySymbol(settings.currency);

  // Calculate current month actuals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const actuals = transactions
    .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
    })
    .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

  const handleAiPredict = async () => {
    setLoadingAi(true);
    // Pass language setting to the prediction service
    const suggestions = await predictCategoryBudget(transactions, symbol, settings.language);
    setLoadingAi(false);
    if (suggestions && suggestions.length > 0) {
        setLocalPlans(suggestions);
        onUpdatePlans(suggestions);
        setIsEditing(true);
    }
  };

  const save = () => {
    onUpdatePlans(localPlans);
    setIsEditing(false);
  };

  const getLimit = (cat: string) => {
      return localPlans.find(p => p.category === cat)?.limit || 0;
  };

  const updateLimit = (cat: string, val: number) => {
      const exists = localPlans.find(p => p.category === cat);
      if (exists) {
          setLocalPlans(localPlans.map(p => p.category === cat ? {...p, limit: val} : p));
      } else {
          setLocalPlans([...localPlans, { category: cat, limit: val }]);
      }
  };

  return (
    <Card>
       <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-200">{t('plan.title', settings.language)}</h3>
            <div className="flex gap-2">
                {!isEditing && (
                    <button 
                        onClick={handleAiPredict}
                        disabled={loadingAi}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 shadow-lg shadow-purple-900/30"
                    >
                       <Sparkles size={12} className={loadingAi ? 'animate-spin' : ''}/>
                       {loadingAi ? '...' : 'AI'}
                    </button>
                )}
                <button 
                    onClick={() => isEditing ? save() : setIsEditing(true)}
                    className={`px-3 py-1 rounded text-xs font-bold ${isEditing ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                   {isEditing ? t('save', settings.language) : 'Edit'}
                </button>
            </div>
       </div>

       <div className="space-y-4">
          {CATEGORIES.expense.map(cat => {
              const actual = actuals[cat] || 0;
              const limit = getLimit(cat);
              const percent = limit > 0 ? Math.min(100, (actual / limit) * 100) : 0;
              let color = 'bg-emerald-500';
              if (percent > 70) color = 'bg-amber-500';
              if (percent >= 100) color = 'bg-red-500';

              return (
                  <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300 font-medium">{cat}</span>
                          {isEditing ? (
                              <input 
                                type="number" 
                                className="w-20 bg-gray-900 border border-gray-700 rounded px-1 text-right"
                                value={limit}
                                onChange={(e) => updateLimit(cat, parseFloat(e.target.value) || 0)}
                              />
                          ) : (
                              <div className="flex gap-2">
                                  <span className="text-gray-500">{actual.toLocaleString()} / </span>
                                  <span className="font-bold text-white">{limit.toLocaleString()} {symbol}</span>
                              </div>
                          )}
                      </div>
                      {!isEditing && (
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
                          </div>
                      )}
                      {!isEditing && limit > 0 && (
                          <div className="text-[10px] text-right mt-0.5 text-gray-500">
                              {limit - actual > 0 
                                ? `${t('plan.left', settings.language)} ${(limit - actual).toLocaleString()} ${symbol}` 
                                : 'Превышение!'}
                          </div>
                      )}
                  </div>
              );
          })}
       </div>
    </Card>
  );
};
