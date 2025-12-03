
import React, { useState } from 'react';
import { X, Sparkles, Crown, Zap, BrainCircuit, Target, ChevronDown, Send } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onBuy }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const features = [
    { 
      icon: <BrainCircuit className="text-purple-400" size={24} />, 
      title: "Безлимитный AI Ассистент",
      desc: "Общайтесь с финансовым советником без ограничений. Спрашивайте советы, анализируйте траты и стройте прогнозы в любое время."
    },
    { 
      icon: <Zap className="text-blue-400" size={24} />, 
      title: "Безлимитный разбор СМС",
      desc: "Копируйте уведомления от банка или загружайте скриншоты пачками. ИИ автоматически распознает сумму, категорию и продавца."
    },
    { 
      icon: <Sparkles className="text-amber-400" size={24} />, 
      title: "Авто-стратегия бюджета",
      desc: "ИИ анализирует ваши прошлые траты и автоматически строит идеальную стратегию 50/30/20, адаптированную под ваш образ жизни."
    },
    { 
      icon: <Target className="text-emerald-400" size={24} />, 
      title: "Неограниченные цели",
      desc: "Создавайте сколько угодно целей накопления (на машину, отпуск, обучение) и отслеживайте прогресс с красивой визуализацией."
    },
    { 
      icon: <Crown className="text-yellow-400" size={24} />, 
      title: "Значок PRO в профиле",
      desc: "Выделитесь среди пользователей уникальным золотым значком в таблице лидеров и в профиле."
    },
  ];

  const toggleFeature = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleContactAdmin = () => {
    window.open('https://t.me/mainsloww', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-sm rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-600/20 to-transparent pointer-events-none" />

        <div className="p-6 pb-0 relative z-10 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30">
               <Crown size={32} className="text-amber-400 fill-amber-400" />
            </div>
            <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <h2 className="text-2xl font-black text-white mb-1">Upgrade to PRO</h2>
          <p className="text-gray-400 text-xs mb-4">
            Нажмите на пункты ниже, чтобы узнать подробности.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar space-y-3">
            {features.map((feat, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <button 
                  key={idx} 
                  onClick={() => toggleFeature(idx)}
                  className={`w-full text-left bg-gray-800/50 p-3 rounded-xl border transition-all duration-300 ${isExpanded ? 'border-amber-500/50 bg-gray-800' : 'border-gray-700/50 hover:bg-gray-800'}`}
                >
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      {feat.icon}
                      <span className={`text-sm font-bold ${isExpanded ? 'text-white' : 'text-gray-300'}`}>{feat.title}</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <p className="text-xs text-gray-400 leading-relaxed pl-9">
                      {feat.desc}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        <div className="p-6 pt-2 relative z-10 shrink-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent space-y-3">
             <button 
                onClick={onBuy}
                className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-orange-900/40 flex items-center justify-center gap-2"
             >
               <Sparkles size={18} fill="white" />
               Оформить Premium
             </button>
             
             <button 
                onClick={handleContactAdmin}
                className="w-full py-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
             >
                <Send size={14} />
                Написать администратору (@mainsloww)
             </button>
        </div>
      </div>
    </div>
  );
};
