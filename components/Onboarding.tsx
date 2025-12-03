
import React, { useState } from 'react';
import { ChevronRight, Check, Sparkles, PieChart, Bot, Trophy } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: <Sparkles size={64} className="text-emerald-400" />,
    title: "Добро пожаловать в Finguru",
    text: "Ваш умный финансовый помощник. Управляйте бюджетом легко и эффективно."
  },
  {
    icon: <Bot size={64} className="text-blue-400" />,
    title: "ИИ Ассистент",
    text: "Просто напишите или скажите: 'Потратил 5000 на такси', и ИИ всё запишет за вас."
  },
  {
    icon: <PieChart size={64} className="text-purple-400" />,
    title: "Умный Бюджет",
    text: "Стратегия 50/30/20 и автоматические советы помогут копить быстрее."
  },
  {
    icon: <Trophy size={64} className="text-amber-400" />,
    title: "Геймификация",
    text: "Получайте опыт за каждую запись, повышайте уровень и открывайте достижения!"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col h-[70vh] justify-between">
        
        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-700'}`}
                />
            ))}
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col items-center text-center justify-center space-y-6 animate-slide-up key={currentSlide}">
            <div className="mb-4 transform transition-transform hover:scale-110 duration-500">
                {slides[currentSlide].icon}
            </div>
            <h2 className="text-3xl font-black text-white">{slides[currentSlide].title}</h2>
            <p className="text-gray-400 text-lg leading-relaxed">{slides[currentSlide].text}</p>
        </div>

        {/* Controls */}
        <button 
            onClick={handleNext}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-2xl font-bold text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
            {currentSlide === slides.length - 1 ? (
                <>Начать <Check size={20} /></>
            ) : (
                <>Далее <ChevronRight size={20} /></>
            )}
        </button>
      </div>
    </div>
  );
};
