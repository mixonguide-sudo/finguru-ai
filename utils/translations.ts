
import { Language } from '../types';

export const t = (key: string, lang: Language): string => {
  const dict: Record<string, Record<Language, string>> = {
    // Tabs
    'nav.dashboard': { ru: 'Обзор', kz: 'Шолу', en: 'Overview' },
    'nav.budget': { ru: 'План', kz: 'Жоспар', en: 'Plan' },
    'nav.report': { ru: 'Отчет', kz: 'Есеп', en: 'Report' },
    'nav.assistant': { ru: 'Ассистент', kz: 'Көмекші', en: 'Assistant' },
    'nav.settings': { ru: 'Настройки', kz: 'Баптаулар', en: 'Settings' },
    
    // General Actions
    'currency': { ru: 'Валюта', kz: 'Валюта', en: 'Currency' },
    'language': { ru: 'Язык', kz: 'Тіл', en: 'Language' },
    'save': { ru: 'Сохранить', kz: 'Сақтау', en: 'Save' },
    'update': { ru: 'Обновить', kz: 'Жаңарту', en: 'Update' },
    'add': { ru: 'Добавить', kz: 'Қосу', en: 'Add' },
    'cancel': { ru: 'Отмена', kz: 'Болдырмау', en: 'Cancel' },
    'delete': { ru: 'Удалить', kz: 'Жою', en: 'Delete' },
    'edit': { ru: 'Изменить', kz: 'Өзгерту', en: 'Edit' },
    'manual': { ru: 'Вручную', kz: 'Қолмен', en: 'Manual' },
    'ai_import': { ru: 'ИИ Импорт', kz: 'ИИ Импорт', en: 'AI Import' },
    
    // Dashboard
    'balance': { ru: 'Общий баланс', kz: 'Жалпы баланс', en: 'Total Balance' },
    'income': { ru: 'Доход', kz: 'Кіріс', en: 'Income' },
    'expense': { ru: 'Расход', kz: 'Шығыс', en: 'Expense' },
    'assets.title': { ru: 'Активы / Инвестиции', kz: 'Активтер / Инвестиция', en: 'Assets / Investments' },
    'assets.total': { ru: 'Общий капитал', kz: 'Жалпы капитал', en: 'Total Capital' },
    'assets.add': { ru: 'Добавить актив', kz: 'Актив қосу', en: 'Add Asset' },
    'assets.passive': { ru: 'Пассивный доход', kz: 'Пассивті кіріс', en: 'Passive Income' },
    'assets.mo': { ru: 'мес', kz: 'ай', en: 'mo' },
    'recent': { ru: 'Последние операции', kz: 'Соңғы операциялар', en: 'Recent Transactions' },
    'history_btn': { ru: 'История', kz: 'Тарих', en: 'History' },
    'top_expenses': { ru: 'Топ расходов', kz: 'Топ шығындар', en: 'Top Expenses' },
    'status': { ru: 'Ваш статус', kz: 'Мәртебеңіз', en: 'Your Status' },
    
    // Recurring Expenses
    'recurring.title': { ru: 'Постоянные расходы', kz: 'Тұрақты шығындар', en: 'Recurring Expenses' },
    'recurring.loan': { ru: 'Кредит', kz: 'Несие', en: 'Loan' },
    'recurring.installment': { ru: 'Рассрочка', kz: 'Бөліп төлеу', en: 'Installment' },
    'recurring.sub': { ru: 'Подписка', kz: 'Жазылым', en: 'Subscription' },
    'recurring.months': { ru: 'мес.', kz: 'ай', en: 'mo.' },
    'recurring.add': { ru: 'Добавить платеж', kz: 'Төлем қосу', en: 'Add Payment' },
    'recurring.payment_day': { ru: 'День платежа', kz: 'Төлем күні', en: 'Payment Day' },
    'recurring.total_debt': { ru: 'Общая сумма долга', kz: 'Жалпы қарыз', en: 'Total Debt' },
    'recurring.monthly_pay': { ru: 'Ежемесячный платеж', kz: 'Ай сайынғы төлем', en: 'Monthly Payment' },
    'recurring.term': { ru: 'Срок (мес)', kz: 'Мерзімі (ай)', en: 'Term (months)' },
    
    // Planning / Budget
    'plan.title': { ru: 'Лимиты по категориям', kz: 'Санат лимиттері', en: 'Category Limits' },
    'plan.ai_btn': { ru: 'Рассчитать ИИ', kz: 'ИИ есептеу', en: 'Calculate with AI' },
    'plan.fact': { ru: 'Факт', kz: 'Факт', en: 'Actual' },
    'plan.limit': { ru: 'Лимит', kz: 'Лимит', en: 'Limit' },
    'plan.left': { ru: 'Ост.', kz: 'Қалды', en: 'Left' },
    'plan.remaining': { ru: 'Остаток на месяц', kz: 'Ай қалдығы', en: 'Monthly Leftover' },
    'plan.potential': { ru: 'Потенциал накоплений', kz: 'Жиинақтау әлеуеТі', en: 'Savings Potential' },
    'plan.strategy': { ru: 'Стратегия Бюджета', kz: 'Бюджет Стратегиясы', en: 'Budget Strategy' },
    'plan.needs': { ru: 'Нужды', kz: 'Қажеттіліктер', en: 'Needs' },
    'plan.wants': { ru: 'Желания', kz: 'Қалаулар', en: 'Wants' },
    'plan.savings': { ru: 'Сбережения', kz: 'Жиинақтар', en: 'Savings' },
    'plan.advice': { ru: 'Мнение ИИ', kz: 'ИИ Пікірі', en: 'AI Advice' },

    // Settings
    'settings.account': { ru: 'Аккаунт', kz: 'Аккаунт', en: 'Account' },
    'settings.logout': { ru: 'Выйти из аккаунта', kz: 'Шығу', en: 'Log Out' },
    'settings.premium': { ru: 'Premium Статус', kz: 'Premium Мәртебесі', en: 'Premium Status' },
    'settings.notifications': { ru: 'Напоминания', kz: 'Ескертулер', en: 'Notifications' },
    'settings.enable_notif': { ru: 'Включить уведомления', kz: 'Ескертулерді қосу', en: 'Enable notifications' },
    'settings.time': { ru: 'Время отправки', kz: 'Жіберу уақыты', en: 'Send time' },
    'settings.brief_day': { ru: 'День еженедельной сводки', kz: 'Апталық есеп күні', en: 'Weekly Brief Day' },
    'settings.reset': { ru: 'Сброс данных (Полный)', kz: 'Деректерді жою', en: 'Full Data Reset' },
    'settings.reset_confirm': { ru: 'Вы действительно хотите удалить все данные?', kz: 'Барлық деректерді жойғыңыз келе ме?', en: 'Do you really want to delete all data?' },

    // Add Transaction Modal
    'modal.new_record': { ru: 'Новая запись', kz: 'Жаңа жазба', en: 'New Record' },
    'modal.edit_record': { ru: 'Редактирование', kz: 'Өзгерту', en: 'Edit Record' },
    'modal.amount': { ru: 'Сумма', kz: 'Сома', en: 'Amount' },
    'modal.category': { ru: 'Категория', kz: 'Санат', en: 'Category' },
    'modal.desc': { ru: 'Комментарий', kz: 'Түсініктеме', en: 'Description' },
    'modal.ai_help': { ru: 'Как это работает?', kz: 'Бұл қалай жұмыс істейді?', en: 'How it works?' },
    'modal.ai_desc': { ru: 'Скопируйте текст уведомления от банка и нажмите кнопку ниже.', kz: 'Банктен хабарлама көшіріп, төмендегі түймені басыңыз.', en: 'Copy the bank notification text and press the button below.' },
    'modal.paste': { ru: 'Вставить и разобрать', kz: 'Кірістіру және талдау', en: 'Paste and Parse' },
    'modal.recognize': { ru: 'Распознать', kz: 'Талдау', en: 'Recognize' },

    // Add Investment Modal
    'inv.modal.title_add': { ru: 'Добавить актив', kz: 'Актив қосу', en: 'Add Asset' },
    'inv.modal.title_edit': { ru: 'Редактировать актив', kz: 'Активті өзгерту', en: 'Edit Asset' },
    'inv.type': { ru: 'Тип актива', kz: 'Актив түрі', en: 'Asset Type' },
    'inv.name': { ru: 'Название', kz: 'Атауы', en: 'Name' },
    'inv.total': { ru: 'Сумма (Итого)', kz: 'Жалпы сома', en: 'Total Amount' },
    'inv.field.ticker': { ru: 'Тикер (Символ)', kz: 'Тикер', en: 'Ticker' },
    'inv.field.qty': { ru: 'Количество', kz: 'Саны', en: 'Quantity' },
    'inv.field.buyPrice': { ru: 'Цена покупки', kz: 'Сатып алу бағасы', en: 'Buy Price' },
    'inv.field.currPrice': { ru: 'Текущая цена', kz: 'Ағымдағы баға', en: 'Current Price' },
    'inv.field.rent': { ru: 'Аренда / Мес', kz: 'Жалға алу / Ай', en: 'Rent / Mo' },
    'inv.field.div': { ru: 'Дивиденды (%)', kz: 'Дивидендтер (%)', en: 'Dividends (%)' },
    'inv.field.apy': { ru: 'Годовая ставка (%)', kz: 'Жылдық мөлшерлеме (%)', en: 'APY (%)' },
    'inv.field.growth': { ru: 'Ожидаемый рост (%)', kz: 'Күтілетін өсім (%)', en: 'Exp. Growth (%)' },
    'inv.deposit': { ru: 'Депозит', kz: 'Депозит', en: 'Deposit' },
    'inv.stocks': { ru: 'Акции', kz: 'Акциялар', en: 'Stocks' },
    'inv.crypto': { ru: 'Крипто', kz: 'Крипто', en: 'Crypto' },
    'inv.property': { ru: 'Недвижимость', kz: 'Жылжымайтын мүлік', en: 'Property' },
    'inv.other': { ru: 'Другое', kz: 'Басқа', en: 'Other' },
    
    // Calendar
    'cal.add': { ru: 'Добавить операцию', kz: 'Операция қосу', en: 'Add Transaction' },
    'cal.empty': { ru: 'Операций нет', kz: 'Операциялар жоқ', en: 'No transactions' },
    'cal.recurring_due': { ru: 'Оплата:', kz: 'Төлем:', en: 'Payment due:' },

    // Assistant
    'assistant.welcome': { ru: 'Привет! Я ваш финансовый ассистент.', kz: 'Сәлем! Мен сіздің қаржылық көмекшіңізбін.', en: 'Hi! I am your financial assistant.' },
    'assistant.placeholder': { ru: 'Например: Сколько я потратил на еду?', kz: 'Мысалы: Тамаққа қанша жұмсадым?', en: 'E.g.: How much did I spend on food?' },
    'assistant.listening': { ru: 'Слушаю...', kz: 'Тыңдап тұрмын...', en: 'Listening...' },

    // Weekly Brief
    'brief.title': { ru: 'Ваша неделя', kz: 'Сіздің аптаңыз', en: 'Your Week' },
    'brief.spent': { ru: 'Потрачено', kz: 'Жұмсалды', en: 'Spent' },
    'brief.earned': { ru: 'Заработано', kz: 'Табылды', en: 'Earned' },
    'brief.top_cat': { ru: 'Топ категория', kz: 'Топ санат', en: 'Top Category' },
    'brief.continue': { ru: 'Продолжить', kz: 'Жалғастыру', en: 'Continue' },
    
    // Days
    'day.0': { ru: 'Воскресенье', kz: 'Жексенбі', en: 'Sunday' },
    'day.1': { ru: 'Понедельник', kz: 'Дүйсенбі', en: 'Monday' },
    'day.2': { ru: 'Вторник', kz: 'Сейсенбі', en: 'Tuesday' },
    'day.3': { ru: 'Среда', kz: 'Сәрсенбі', en: 'Wednesday' },
    'day.4': { ru: 'Четверг', kz: 'Бейсенбі', en: 'Thursday' },
    'day.5': { ru: 'Пятница', kz: 'Жұма', en: 'Friday' },
    'day.6': { ru: 'Суббота', kz: 'Сенбі', en: 'Saturday' },

    // Tours
    'tour.welcome': { ru: 'Привет в Finguru!', kz: 'Finguru-ға қош келдіңіз!', en: 'Welcome to Finguru!' },
    'tour.start': { ru: 'Поехали! 🚀', kz: 'Кеттік! 🚀', en: 'Let\'s go! 🚀' },
    'tour.add_first': { ru: 'Добавьте первую запись', kz: 'Алғашқы жазбаны қосыңыз', en: 'Add first record' },
    'tour.test_transaction': { ru: 'Тестовая транзакция', kz: 'Сынақ транзакциясы', en: 'Test Transaction' },
    'tour.success': { ru: 'Отлично!', kz: 'Тамаша!', en: 'Great!' },
    'tour.finish': { ru: 'Завершить тур', kz: 'Турды аяқтау', en: 'Finish Tour' },
  };

  return dict[key]?.[lang] || key;
};
