
// ... keep imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { BudgetView } from './components/BudgetView';
import { CalendarReport } from './components/CalendarReport';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsView } from './components/SettingsView';
import { LevelUpModal } from './components/LevelUpModal';
import { AssistantView } from './components/AssistantView';
import { Transaction, BudgetStrategy, SavingsGoal, Settings, RecurringExpense, CategoryPlan, getCurrencySymbol, UserProfile, FREE_LIMITS, UsageStats, Investment, ChatMessage, CategoryBucket } from './types';
import { INITIAL_PROFILE, processGamificationAction } from './services/gamification';
import { t } from './utils/translations';
import { LayoutDashboard, PieChart, Plus, Settings as SettingsIcon, Bot, Loader2 } from 'lucide-react';
import { PremiumModal } from './components/PremiumModal';
import { AddInvestmentModal } from './components/AddInvestmentModal';
import { getStockData } from './services/geminiService';
import { WeeklyBrief } from './components/WeeklyBrief';
import { auth, saveUserData, subscribeToUserData, onForegroundMessage } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { AuthScreen } from './components/AuthScreen';
import { InteractiveTour } from './components/InteractiveTour';
// import { AchievementsModal } from './components/AchievementsModal'; // Removed
import { GamificationHub } from './components/GamificationHub'; // Added
import { playIncomeSound, playExpenseSound } from './utils/sounds';
import { toLocalISOString } from './utils/dateUtils';
import { TopUpInvestmentModal } from './components/TopUpInvestmentModal';
import { ImportModal } from './components/ImportModal';
import { GoalSuccessModal } from './components/GoalSuccessModal';
import { MonthlyRecap } from './components/MonthlyRecap';
import { updateExchangeRates } from './services/currencyService';

