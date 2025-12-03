
import React, { useState } from 'react';
import { RecurringExpense, Settings, getCurrencySymbol } from '../types';
import { t } from '../utils/translations';
import { CalendarClock, Trash2, Plus, CreditCard, RefreshCw, Calendar, Check, X, ShoppingBag, Calculator } from 'lucide-react';
import { Card } from './ui/Card';

interface RecurringExpensesProps {
  expenses: RecurringExpense[];
  onAdd: (item: RecurringExpense) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: RecurringExpense) => void;
  settings: Settings;
}

export const RecurringExpenses: React.FC<RecurringExpensesProps> = ({ expenses, onAdd, onRemove, onUpdate, settings }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(''); // Monthly Payment
  const [totalDebt, setTotalDebt] = useState(''); // Total amount for loan
  const [type, setType] = useState<'subscription' | 'loan' | 'installment'>('subscription');
  const [months, setMonths] = useState('');
  const [paymentDay, setPaymentDay] = useState('');

  const symbol = getCurrencySymbol(settings.currency);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setAmount('');
    setTotalDebt('');
    setMonths('');
    setPaymentDay('');
    setType('subscription');
  };

  const handleEdit = (item: RecurringExpense) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(item.amount.toString());
    setType(item.type);
    setTotalDebt(item.totalDebt ? item.totalDebt.toString() : '');
    setMonths(item.monthsRemaining ? item.monthsRemaining.toString() : '');
    setPaymentDay(item.paymentDay ? item.paymentDay.toString() : '');
    setIsAdding(true);
  };

  // Logic: Amount (Monthly) * Months = Total Debt
  const handleAmountChange = (val: string) => {
      setAmount(val);
      if (val && months && (type === 'loan' || type === 'installment')) {
          const total = parseFloat(val) * parseFloat(months);
          setTotalDebt(total.toFixed(0));
      }
  };

  const handleMonthsChange = (val: string) => {
      setMonths(val);
      if (val && amount && (type === 'loan' || type === 'installment')) {
           const total = parseFloat(amount) * parseFloat(val);
           setTotalDebt(total.toFixed(0));
      }
  };

  const handleSubmit = () => {
    if (!name || !amount) return;

    const paymentDayNum = paymentDay ? parseInt(paymentDay, 10) : undefined;
    if (paymentDayNum && (paymentDayNum < 1 || paymentDayNum > 31)) {
        alert("День платежа должен быть от 1 до 31");
        return;
    }

    const data: RecurringExpense = {
      id: editingId || Date.now().toString(),
      name: name,
      amount: parseFloat(amount),
      totalDebt: totalDebt ? parseFloat(totalDebt) : undefined,
      type: type,
      monthsRemaining: (type === 'loan' || type === 'installment') ? parseInt(months) : undefined,
      paymentDay: paymentDayNum,
      active: true
    };

    if (editingId) {
        onUpdate(data);
    } else {
        onAdd(data);
    }
    resetForm();
  };

  const totalMonthly = expenses.reduce((sum, item) => sum + item.amount, 0);

  const getIcon = (t: string) => {
      if (t === 'loan') return <CreditCard size={16} />;
      if (t === 'installment') return <ShoppingBag size={16} />;
      return <RefreshCw size={16} />;
  };

  const getLabel = (type: string) => {
      if (type === 'loan') return t('recurring.loan', settings.language);
      if (type === 'installment') return t('recurring.installment', settings.language);
      return t('recurring.sub', settings.language);
  };

  return (
    <Card className="border-amber-500/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <CalendarClock size={18} className="text-amber-400" />
          {t('recurring.title', settings.language)}
        </h3>
        <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
          - {totalMonthly.toLocaleString()} {symbol}
        </span>
      </div>

      <div className="space-y-3">
        {expenses.map(item => (
          <div 
            key={item.id} 
            onDoubleClick={() => handleEdit(item)}
            className="flex justify-between items-center bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-colors select-none"
            title="Дважды кликните, чтобы изменить"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${item.type === 'loan' ? 'bg-red-500/10 text-red-400' : item.type === 'installment' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                 {getIcon(item.type)}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-200">{item.name}</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>{getLabel(item.type)}</span>
                    {item.monthsRemaining && <span>• {item.monthsRemaining} {t('recurring.months', settings.language)}</span>}
                    {item.paymentDay && (
                        <span className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
                            <Calendar size={10} /> {item.paymentDay}
                        </span>
                    )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right">
                   <div className="font-bold text-gray-300">{item.amount.toLocaleString()} {symbol}</div>
                   {item.totalDebt && (
                       <div className="text-[9px] text-gray-500">из {item.totalDebt.toLocaleString()} {symbol}</div>
                   )}
               </div>
               <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="text-gray-600 hover:text-red-400 p-1">
                 <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}

        {isAdding ? (
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-600 space-y-3 animate-fade-in">
             <div className="flex gap-1 p-1 bg-gray-900 rounded-lg">
                <button onClick={() => setType('subscription')} className={`flex-1 py-1 text-xs rounded ${type === 'subscription' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
                    {t('recurring.sub', settings.language)}
                </button>
                <button onClick={() => setType('loan')} className={`flex-1 py-1 text-xs rounded ${type === 'loan' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
                    {t('recurring.loan', settings.language)}
                </button>
                <button onClick={() => setType('installment')} className={`flex-1 py-1 text-xs rounded ${type === 'installment' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>
                    {t('recurring.installment', settings.language)}
                </button>
             </div>
             
             <input 
                placeholder="Название (Kaspi, Netflix...)" 
                className="w-full bg-gray-900 rounded p-2 text-sm text-white border border-gray-700"
                value={name} onChange={e => setName(e.target.value)}
             />
             
             {/* Row 1: Amount & Months (for loans) */}
             <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-[9px] text-gray-500 block mb-0.5">{t('recurring.monthly_pay', settings.language)}</label>
                    <input 
                        type="number"
                        placeholder="0" 
                        className="w-full bg-gray-900 rounded p-2 text-sm text-white border border-gray-700 font-bold"
                        value={amount} onChange={e => handleAmountChange(e.target.value)}
                    />
                </div>
                {(type === 'loan' || type === 'installment') && (
                    <div className="w-24">
                        <label className="text-[9px] text-gray-500 block mb-0.5">{t('recurring.term', settings.language)}</label>
                        <input 
                            type="number"
                            placeholder="12"
                            className="w-full bg-gray-900 rounded p-2 text-sm text-white border border-gray-700"
                            value={months} onChange={e => handleMonthsChange(e.target.value)}
                        />
                    </div>
                )}
             </div>

             {/* Row 2: Total Debt (Calculated) & Payment Day */}
             <div className="flex gap-2">
                 {(type === 'loan' || type === 'installment') ? (
                    <div className="flex-1">
                        <label className="text-[9px] text-gray-500 mb-0.5 flex items-center gap-1">
                            {t('recurring.total_debt', settings.language)} <Calculator size={10}/>
                        </label>
                        <input 
                            type="number"
                            placeholder="Авторасчет..."
                            className="w-full bg-gray-900/50 rounded p-2 text-sm text-gray-400 border border-gray-700"
                            value={totalDebt} 
                            onChange={e => setTotalDebt(e.target.value)}
                        />
                    </div>
                 ) : (
                    <div className="flex-1" /> // Spacer for subscription layout
                 )}

                 <div className="w-24">
                    <label className="text-[9px] text-gray-500 block mb-0.5">{t('recurring.payment_day', settings.language)}</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1-31"
                        className="w-full bg-gray-900 rounded p-2 text-sm text-white border border-gray-700"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                    />
                </div>
             </div>
             
             <div className="flex gap-2 mt-2">
                 <button onClick={handleSubmit} className="flex-1 bg-emerald-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 text-white hover:bg-emerald-500">
                    <Check size={16} /> {editingId ? t('save', settings.language) : t('add', settings.language)}
                 </button>
                 <button onClick={resetForm} className="px-4 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 text-white">
                    <X size={16} />
                 </button>
             </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-3 border border-dashed border-gray-600 rounded-xl text-gray-400 text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} />
            {t('recurring.add', settings.language)}
          </button>
        )}
      </div>
    </Card>
  );
};
