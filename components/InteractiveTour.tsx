
import React from 'react';
import { ArrowDown, CheckCircle, Wallet, Bot, PieChart, LayoutDashboard } from 'lucide-react';
import { t } from '../utils/translations';
import { Settings } from '../types';

interface InteractiveTourProps {
  step: number;
  onNext: () => void;
  onFinish: () => void;
  settings?: Settings; // Added settings
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ step, onNext, onFinish, settings }) => {
  // Increased Z-Index to be above modals (which are z-50 or z-60)
  const overlayStyle = "fixed inset-0 z-[90] bg-black/70 pointer-events-none transition-opacity duration-500";
  const highlightBoxStyle = "fixed z-[95] border-2 border-emerald-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] pointer-events-none transition-all duration-500 ease-in-out";
  
  // Safe card style that stays within screen bounds (left-4 right-4)
  const cardStyle = "fixed z-[100] bg-gray-900 border border-emerald-500/30 p-5 rounded-2xl shadow-2xl left-4 right-4 mx-auto max-w-sm animate-slide-up";
  
  // Fallback language
  const lang = settings?.language || 'ru';

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome Modal
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-3xl border border-gray-700 p-6 max-w-sm text-center animate-bounce-in shadow-2xl">
               <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                   <Wallet size={32} className="text-white" />
               </div>
               <h2 className="text-2xl font-black text-white mb-2">{t('tour.welcome', lang)}</h2>
               <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                   Это не просто трекер расходов. Это ваша финансовая игра. Давайте быстро настроим всё!
               </p>
               <button onClick={onNext} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-transform active:scale-95">
                   {t('tour.start', lang)}
               </button>
            </div>
          </div>
        );

      case 1: // Point to Add Button (Bottom Center)
        return (
          <>
            <div className={`${highlightBoxStyle} bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-emerald-500/50`} />
            <div className={`${cardStyle} bottom-36 text-center`}>
                <div className="flex justify-center mb-2 animate-bounce">
                    <ArrowDown className="text-emerald-400" size={32} />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{t('tour.add_first', lang)}</h3>
                <p className="text-xs text-gray-400">Нажмите на плюс, чтобы добавить тестовый расход.</p>
            </div>
          </>
        );

      case 2: // Inside Modal (Instruction only) - Positioned at TOP to not block inputs
        return (
          <div className={`${cardStyle} top-6 text-center border-emerald-500`}>
             <h3 className="font-bold text-white text-lg mb-2">{t('tour.test_transaction', lang)}</h3>
             <p className="text-sm text-gray-300 mb-3">
                 Введите сумму <strong>500</strong> и выберите категорию <strong>Еда</strong>.
             </p>
             <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded-lg border border-gray-700">
                 Или нажмите "{t('ai_import', lang)}" и вставьте текст СМС от банка!
             </div>
          </div>
        );

      case 3: // Success Message
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-gray-900 rounded-3xl border border-gray-700 p-6 max-w-sm text-center animate-bounce-in">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('tour.success', lang)}</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Вы получили свои первые очки опыта (XP). Повышайте уровень, чтобы открыть новые возможности!
                    </p>
                    <button onClick={onNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-transform active:scale-95">
                        Что дальше?
                    </button>
                </div>
            </div>
        );

      case 4: // Dashboard Tab Highlight (Bottom Left)
        return (
           <>
            <div className={`${highlightBoxStyle} bottom-0 left-0 w-[20%] h-[70px] border-emerald-500 rounded-none border-t-2 border-x-0 border-b-0`} />
            <div className={`${cardStyle} bottom-24`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <LayoutDashboard className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg">{t('nav.dashboard', lang)}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Здесь всё самое важное: ваш баланс, последние операции, активы и ваш игровой прогресс.
                </p>
                <button onClick={onNext} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-sm border border-gray-700">
                    Понятно
                </button>
            </div>
           </>
        );

      case 5: // Assistant (Bottom Right-ish)
        return (
           <>
            <div className={`${highlightBoxStyle} bottom-0 left-[60%] w-[20%] h-[70px] border-indigo-500 rounded-none border-t-2 border-x-0 border-b-0`} />
            <div className={`${cardStyle} bottom-24`}>
                <div className="flex items-center gap-3 mb-2">
                     <div className="bg-indigo-500/20 p-2 rounded-lg">
                        <Bot className="text-indigo-400" size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg">{t('nav.assistant', lang)}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Здесь живет Finguru. Он может дать совет, создать цель накопления или проанализировать ваши траты.
                </p>
                <button onClick={onNext} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-sm border border-gray-700">
                    Далее
                </button>
            </div>
           </>
        );
      
      case 6: // Budget (Bottom Left-Center)
        return (
           <>
            <div className={`${highlightBoxStyle} bottom-0 left-[20%] w-[20%] h-[70px] border-purple-500 rounded-none border-t-2 border-x-0 border-b-0`} />
            <div className={`${cardStyle} bottom-24`}>
                <div className="flex items-center gap-3 mb-2">
                     <div className="bg-purple-500/20 p-2 rounded-lg">
                        <PieChart className="text-purple-400" size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg">{t('nav.budget', lang)}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    Следите за лимитами. Мы автоматически разбиваем траты на Нужды, Желания и Сбережения.
                </p>
                <button onClick={onFinish} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-sm">
                    {t('tour.finish', lang)}
                </button>
            </div>
           </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {step !== 0 && step !== 3 && <div className="fixed inset-0 z-[85] pointer-events-none" />}
      {renderStep()}
    </>
  );
};