const LOADING_PHRASES = [
  "Считаем ваши миллионы...",
  "Ищем, куда закатилась монетка...",
  "Анализируем траты на кофе...",
  "Проверяем курсы валют...",
  "Готовим финансовый отчет...",
  "Договариваемся с вашей жабой...",
  "Рисуем красивые графики...",
  "Заряжаем ИИ мозги..."
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const [view, setView] = useState<'dashboard' | 'budget' | 'history' | 'settings' | 'assistant'>('dashboard');
  
  // Random loading phrase
  const [loadingPhrase] = useState(() => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);
  
  // Interactive Tour State
  const [tourStep, setTourStep] = useState<number>(-1);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finguru_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [strategy, setStrategy] = useState<BudgetStrategy>(() => {
    const saved = localStorage.getItem('finguru_strategy');
    return saved ? JSON.parse(saved) : { needs: 50, wants: 30, savings: 20 };
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('finguru_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
      const saved = localStorage.getItem('finguru_recurring');
      return saved ? JSON.parse(saved) : [];
  });

  const [categoryPlans, setCategoryPlans] = useState<CategoryPlan[]>(() => {
      const saved = localStorage.getItem('finguru_plans');
      return saved ? JSON.parse(saved) : [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
      const saved = localStorage.getItem('finguru_investments');
      return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
      const saved = localStorage.getItem('finguru_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      return { 
        currency: parsed.currency || 'KZT', 
        language: parsed.language || 'ru',
        notificationTime: parsed.notificationTime || '20:00',
        enableNotifications: parsed.enableNotifications || false,
        weeklyBriefDay: parsed.weeklyBriefDay !== undefined ? parsed.weeklyBriefDay : 1,
        merchantMappings: parsed.merchantMappings || {},
        categoryMap: parsed.categoryMap || {},
        isSetupComplete: parsed.isSetupComplete || false
      };
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finguru_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
      const saved = localStorage.getItem('finguru_chat_history');
      return saved ? JSON.parse(saved) : [];
  });

  const isRemoteUpdate = useRef(false);

  // Initialize Telegram Web App & Currency
  useEffect(() => {
      if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand(); 
      }
      
      // Update Rates on Load
      updateExchangeRates();
  }, []);

  // ... (keep FCM & Notification Logic same as before) ...
  useEffect(() => {
    if (user && settings.enableNotifications) {
        onForegroundMessage((payload) => {
            if (payload.notification) {
                new Notification(payload.notification.title || 'Finguru AI', {
                    body: payload.notification.body,
                    icon: '/vite.svg'
                });
            }
        });
    }

    const checkTimeAndNotify = () => {
      if (!settings.enableNotifications) return;
      
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toDateString();

      if (lastCheckDate.current !== todayStr) {
          dailyNotifiedRef.current = false;
          lastCheckDate.current = todayStr;
      }

      if (currentTime === settings.notificationTime && !dailyNotifiedRef.current) {
        if (Notification.permission === 'granted') {
           new Notification("Finguru AI", { 
             body: "Пора внести данные о финансах 💰", 
             icon: "/vite.svg" 
           });
           dailyNotifiedRef.current = true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
      }
    };

    const interval = setInterval(checkTimeAndNotify, 30000);
    checkTimeAndNotify();
    return () => clearInterval(interval);

  }, [user, settings.enableNotifications, settings.notificationTime]);

  const dailyNotifiedRef = useRef<boolean>(false);
  const lastCheckDate = useRef<string>(new Date().toDateString());

  const resetApp = () => {
     setTransactions([]);
     setSavingsGoals([]);
     setInvestments([]);
     setRecurringExpenses([]);
     setCategoryPlans([]);
     setUserProfile(INITIAL_PROFILE);
     setChatMessages([]);
  };

  // ... (Keep Auth & Sync Logic same) ...
  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Splash Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 3. Data Subscription
  useEffect(() => {
    if (!user) return;

    // Check tour status on login
    const seen = localStorage.getItem('finguru_tour_completed');
    if (!seen) setTourStep(0); 

    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      isRemoteUpdate.current = true;
      if (data) {
          if (data.transactions) setTransactions(data.transactions);
          if (data.settings) setSettings(data.settings);
          if (data.strategy) setStrategy(data.strategy);
          if (data.goals) setSavingsGoals(data.goals);
          if (data.recurring) setRecurringExpenses(data.recurring);
          if (data.plans) setCategoryPlans(data.plans);
          if (data.profile) setUserProfile(data.profile);
          if (data.investments) setInvestments(data.investments);
          if (data.chatHistory) setChatMessages(data.chatHistory);
          setSyncStatus('synced');
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
    });
    
    return () => unsubscribe();
  }, [user]);

  // 4. Auto-save
  useEffect(() => {
    if (user && authInitialized && !showSplash && !isRemoteUpdate.current) {
        setSyncStatus('saving');
        const timeoutId = setTimeout(async () => {
            try {
                await saveUserData(user.uid, {
                    transactions,
                    settings,
                    strategy,
                    goals: savingsGoals,
                    recurring: recurringExpenses,
                    plans: categoryPlans,
                    profile: userProfile,
                    investments,
                    chatHistory: chatMessages,
                    lastUpdated: toLocalISOString(new Date())
                });
                setSyncStatus('synced');
            } catch (e) {
                console.error("Auto-save failed", e);
                setSyncStatus('error');
            }
        }, 2000); 
        return () => clearTimeout(timeoutId);
    }
  }, [user, authInitialized, showSplash, transactions, settings, strategy, savingsGoals, recurringExpenses, categoryPlans, userProfile, investments, chatMessages]);

  // ... (Keep LocalStorage effects) ...
  useEffect(() => { localStorage.setItem('finguru_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finguru_strategy', JSON.stringify(strategy)); }, [strategy]);
  useEffect(() => { localStorage.setItem('finguru_goals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('finguru_recurring', JSON.stringify(recurringExpenses)); }, [recurringExpenses]);
  useEffect(() => { localStorage.setItem('finguru_plans', JSON.stringify(categoryPlans)); }, [categoryPlans]);
  useEffect(() => { localStorage.setItem('finguru_investments', JSON.stringify(investments)); }, [investments]);
  useEffect(() => { localStorage.setItem('finguru_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('finguru_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('finguru_chat_history', JSON.stringify(chatMessages)); }, [chatMessages]);

  // ... (Keep Handlers) ...
  const handleHardReset = async () => {
      resetApp(); 
      localStorage.clear(); 
      if (user) {
          setSyncStatus('saving');
          isRemoteUpdate.current = true;
          await saveUserData(user.uid, {
              transactions: [],
              settings: settings,
              strategy: { needs: 50, wants: 30, savings: 20 },
              goals: [],
              recurring: [],
              plans: [],
              profile: INITIAL_PROFILE,
              investments: [],
              chatHistory: [],
              lastUpdated: toLocalISOString(new Date())
          });
          isRemoteUpdate.current = false;
          setSyncStatus('synced');
      }
      window.location.reload();
  };

  const isPremium = userProfile.isPremium || false;

  const handleBuyPremium = () => {
      alert("Для активации Premium доступа, пожалуйста, свяжитесь с администратором.");
      setIsPremiumModalOpen(false);
  };

  const [usageStats, setUsageStats] = useState<UsageStats>(() => {
      const saved = localStorage.getItem('finguru_usage');
      return saved ? JSON.parse(saved) : { date: toLocalISOString(new Date()).split('T')[0], aiParsesUsed: 0, aiMessagesUsed: 0 };
  });
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false); // Renamed

  const [showWeeklyBrief, setShowWeeklyBrief] = useState(false);
  const [completedGoal, setCompletedGoal] = useState<SavingsGoal | null>(null);
  
  const [showMonthlyRecap, setShowMonthlyRecap] = useState(false);
  const [recapMonthDate, setRecapMonthDate] = useState<Date>(new Date());

  // ... (Keep Recap & Brief effects) ...
  useEffect(() => {
      if (transactions.length === 0) return;
      
      const now = new Date();
      const currentDay = now.getDate();
      
      if (currentDay >= 1 && currentDay <= 5) {
          const prevMonth = new Date();
          prevMonth.setMonth(prevMonth.getMonth() - 1);
          
          const key = `finguru_recap_seen_${prevMonth.getFullYear()}_${prevMonth.getMonth()}`;
          const seen = localStorage.getItem(key);
          
          if (!seen) {
              setRecapMonthDate(prevMonth);
              setTimeout(() => setShowMonthlyRecap(true), 3000);
          }
      }
  }, [transactions.length]);

  const handleRecapClose = () => {
      setShowMonthlyRecap(false);
      const key = `finguru_recap_seen_${recapMonthDate.getFullYear()}_${recapMonthDate.getMonth()}`;
      localStorage.setItem(key, 'true');
  };

  useEffect(() => {
      const timer = setTimeout(() => {
          if (!isPremium) {
              setIsPremiumModalOpen(true);
          }
      }, 300000); 

      return () => clearTimeout(timer);
  }, [isPremium]);

  useEffect(() => {
      const checkBrief = () => {
          if (transactions.length === 0) return;
          const now = new Date();
          const currentDay = now.getDay();
          const targetDay = settings.weeklyBriefDay;
          if (currentDay !== targetDay) return;
          const lastShownDate = localStorage.getItem('finguru_brief_last_shown');
          const todayStr = toLocalISOString(new Date()).split('T')[0];
          if (lastShownDate === todayStr) return;
          setShowWeeklyBrief(true);
      };
      const timer = setTimeout(checkBrief, 1500);
      return () => clearTimeout(timer);
  }, [transactions.length, settings.weeklyBriefDay]);

  const closeBrief = () => {
      setShowWeeklyBrief(false);
      const todayStr = toLocalISOString(new Date()).split('T')[0];
      localStorage.setItem('finguru_brief_last_shown', todayStr);
  };

  useEffect(() => {
      const today = toLocalISOString(new Date()).split('T')[0];
      if (usageStats.date !== today) {
          const newStats = { date: today, aiParsesUsed: 0, aiMessagesUsed: 0 };
          setUsageStats(newStats);
          localStorage.setItem('finguru_usage', JSON.stringify(newStats));
      }
  }, [usageStats]);

  const updateUsage = (type: 'parse' | 'message') => {
      const newStats = { ...usageStats };
      if (type === 'parse') newStats.aiParsesUsed += 1;
      if (type === 'message') newStats.aiMessagesUsed += 1;
      setUsageStats(newStats);
      localStorage.setItem('finguru_usage', JSON.stringify(newStats));
  };

  const checkLimits = (type: 'parse' | 'message' | 'goals'): boolean => {
      if (isPremium) return true;
      if (type === 'parse') return usageStats.aiParsesUsed < FREE_LIMITS.aiParses;
      if (type === 'message') return usageStats.aiMessagesUsed < FREE_LIMITS.aiMessages;
      if (type === 'goals') return savingsGoals.length < FREE_LIMITS.maxGoals;
      return true;
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isTopUpInvestModalOpen, setIsTopUpInvestModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Date.now().toString() };
    setTransactions(prev => [newTransaction, ...prev]);
    
    if (t.type === 'income') playIncomeSound();
    else playExpenseSound();

    const actionResult = processGamificationAction(userProfile, new Date(t.date), { type: 'transaction' });
    setUserProfile(actionResult.newProfile);
    if (actionResult.levelUp) setIsLevelUpOpen(true);

    if (tourStep === 2) {
        setIsAddModalOpen(false); 
        setTourStep(3); 
    }
  };

  const updateTransaction = (updatedT: Transaction) => {
      setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingTransaction(t);
      setIsAddModalOpen(true);
  };

  const importTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
     const formatted = newTransactions.map((t, index) => ({
        ...t,
        id: Date.now().toString() + '-' + index
     }));
     setTransactions(prev => [...formatted, ...prev]);
     playIncomeSound(); 
     const actionResult = processGamificationAction(userProfile, new Date(), { type: 'transaction' });
     setUserProfile({
         ...actionResult.newProfile,
         currentXp: actionResult.newProfile.currentXp + (newTransactions.length * 2) 
     });
     
     if (newTransactions.length > 0) updateUsage('parse');
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm(t('settings.reset_confirm', settings.language))) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addSavingsGoal = (goal: SavingsGoal) => {
      setSavingsGoals(prev => [...prev, goal]);
      
      // Auto-add to plans with default calculation (Amount / 12 months) if needed
      // But usually Onboarding handles this. For manual add, we should probably add a 0 limit plan or smart default
      const defaultMonthly = Math.ceil(goal.amount / 12);
      setCategoryPlans(prev => [...prev, { category: goal.name, limit: defaultMonthly }]);
      
      // Also ensure category map has it
      setSettings(prev => ({
          ...prev,
          categoryMap: { ...prev.categoryMap, [goal.name]: 'goals' }
      }));

      playIncomeSound();
      const res = processGamificationAction(userProfile, new Date(), { type: 'goal' });
      setUserProfile(res.newProfile);
  };

  const removeSavingsGoal = (id: string) => {
      const goalToRemove = savingsGoals.find(g => g.id === id);
      if (goalToRemove) {
          // Remove from goals
          setSavingsGoals(prev => prev.filter(g => g.id !== id));
          // Remove from plans
          setCategoryPlans(prev => prev.filter(p => p.category !== goalToRemove.name));
          // Remove from category map
          setSettings(prev => {
              const newMap = { ...prev.categoryMap };
              delete newMap[goalToRemove.name];
              return { ...prev, categoryMap: newMap };
          });
      }
  };

  const updateSavingsGoal = (updatedGoal: SavingsGoal) => setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));

  // ... (Keep other handlers) ...
  const addRecurring = (r: RecurringExpense) => {
      setRecurringExpenses(prev => [...prev, r]);
      playExpenseSound();
  };
  const removeRecurring = (id: string) => setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  const updateRecurring = (updatedR: RecurringExpense) => setRecurringExpenses(prev => prev.map(r => r.id === updatedR.id ? updatedR : r));

  const addInvestment = (inv: Investment) => {
      setInvestments(prev => [...prev, inv]);
      playIncomeSound();
      const res = processGamificationAction(userProfile, new Date(), { type: 'investment' });
      setUserProfile(res.newProfile);
  };
  const updateInvestment = (updatedInv: Investment) => setInvestments(prev => prev.map(i => i.id === updatedInv.id ? updatedInv : i));
  const removeInvestment = (id: string) => {
      if (window.confirm(t('delete', settings.language) + '?')) {
          setInvestments(prev => prev.filter(i => i.id !== id));
      }
  };
  const handleEditInvestment = (inv: Investment) => {
      setEditingInvestment(inv);
      setIsInvestModalOpen(true);
  };

  const handleTopUpInvestment = (data: { amount: number, quantity?: number, price?: number }) => {
      if (!selectedInvestment) return;
      
      let updatedInv = { ...selectedInvestment };

      if ((selectedInvestment.type === 'stocks' || selectedInvestment.type === 'crypto') && data.quantity && data.price) {
           const oldQty = selectedInvestment.quantity || 0;
           const oldBuyPrice = selectedInvestment.buyPrice || 0;
           const oldTotalCost = oldQty * oldBuyPrice;
           
           const newQty = oldQty + data.quantity;
           const addedCost = data.quantity * data.price;
           const newTotalCost = oldTotalCost + addedCost;
           
           updatedInv.quantity = newQty;
           updatedInv.buyPrice = newQty > 0 ? newTotalCost / newQty : 0;
           updatedInv.currentPrice = data.price; 
           updatedInv.amount = newQty * data.price;
      } else {
           updatedInv.amount = selectedInvestment.amount + data.amount;
      }
      
      updateInvestment(updatedInv);

      addTransaction({
          amount: data.amount,
          category: 'Сбережения', 
          type: 'expense',
          currency: settings.currency,
          description: `Пополнение актива: ${selectedInvestment.name}`,
          date: toLocalISOString(new Date()),
          isManual: true
      });
      
      setSelectedInvestment(null);
  };

  const refreshInvestments = async () => {
      const itemsToUpdate = investments.filter(i => i.ticker && (i.type === 'stocks' || i.type === 'crypto'));
      if (itemsToUpdate.length === 0) return;
      
      const updatedList = await Promise.all(investments.map(async (inv) => {
          if (inv.ticker && (inv.type === 'stocks' || inv.type === 'crypto')) {
               const data = await getStockData(inv.ticker);
               
               if (data && data.price && inv.quantity) {
                   const newInv = { 
                       ...inv, 
                       currentPrice: data.price, 
                       amount: data.price * inv.quantity 
                   };
                   if (data.apy !== undefined) {
                       newInv.apy = data.apy;
                   }
                   return newInv;
               }
          }
          return inv;
      }));
      setInvestments(updatedList);
  };

  // ... (Keep Assistant Handlers) ...
  const handleAddTransactionFromAI = (amount: number, category: string, type: string, description: string, dateOffset: number) => {
      const date = new Date();
      date.setDate(date.getDate() + (dateOffset || 0));
      
      const newT = {
          amount,
          currency: settings.currency,
          category,
          description: description || 'Через ассистента',
          type: type as 'income' | 'expense',
          date: toLocalISOString(date),
          isManual: false
      };
      addTransaction(newT);
  };

  const handleAddRecurringFromAI = (name: string, amount: number, type: 'subscription' | 'loan', months?: number) => {
      const newR: RecurringExpense = {
          id: Date.now().toString(),
          name,
          amount,
          type,
          monthsRemaining: months,
          active: true
      };
      addRecurring(newR);
  };

  const handleAddInvestmentFromAI = (invData: any) => {
      const newInv: Investment = {
          id: Date.now().toString(),
          name: invData.name,
          amount: invData.amount,
          currency: settings.currency,
          type: invData.type,
          createdAt: toLocalISOString(new Date()),
          ticker: invData.ticker,
          quantity: invData.quantity,
          buyPrice: invData.price,
          currentPrice: invData.price
      };
      addInvestment(newInv);

      addTransaction({
          amount: invData.amount,
          currency: settings.currency,
          category: 'Сбережения',
          description: `Инвестиция: ${invData.name}`,
          type: 'expense',
          date: toLocalISOString(new Date()),
          isManual: false
      });
  };

  const handleTopUpGoalFromAI = (goalName: string, amount: number) => {
      const goal = savingsGoals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()));
      if (goal) {
          const newAmount = goal.savedAmount + amount;
          if (newAmount >= goal.amount && goal.savedAmount < goal.amount) {
              setCompletedGoal({ ...goal, savedAmount: newAmount });
          }
          updateSavingsGoal({ ...goal, savedAmount: newAmount });
      } else {
          addSavingsGoal({
              id: Date.now().toString(),
              name: goalName,
              amount: amount, 
              savedAmount: amount,
              createdAt: toLocalISOString(new Date())
          });
      }

      addTransaction({
          amount: amount,
          currency: settings.currency,
          category: 'Сбережения',
          description: `В копилку: ${goalName}`,
          type: 'expense',
          date: toLocalISOString(new Date()),
          isManual: false
      });
  };

  // ... (Keep URL handler) ...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let combinedText = [params.get('title'), params.get('text'), params.get('url')].filter(Boolean).join(' ');
    if (combinedText.trim()) {
      setNotificationText(combinedText.trim());
      setIsAddModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTourFinish = () => {
      setTourStep(-1);
      localStorage.setItem('finguru_tour_completed', 'true');
  };

  const handleTourNext = () => {
      setTourStep(prev => prev + 1);
  };

  const handlePlusClick = () => {
      setNotificationText(''); 
      setEditingTransaction(null); 
      setIsAddModalOpen(true);
      
      if (tourStep === 1) {
          setTourStep(2);
      }
  };

  const handleOnboardingComplete = (
      newTxs: Transaction[], 
      map: Record<string, CategoryBucket>, 
      newStrategy: BudgetStrategy, 
      newGoals: SavingsGoal[],
      newPlans: CategoryPlan[] 
  ) => {
      const existingIds = new Set(transactions.map(t => t.id));
      const filteredNewTxs = newTxs.filter(t => !existingIds.has(t.id));

      if (transactions.length === 0 && filteredNewTxs.length === 0 && (newStrategy.projectedIncome || 0) > 0) {
          const initialTx: Transaction = {
              id: Date.now().toString(),
              amount: newStrategy.projectedIncome || 0,
              currency: settings.currency,
              category: 'Зарплата',
              description: 'Начальный баланс',
              date: toLocalISOString(new Date()),
              type: 'income',
              isManual: true
          };
          filteredNewTxs.push(initialTx);
          playIncomeSound();
      }

      setTransactions(prev => [...prev, ...filteredNewTxs]);
      const updatedSettings = { ...settings, categoryMap: map, isSetupComplete: true };
      setSettings(updatedSettings);
      setStrategy(newStrategy);

      if (newGoals.length > 0) {
          setSavingsGoals(prev => [...prev, ...newGoals]);
      }

      if (newPlans && newPlans.length > 0) {
          setCategoryPlans(newPlans);
      }
  };

  // Render Logic
  const isLoading = !authInitialized || showSplash;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center">
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
         </div>
         
         <div className="relative z-10 flex flex-col items-center animate-bounce-in px-4 text-center">
             <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6">
                <Bot size={56} className="text-white" />
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight mb-2">Finguru AI</h1>
             <div className="flex flex-col gap-2 items-center min-h-[40px]">
                <div className="flex items-center gap-2">
                    <Loader2 size={16} className="text-indigo-400 animate-spin" />
                    <span className="text-indigo-200 text-sm font-medium animate-fade-in">{loadingPhrase}</span>
                </div>
             </div>
         </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative overflow-hidden">
      
      {tourStep >= 0 && <InteractiveTour step={tourStep} onNext={handleTourNext} onFinish={handleTourFinish} settings={settings} />}

      <main className="max-w-md mx-auto bg-gray-900 min-h-screen shadow-2xl relative">
        {view === 'dashboard' && (
          <Dashboard 
            transactions={transactions} 
            settings={settings} 
            onDelete={deleteTransaction}
            onEdit={handleEditTransaction}
            userProfile={userProfile}
            onOpenHistory={() => setView('history')}
            isPremium={isPremium}
            onOpenPremium={() => setIsPremiumModalOpen(true)}
            investments={investments}
            onAddInvestment={addInvestment}
            onRemoveInvestment={removeInvestment}
            onEditInvestment={handleEditInvestment}
            onRefreshInvestments={refreshInvestments}
            openInvestModal={() => { setEditingInvestment(null); setIsInvestModalOpen(true); }}
            onOpenAchievements={() => setIsGamificationOpen(true)} // Updated trigger
            onTopUpInvestment={(data) => { setSelectedInvestment(data); setIsTopUpInvestModalOpen(true); }}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}
        
        {view === 'budget' && (
            <BudgetView 
                transactions={transactions} 
                strategy={strategy} onUpdateStrategy={setStrategy}
                savingsGoals={savingsGoals} onAddGoal={addSavingsGoal} onRemoveGoal={removeSavingsGoal} onUpdateGoal={updateSavingsGoal}
                settings={settings}
                recurringExpenses={recurringExpenses} onAddRecurring={addRecurring} onRemoveRecurring={removeRecurring} onUpdateRecurring={updateRecurring}
                categoryPlans={categoryPlans} onUpdatePlans={setCategoryPlans}
                onAddTransaction={addTransaction}
                isPremium={isPremium}
                onOpenPremium={() => setIsPremiumModalOpen(true)}
                checkLimits={checkLimits}
                onGoalCompleted={setCompletedGoal}
                onSetupComplete={handleOnboardingComplete}
            />
        )}
        
        {/* ... (Keep other views same) ... */}
        {view === 'history' && (
          <CalendarReport 
            transactions={transactions} 
            settings={settings} 
            recurringExpenses={recurringExpenses} 
            onDelete={deleteTransaction}
            onEdit={handleEditTransaction}
            onAddTransaction={addTransaction}
          />
        )}

        {view === 'assistant' && (
            <AssistantView 
                transactions={transactions}
                strategy={strategy}
                settings={settings}
                isPremium={isPremium}
                onOpenPremium={() => setIsPremiumModalOpen(true)}
                checkLimits={checkLimits}
                updateUsage={updateUsage}
                remainingMessages={FREE_LIMITS.aiMessages - usageStats.aiMessagesUsed}
                onAddGoal={addSavingsGoal}
                messages={chatMessages}
                setMessages={setChatMessages}
                onAddTransactionFromAI={handleAddTransactionFromAI}
                onAddRecurringFromAI={handleAddRecurringFromAI}
                onAddInvestmentFromAI={handleAddInvestmentFromAI}
                onTopUpGoalFromAI={handleTopUpGoalFromAI}
                savingsGoals={savingsGoals}
            />
        )}
        
        {view === 'settings' && (
            <SettingsView 
                settings={settings} 
                onUpdate={setSettings} 
                onImportTransactions={importTransactions}
                isPremium={isPremium}
                user={user}
                onLogout={() => {
                    import('./services/firebase').then(m => m.logoutUser());
                    resetApp();
                }}
                onHardReset={handleHardReset}
            />
        )}

        <nav className="grid grid-cols-5 items-center px-1 py-2 pb-4 fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 max-w-md mx-auto z-40 pb-safe">
            <button onClick={() => setView('dashboard')} className={`p-1 flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-emerald-400' : 'text-gray-500'}`}>
              <LayoutDashboard size={22} />
              <span className="text-[10px] truncate w-full text-center">{t('nav.dashboard', settings.language)}</span>
            </button>
             <button onClick={() => setView('budget')} className={`p-1 flex flex-col items-center gap-1 ${view === 'budget' ? 'text-emerald-400' : 'text-gray-500'}`}>
              <PieChart size={22} />
              <span className="text-[10px] truncate w-full text-center">{t('nav.budget', settings.language)}</span>
            </button>
            <div className="flex justify-center items-end h-full relative">
                <button 
                    onClick={handlePlusClick} 
                    className={`bg-emerald-500 text-white p-5 rounded-full shadow-lg border-4 border-gray-900 -mt-8 transform active:scale-95 transition-transform hover:scale-105 ${tourStep === 1 ? 'ring-4 ring-emerald-400 animate-pulse' : ''}`}
                >
                  <Plus size={24} />
                </button>
            </div>
             <button onClick={() => setView('assistant')} className={`p-1 flex flex-col items-center gap-1 ${view === 'assistant' ? 'text-emerald-400' : 'text-gray-500'}`}>
              <Bot size={22} />
              <span className="text-[10px] truncate w-full text-center">{t('nav.assistant', settings.language)}</span>
            </button>
            <button onClick={() => setView('settings')} className={`p-1 flex flex-col items-center gap-1 ${view === 'settings' ? 'text-emerald-400' : 'text-gray-500'}`}>
              <SettingsIcon size={22} />
              <span className="text-[10px] truncate w-full text-center">{t('nav.settings', settings.language)}</span>
            </button>
        </nav>
      </main>
      
      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setNotificationText(''); setEditingTransaction(null); }} 
        onAdd={addTransaction} 
        onUpdate={updateTransaction}
        initialText={notificationText} 
        editingTransaction={editingTransaction}
        checkLimits={checkLimits}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        updateUsage={updateUsage}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importTransactions}
        settings={settings}
        checkLimits={checkLimits}
        onOpenPremium={() => setIsPremiumModalOpen(true)}
        onUpdateSettings={setSettings}
      />

      <AddInvestmentModal 
         isOpen={isInvestModalOpen}
         onClose={() => { setIsInvestModalOpen(false); setEditingInvestment(null); }}
         onAdd={addInvestment}
         onUpdate={updateInvestment}
         editingInvestment={editingInvestment}
      />

      <TopUpInvestmentModal 
        isOpen={isTopUpInvestModalOpen}
        onClose={() => { setIsTopUpInvestModalOpen(false); setSelectedInvestment(null); }}
        onTopUp={handleTopUpInvestment}
        investment={selectedInvestment}
        symbol={getCurrencySymbol(settings.currency)}
      />
      
      <LevelUpModal isOpen={isLevelUpOpen} onClose={() => setIsLevelUpOpen(false)} newLevel={userProfile.level} />
      
      <GamificationHub isOpen={isGamificationOpen} onClose={() => setIsGamificationOpen(false)} profile={userProfile} />
      
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} onBuy={handleBuyPremium} />
      <WeeklyBrief isOpen={showWeeklyBrief} onClose={closeBrief} transactions={transactions} settings={settings} />
      
      <MonthlyRecap 
        isOpen={showMonthlyRecap} 
        onClose={handleRecapClose} 
        transactions={transactions} 
        monthDate={recapMonthDate} 
        settings={settings} 
      />

      <GoalSuccessModal 
        isOpen={!!completedGoal} 
        onClose={() => setCompletedGoal(null)} 
        goal={completedGoal} 
        symbol={getCurrencySymbol(settings.currency)} 
      />
    </div>
  );
}
