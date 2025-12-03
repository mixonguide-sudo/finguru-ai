import React, { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface MockNotificationProps {
  onSimulate: (text: string) => void;
}

const MOCK_MESSAGES = [
  "Kaspi Gold: Покупка 12500 ₸ Magnum Cash & Carry",
  "Kaspi Gold: Покупка 4500 ₸ Yandex Taxi",
  "Kaspi Gold: Перевод 250000 ₸ Зарплата",
  "Halyk Bank: Покупка 3200 ₸ Starbucks",
  "Kaspi Gold: Пополнение 15000 ₸ Возврат долга"
];

export const MockNotification: React.FC<MockNotificationProps> = ({ onSimulate }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const trigger = () => {
    const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
    setMessage(randomMsg);
    setVisible(true);
  };

  useEffect(() => {
    // Simulate a notification appearing after 5 seconds on first load for demo
    const timer = setTimeout(() => {
      trigger();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return (
    <button 
      onClick={trigger}
      className="fixed top-4 right-4 z-50 bg-gray-700 text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
    >
      Симуляция СМС
    </button>
  );

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-bounce-in">
      <div 
        className="bg-gray-800/95 backdrop-blur border border-emerald-500/30 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => {
          onSimulate(message);
          setVisible(false);
        }}
      >
        <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 mt-1">
          <MessageSquare size={20} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm text-emerald-400">Банковское уведомление</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); setVisible(false); }}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm mt-1 text-gray-200">{message}</p>
          <p className="text-xs text-gray-400 mt-2">Нажмите, чтобы добавить в учет</p>
        </div>
      </div>
    </div>
  );
};