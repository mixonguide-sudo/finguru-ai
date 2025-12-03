
import React, { useState } from 'react';
import { Settings, Currency, Language, Transaction } from '../types';
import { t } from '../utils/translations';
import { Globe, Coins, Check, Bell, Clock, ChevronDown, Trash2, LogOut, User as UserIcon, Crown, ShieldCheck, Bug } from 'lucide-react';
import { getExchangeRate } from '../services/currencyService';
import { requestFCMToken, saveFCMToken } from '../services/firebase';
import type { User } from 'firebase/auth';

interface SettingsViewProps {
  settings: Settings;
  onUpdate: (newSettings: Settings) => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  isPremium?: boolean;
  onActivatePremium?: (code: string) => boolean;
  user?: User | null;
  onLogout?: () => void;
  onHardReset?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onImportTransactions, isPremium, onActivatePremium, user, onLogout, onHardReset }) => {
  const [openDropdown, setOpenDropdown] = useState<'language' | 'currency' | 'briefDay' | null>(null);
  
  const languages: {code: Language, label: string}[] = [
    { code: 'ru', label: 'Русский' },
    { code: 'kz', label: 'Қазақша' },
    { code: 'en', label: 'English' },
  ];

  const currencies: {code: Currency, label: string}[] = [
    { code: 'KZT', label: 'Тенге (₸)' },
    { code: 'USD', label: 'Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'RUB', label: 'Рубль (₽)' },
  ];

  const days = [1, 2, 3, 4, 5, 6, 0]; 

  const handleNotificationToggle = async () => {
    if (!settings.enableNotifications) {
      // Trying to Turn ON
      if ('Notification' in window) {
        // Check current permission status
        const currentPermission = Notification.permission;
        
        if (currentPermission === 'denied') {
            alert('Уведомления заблокированы в настройках вашего браузера или телефона. Пожалуйста, разрешите их вручную в настройках сайта.');
            return;
        }

        try {
          // 1. Request Browser Permission first
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
             // 2. Enable UI Immediately (Local notifications will work)
             onUpdate({ ...settings, enableNotifications: true });
             
             // 3. Try to get FCM Token in background (Fire and forget)
             requestFCMToken().then(token => {
                 if (token && user) {
                     saveFCMToken(user.uid, token);
                 }
             }).catch(err => {
                 console.warn("FCM Token fetch failed, but local notifications enabled:", err);
             });

             new Notification('Finguru AI', { body: 'Уведомления успешно включены! 🔔' });
          } else {
             alert('Не удалось получить разрешение на уведомления.');
          }
        } catch (e) {
          console.error(e);
          alert('Ошибка при включении уведомлений. Проверьте настройки сети.');
        }
      } else {
          alert('Ваш браузер не поддерживает Push-уведомления.');
      }
    } else {
      // Turn OFF
      onUpdate({ ...settings, enableNotifications: false });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Подтверждение сброса\n\nВы действительно хотите удалить все данные из ОБЛАКА и УСТРОЙСТВА? Отменить действие будет невозможно.')) {
      if (onHardReset) {
          onHardReset();
      } else {
          localStorage.clear();
          window.location.reload();
      }
    }
  };

  const currentLangLabel = languages.find(l => l.code === settings.language)?.label;
  const currentCurrencyLabel = currencies.find(c => c.code === settings.currency)?.label;
  const currentDayLabel = t(`day.${settings.weeklyBriefDay || 1}`, settings.language);

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-24">
      <h2 className="text-2xl font-bold text-white mb-6">{t('nav.settings', settings.language)}</h2>

      {/* Account Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4 mb-3">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-full text-white shadow-lg">
                 <UserIcon size={24} />
             </div>
             <div>
                 <h3 className="font-bold text-white text-lg">Аккаунт</h3>
                 <p className="text-sm text-gray-400">{user ? user.email : 'Не выполнен вход'}</p>
             </div>
          </div>
          {user && onLogout && (
              <div className="mt-4 relative z-10">
                  <button 
                      onClick={onLogout}
                      className="w-full py-2.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center justify-center gap-2 border border-red-500/20 transition-colors"
                  >
                      <LogOut size={16} /> Выйти из аккаунта
                  </button>
              </div>
          )}
          {/* Decorative Blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      </div>
      
      {/* Premium Status Section (Read Only) */}
      <div className={`bg-gradient-to-r ${isPremium ? 'from-amber-900/40 to-orange-900/40 border-amber-500/30' : 'from-gray-800 to-gray-900 border-gray-700'} border rounded-xl p-4 shadow-md`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`${isPremium ? 'text-amber-200' : 'text-gray-300'} font-bold flex items-center gap-2`}>
                    {isPremium ? <Crown size={18} /> : <ShieldCheck size={18} />}
                    Premium Статус
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isPremium ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                    {isPremium ? 'ACTIVATED' : 'FREE'}
                </span>
            </div>
            
            {isPremium ? (
                <p className="text-xs text-amber-200/70">
                    У вас полный доступ ко всем функциям Finguru AI Enterprise.
                </p>
            ) : (
                <p className="text-xs text-gray-500">
                    Активация Premium доступна через администратора.
                </p>
            )}
      </div>

      {/* Notifications Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Bell size={16} />
          Напоминания
        </h3>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4 shadow-md">
           <div className="flex items-center justify-between">
             <span className="text-gray-200 text-sm font-medium">Включить уведомления</span>
             <button 
               onClick={handleNotificationToggle}
               className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableNotifications ? 'bg-emerald-500' : 'bg-gray-600'}`}
             >
               <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.enableNotifications ? 'left-7' : 'left-1'}`} />
             </button>
           </div>
           
           {settings.enableNotifications && (
             <div className="pt-4 border-t border-gray-700 animate-fade-in">
               <label className="block text-xs text-gray-400 mb-2 flex items-center gap-2">
                 <Clock size={14} className="text-emerald-400" /> 
                 Время отправки
               </label>
               <div className="relative">
                   <input 
                     type="time" 
                     value={settings.notificationTime || "20:00"}
                     onChange={(e) => onUpdate({...settings, notificationTime: e.target.value})}
                     className="bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm w-40 focus:ring-2 focus:ring-emerald-500 outline-none"
                   />
               </div>
             </div>
           )}
        </div>
      </div>
      
      {/* Weekly Brief Day Setting */}
      <div className="space-y-3 relative z-30">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} />
              {t('settings.brief_day', settings.language)}
          </h3>
          <div className="relative">
            <button 
                onClick={() => setOpenDropdown(openDropdown === 'briefDay' ? null : 'briefDay')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-750 transition-colors shadow-md"
            >
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${openDropdown === 'briefDay' ? 'rotate-180' : ''}`} />
                <span className="font-medium flex-1 text-left">{currentDayLabel}</span>
            </button>

            {openDropdown === 'briefDay' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in max-h-60 overflow-y-auto">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => {
                                onUpdate({ ...settings, weeklyBriefDay: day });
                                setOpenDropdown(null);
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors text-left"
                        >
                            <span className={settings.weeklyBriefDay === day ? 'text-emerald-400 font-bold' : 'text-gray-200'}>
                                {t(`day.${day}`, settings.language)}
                            </span>
                            {settings.weeklyBriefDay === day && <Check size={18} className="text-emerald-400" />}
                        </button>
                    ))}
                </div>
            )}
          </div>
      </div>

      {/* Language Section */}
      <div className="space-y-3 relative z-20">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Globe size={16} />
          {t('language', settings.language)}
        </h3>
        
        <div className="relative">
            <button 
                onClick={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-750 transition-colors shadow-md"
            >
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
                <span className="font-medium flex-1 text-left">{currentLangLabel}</span>
            </button>

            {openDropdown === 'language' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                onUpdate({ ...settings, language: lang.code });
                                setOpenDropdown(null);
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors text-left"
                        >
                            <span className={settings.language === lang.code ? 'text-emerald-400 font-bold' : 'text-gray-200'}>
                                {lang.label}
                            </span>
                            {settings.language === lang.code && <Check size={18} className="text-emerald-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Currency Section */}
      <div className="space-y-3 relative z-10">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Coins size={16} />
          {t('currency', settings.language)}
        </h3>
        
        <div className="relative">
            <button 
                onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-750 transition-colors shadow-md"
            >
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${openDropdown === 'currency' ? 'rotate-180' : ''}`} />
                <div className="flex-1 text-left">
                    <div className="font-medium">{currentCurrencyLabel}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        1 {settings.currency === 'KZT' ? 'USD' : settings.currency} ≈ {settings.currency === 'KZT' ? getExchangeRate('USD') : (1 / getExchangeRate(settings.currency)).toFixed(2)} {settings.currency === 'KZT' ? 'KZT' : 'KZT'}
                    </div>
                </div>
            </button>

            {openDropdown === 'currency' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in">
                    {currencies.map((curr) => (
                        <button
                            key={curr.code}
                            onClick={() => {
                                onUpdate({ ...settings, currency: curr.code });
                                setOpenDropdown(null);
                            }}
                            className="w-full flex items-center justify-between p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors text-left"
                        >
                            <span className={settings.currency === curr.code ? 'text-emerald-400 font-bold' : 'text-gray-200'}>
                                {curr.label}
                            </span>
                            {settings.currency === curr.code && <Check size={18} className="text-emerald-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Reset Data & Bug Report Section */}
      <div className="pt-8 mt-8 border-t border-gray-800 space-y-4">
         <button 
            onClick={() => window.open('https://t.me/mainsloww', '_blank')}
            className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
         >
            <Bug size={18} />
            Сообщить об ошибке
         </button>

         <button 
            onClick={handleResetData}
            className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 font-medium"
         >
            <Trash2 size={18} />
            Сброс данных (Полный)
         </button>
         
         <div className="text-center">
            <p className="text-xs text-gray-600">Finguru AI v2.2 Enterprise</p>
         </div>
      </div>
    </div>
  );
};
