
import { UserProfile, LevelConfig, Achievement } from "../types";

const LEVELS: LevelConfig[] = [
  { level: 1, title: "Новичок", xpRequired: 50 },
  { level: 2, title: "Экономный", xpRequired: 120 },
  { level: 3, title: "Счетовод", xpRequired: 250 },
  { level: 4, title: "Младший менеджер", xpRequired: 400 },
  { level: 5, title: "Планировщик", xpRequired: 600 },
  { level: 6, title: "Аналитик", xpRequired: 850 },
  { level: 7, title: "Старший Аналитик", xpRequired: 1150 },
  { level: 8, title: "Аудитор", xpRequired: 1500 },
  { level: 9, title: "Инвестор", xpRequired: 1900 },
  { level: 10, title: "Брокер", xpRequired: 2400 },
  { level: 11, title: "Банкир", xpRequired: 3000 },
  { level: 12, title: "Капиталист", xpRequired: 3700 },
  { level: 13, title: "Магнат", xpRequired: 4500 },
  { level: 14, title: "Олигарх", xpRequired: 5500 },
  { level: 15, title: "Монополист", xpRequired: 6700 },
  { level: 16, title: "Финансовый Гуру", xpRequired: 8000 },
  { level: 17, title: "Повелитель Бюджета", xpRequired: 9500 },
  { level: 18, title: "Легенда", xpRequired: 12000 },
  { level: 19, title: "Оракул", xpRequired: 15000 },
  { level: 20, title: "Создатель Рынков", xpRequired: 20000 },
];

const AVAILABLE_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_step', title: 'Первый шаг', description: 'Добавьте первую транзакцию', icon: '🚀' },
  { id: 'regular', title: 'Регулярность', description: 'Вносите данные 3 дня подряд', icon: '🔥' },
  { id: 'saver', title: 'Копилка', description: 'Накопите первые сбережения', icon: '🐷' },
  { id: 'investor', title: 'Инвестор', description: 'Добавьте первый инвестиционный актив', icon: '📈' },
  { id: 'pro_user', title: 'Профессионал', description: 'Достигните 5 уровня', icon: '⭐' },
];

export const INITIAL_PROFILE: UserProfile = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 50,
  streakDays: 0,
  lastActionDate: new Date(0).toISOString(),
  totalTransactions: 0,
  isPremium: false,
  achievements: []
};

export const calculateXpGain = (isManual: boolean): number => {
  return isManual ? 5 : 2; // Reduced from 15/10 to 5/2
};

export const getLevelTitle = (level: number): string => {
  const config = LEVELS.find(l => l.level === level);
  if (!config && level > LEVELS[LEVELS.length - 1].level) {
      return LEVELS[LEVELS.length - 1].title;
  }
  return config ? config.title : `Уровень ${level}`;
};

export const processGamificationAction = (
  currentProfile: UserProfile, 
  actionDate: Date = new Date(),
  context: { type?: 'transaction' | 'investment' | 'goal' } = {}
): { newProfile: UserProfile; xpGained: number; levelUp: boolean; newAchievements: Achievement[] } => {
  
  const today = new Date(actionDate);
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(currentProfile.lastActionDate);
  lastDate.setHours(0, 0, 0, 0);

  // 1. Calculate Streak
  let newStreak = currentProfile.streakDays;
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  } else if (diffDays === 0 && currentProfile.streakDays === 0) {
      newStreak = 1;
  }

  // 2. Add XP (Reduced)
  // Base XP (5) + Streak Bonus (1 per day, max capped implicitly by difficulty)
  const xpGained = calculateXpGain(true) + newStreak; 
  
  let newXp = currentProfile.currentXp + xpGained;
  let newLevel = currentProfile.level;
  let nextLevelXp = currentProfile.nextLevelXp;
  let isLevelUp = false;

  // 3. Check Level Up
  while (newXp >= nextLevelXp) {
    const nextLevelConfig = LEVELS.find(l => l.level === newLevel + 1);
    
    if (nextLevelConfig) {
      newXp = newXp - nextLevelXp;
      newLevel++;
      nextLevelXp = nextLevelConfig.xpRequired;
      isLevelUp = true;
    } else {
      newXp = newXp - nextLevelXp;
      nextLevelXp = Math.round(nextLevelXp * 1.2); 
      newLevel++;
      isLevelUp = true;
    }
  }

  // 4. Check Achievements
  const currentAchievements = currentProfile.achievements || [];
  const newAchievements: Achievement[] = [];
  const totalTransactions = currentProfile.totalTransactions + 1;

  const checkAchievement = (id: string, condition: boolean) => {
      if (condition && !currentAchievements.find(a => a.id === id)) {
          const ach = AVAILABLE_ACHIEVEMENTS.find(a => a.id === id);
          if (ach) {
              const unlocked = { ...ach, unlockedAt: new Date().toISOString() };
              newAchievements.push(unlocked);
              currentAchievements.push(unlocked);
          }
      }
  };

  checkAchievement('first_step', totalTransactions >= 1);
  checkAchievement('regular', newStreak >= 3);
  checkAchievement('pro_user', newLevel >= 5);
  if (context.type === 'investment') checkAchievement('investor', true);
  if (context.type === 'goal') checkAchievement('saver', true);

  return {
    newProfile: {
      level: newLevel,
      currentXp: newXp,
      nextLevelXp: nextLevelXp,
      streakDays: newStreak,
      lastActionDate: actionDate.toISOString(),
      totalTransactions: totalTransactions,
      isPremium: currentProfile.isPremium,
      achievements: currentAchievements
    },
    xpGained,
    levelUp: isLevelUp,
    newAchievements
  };
};
