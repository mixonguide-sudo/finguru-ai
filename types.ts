

export type TransactionType = 'income' | 'expense';
export type Currency = 'KZT' | 'USD' | 'RUB' | 'EUR';
export type Language = 'ru' | 'kz' | 'en';
export type InvestmentType = 'deposit' | 'crypto' | 'stocks' | 'property' | 'other';
export type CategoryBucket = 'needs' | 'goals' | 'lifestyle';

export interface Settings {
  currency: Currency;
  language: Language;
  notificationTime: string; // Format "HH:MM"
  enableNotifications: boolean;
  weeklyBriefDay: number; // 0 = Sunday, 1 = Monday, etc.
  merchantMappings?: Record<string, string>; // KEY: Merchant Name (e.g. "Magnum"), VALUE: Category (e.g. "Еда")
  categoryMap?: Record<string, CategoryBucket>; // New: Maps "Еда" -> "needs"
  isSetupComplete?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  originalAmount?: number; // For multi-currency display
  originalCurrency?: string;
  category: string;
  description: string;
  date: string; // ISO string
  type: TransactionType;
  isManual: boolean;
  merchant?: string; // Recognized merchant name for mapping
}

export interface BudgetRule {
  name: string;
  percentage: number;
  color: string;
  description: string;
}

export interface FinancialAdvice {
  savingsPotential: number;
  message: string;
  actionItems: string[];
}

export interface BudgetStrategy {
  needs: number;
  wants: number;
  savings: number;
  projectedIncome?: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  amount: number; // Target amount
  savedAmount: number; // Current saved amount
  photoUrl?: string;
  targetDate?: string; // ISO String for deadline
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  amount: number; // Total current value (quantity * currentPrice)
  currency: Currency;
  type: InvestmentType;
  createdAt: string;
  
  // Passive Income Fields
  apy?: number; // Annual Percentage Yield (for deposits)
  revenue?: number; // Fixed monthly revenue (for property)
  
  // Stock/Crypto Fields
  ticker?: string;
  quantity?: number;
  buyPrice?: number; // Price per unit at purchase
  currentPrice?: number; // Current price per unit
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number; // Monthly payment amount
  totalDebt?: number; // Total debt for loans/installments
  type: 'subscription' | 'loan' | 'installment';
  monthsRemaining?: number; // For loans/installments
  paymentDay?: number; // Day of the month (1-31)
  active: boolean;
}

export interface CategoryPlan {
  category: string;
  limit: number;
}

// --- Gamification Types ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UserProfile {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  lastActionDate: string; // ISO Date string
  totalTransactions: number;
  isPremium?: boolean;
  achievements: Achievement[]; // New field
}

export interface LevelConfig {
  level: number;
  title: string;
  xpRequired: number;
}
// --------------------------

// --- AI Assistant Types ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isLoading?: boolean;
  isSystem?: boolean; // New: For action notifications
}
// --------------------------

// --- Freemium Types ---
export interface UsageStats {
  date: string; // ISO Date string (YYYY-MM-DD) to track daily resets
  aiParsesUsed: number;
  aiMessagesUsed: number;
}

export const FREE_LIMITS = {
  aiParses: 3,
  aiMessages: 3,
  maxGoals: 2
};

export const CATEGORIES = {
  income: ['Зарплата', 'Фриланс', 'Подарок', 'Возврат долга', 'Другое'],
  expense: ['Еда', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Покупки', 'Сбережения', 'Другое', 'Кредит', 'Обучение', 'Ремонт', 'Быт.техника']
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'KZT': '₸',
    'USD': '$',
    'EUR': '€',
    'RUB': '₽'
  };
  return symbols[currency] || currency;
};

// --- Telegram Web App Types ---
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  openLink: (url: string, options?: any) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Capacitor?: any;
    NotificationListener?: any;
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}