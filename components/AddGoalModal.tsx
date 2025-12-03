

import React, { useState, useEffect } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { SavingsGoal } from '../types';
import { toLocalISOString } from '../utils/dateUtils';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: SavingsGoal) => void;
  onUpdate?: (goal: SavingsGoal) => void;
  editingGoal?: SavingsGoal | null;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd, onUpdate, editingGoal }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (editingGoal) {
            setName(editingGoal.name);
            setAmount(editingGoal.amount.toString());
            if (editingGoal.targetDate) {
                setTargetDate(editingGoal.targetDate.split('T')[0]);
            } else {
                setTargetDate('');
            }
        } else {
            setName('');
            setAmount('');
            setTargetDate('');
        }
    }
  }, [isOpen, editingGoal]);

  const handleSubmit = () => {
    if (!name || !amount) return;
    
    const goalData = {
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      name,
      amount: parseFloat(amount),
      savedAmount: editingGoal ? editingGoal.savedAmount : 0,
      createdAt: editingGoal ? editingGoal.createdAt : toLocalISOString(new Date()),
      targetDate: targetDate ? toLocalISOString(new Date(targetDate)) : undefined
    };

    if (editingGoal && onUpdate) {
        onUpdate(goalData);
    } else {
        onAdd(goalData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-gray-700 shadow-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-indigo-400" />
            {editingGoal ? 'Изменить цель' : 'Новая цель'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">На что копим?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Например: Новый iPhone"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Сколько нужно (₸)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="500000"
            />
          </div>

          <div>
              <label className="block text-xs text-gray-500 mb-1">Дата цели (необязательно)</label>
              <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-3 text-gray-500 pointer-events-none" />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-9 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                  />
              </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !amount}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50"
          >
            {editingGoal ? 'Сохранить изменения' : 'Добавить цель'}
          </button>
        </div>
      </div>
    </div>
  );
};