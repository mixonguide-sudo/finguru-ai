
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, BudgetStrategy, ChatMessage, Settings, SavingsGoal } from '../types';
import { chatWithFinancialAdvisor } from '../services/geminiService';
import { Send, Bot, User, Loader2, Mic, CheckCircle, MicOff } from 'lucide-react';
import { t } from '../utils/translations';
import { toLocalISOString } from '../utils/dateUtils';

interface AssistantViewProps {
  transactions: Transaction[];
  strategy: BudgetStrategy;
  settings: Settings;
  isPremium: boolean;
  onOpenPremium: () => void;
  checkLimits: (type: 'message') => boolean;
  updateUsage: (type: 'message') => void;
  remainingMessages: number;
  onAddGoal?: (goal: SavingsGoal) => void;
  
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onAddTransactionFromAI: (amount: number, category: string, type: string, description: string, dateOffset: number) => void;
  onAddRecurringFromAI: (name: string, amount: number, type: 'subscription' | 'loan', months?: number) => void;
  
  onAddInvestmentFromAI: (data: any) => void;
  onTopUpGoalFromAI: (name: string, amount: number) => void;
  savingsGoals: SavingsGoal[];
}

export const AssistantView: React.FC<AssistantViewProps> = ({ 
  transactions, 
  strategy, 
  settings,
  isPremium,
  onOpenPremium,
  checkLimits,
  updateUsage,
  remainingMessages,
  onAddGoal,
  messages,
  setMessages,
  onAddTransactionFromAI,
  onAddRecurringFromAI,
  onAddInvestmentFromAI,
  onTopUpGoalFromAI,
  savingsGoals
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            text: t('assistant.welcome', settings.language),
            timestamp: Date.now()
        }]);
    }
  }, [settings.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false; // Stop after one sentence
          recognition.interimResults = true; // Show results while talking
          
          recognition.onstart = () => {
              setIsListening(true);
          };

          recognition.onresult = (event: any) => {
              const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
              
              if (event.results[0].isFinal) {
                  setInput(prev => prev ? `${prev} ${transcript}` : transcript);
                  setIsListening(false);
              }
          };
          
          recognition.onerror = (event: any) => {
              console.error("Speech Recognition Error:", event.error);
              setIsListening(false);
              if (event.error === 'not-allowed') {
                  alert("Доступ к микрофону запрещен. Проверьте настройки браузера.");
              }
          };
          
          recognition.onend = () => {
              setIsListening(false);
          };

          recognitionRef.current = recognition;
      }
  }, []);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert("Ваш браузер не поддерживает голосовой ввод. Попробуйте Google Chrome.");
          return;
      }
      
      if (isListening) {
          recognitionRef.current.stop();
      } else {
          // Set language based on settings
          const langMap: Record<string, string> = {
              'ru': 'ru-RU',
              'en': 'en-US',
              'kz': 'kk-KZ' 
          };
          // Fallback to Russian if Kazakh is not fully supported by all browsers engine
          recognitionRef.current.lang = langMap[settings.language] || 'ru-RU';
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error("Mic start error", e);
            setIsListening(false);
          }
      }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isPremium && !checkLimits('message')) {
        onOpenPremium();
        return;
    }

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    updateUsage('message');

    const history = messages.filter(m => m.id !== 'welcome');

    // Pass language setting to AI
    const result = await chatWithFinancialAdvisor(input, history, transactions, strategy, savingsGoals, settings.language);
    
    setIsLoading(false);

    if (result.text) {
        const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: result.text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
    }

    if (result.functionCalls && result.functionCalls.length > 0) {
        result.functionCalls.forEach(fc => {
            const args = fc.args as any;
            
            if (fc.name === 'create_savings_goal' && onAddGoal) {
                const newGoal: SavingsGoal = {
                    id: Date.now().toString(),
                    name: args.name,
                    amount: args.amount,
                    savedAmount: 0,
                    createdAt: toLocalISOString(new Date())
                };
                onAddGoal(newGoal);
                addSystemMessage(`Создана цель: ${args.name} (${args.amount.toLocaleString()} ₸)`);
            }
            
            if (fc.name === 'add_transaction') {
                onAddTransactionFromAI(
                    args.amount, 
                    args.category, 
                    args.type, 
                    args.description || 'Через ассистента', 
                    args.dateOffset || 0
                );
                const prefix = args.type === 'income' ? 'Доход' : 'Расход';
                addSystemMessage(`Записано: ${prefix} ${args.amount.toLocaleString()} ₸ (${args.category})`);
            }

            if (fc.name === 'add_recurring_expense') {
                onAddRecurringFromAI(args.name, args.amount, args.type, args.months);
                const typeName = args.type === 'loan' ? 'Кредит' : 'Подписка';
                addSystemMessage(`Добавлено: ${typeName} "${args.name}" (${args.amount.toLocaleString()} ₸)`);
            }

            if (fc.name === 'add_investment') {
                onAddInvestmentFromAI(args);
                addSystemMessage(`Куплен актив: "${args.name}" на сумму ${args.amount.toLocaleString()} ₸`);
            }

            if (fc.name === 'top_up_savings_goal') {
                onTopUpGoalFromAI(args.goalName, args.amount);
                addSystemMessage(`В копилку "${args.goalName}" добавлено ${args.amount.toLocaleString()} ₸`);
            }
        });
    }
  };

  const addSystemMessage = (text: string) => {
      const systemMsg: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          role: 'assistant',
          text: text,
          timestamp: Date.now(),
          isSystem: true
      };
      setMessages(prev => [...prev, systemMsg]);
  };

  const isLimitReached = !isPremium && remainingMessages <= 0;

  return (
    <div className="flex flex-col h-[100dvh] pb-[80px] relative">
       <div className="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <div className="bg-indigo-600 p-2 rounded-xl">
                  <Bot size={24} className="text-white" />
               </div>
               Finguru AI
           </h2>
           <div className="flex justify-between items-start w-full">
               <p className="text-xs text-gray-500 mt-1">Ваш личный финансовый аналитик</p>
               {!isPremium && (
                   <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                       Осталось: {Math.max(0, remainingMessages)}
                   </span>
               )}
           </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
              if (msg.isSystem) {
                  return (
                      <div key={msg.id} className="flex justify-center animate-fade-in my-2">
                          <div className="bg-emerald-900/30 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
                              <CheckCircle size={16} className="text-emerald-400" />
                              <span className="text-sm text-emerald-200 font-medium">{msg.text}</span>
                          </div>
                      </div>
                  );
              }

              return (
                <div 
                    key={msg.id} 
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-indigo-600'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-indigo-900/30 border border-indigo-500/20 text-gray-100 rounded-tl-none'}`}>
                        {msg.text}
                    </div>
                </div>
              );
          })}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={16} />
               </div>
               <div className="bg-indigo-900/30 border border-indigo-500/20 px-4 py-2 rounded-2xl rounded-tl-none">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
       </div>

       <div className="p-4 bg-gray-900 border-t border-gray-800 sticky bottom-0 left-0 right-0">
         <div className="relative flex items-center gap-2">
            <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Слушаю..." : t('assistant.placeholder', settings.language)}
              disabled={isLimitReached || isLoading}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLimitReached || isLoading}
              className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
         </div>
       </div>
    </div>
  );
};