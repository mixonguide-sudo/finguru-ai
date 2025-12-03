import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Transaction, BudgetStrategy, ChatMessage, SavingsGoal, Language } from "../types";

// Fix: Check if process is defined to avoid ReferenceError in browser
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : ''; 

const ai = new GoogleGenAI({ apiKey: apiKey });

// Financial Modeling Prep API Key
const FMP_KEY = 'csVSrjiq0zo6tMZtAJouFHQLviO5uRw9';

// --- Helper: Stock & Crypto APIs ---

const fetchCryptoPrice = async (symbol: string): Promise<number | null> => {
    try {
        // Binance Public API (No key required, very reliable)
        const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        let pairsToTry = [cleanSymbol];
        // If user typed 'BTC', try 'BTCUSDT'
        if (!cleanSymbol.endsWith('USDT') && !cleanSymbol.endsWith('USD')) {
            pairsToTry.unshift(`${cleanSymbol}USDT`);
        }

        for (const pair of pairsToTry) {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
                if (res.ok) {
                    const data = await res.json();
                    return parseFloat(data.price);
                }
            } catch (e) {
                continue;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

const fetchFMPData = async (ticker: string): Promise<{ price: number | null, apy?: number }> => {
    try {
        const cleanTicker = ticker.toUpperCase().trim();
        
        // Use 'profile' endpoint which is more reliable for Price and Last Dividend
        const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${cleanTicker}?apikey=${FMP_KEY}`);

        let price = null;
        let apy = undefined;

        if (res.ok) {
            const data = await res.json();
            // Response: [{ "price": 175.43, "lastDiv": 0.96, "mktCap": ... }]
            if (Array.isArray(data) && data.length > 0) {
                const profile = data[0];
                price = profile.price;
                
                // Calculate Yield manually if APY is not explicitly provided
                // Yield = (LastDiv / Price) * 100
                if (profile.lastDiv && price > 0) {
                    // lastDiv usually is annual dividend per share
                    apy = (profile.lastDiv / price) * 100;
                }
            }
        }

        return { price, apy };

    } catch (e) {
        // console.error("FMP API Error:", e);
        return { price: null };
    }
};

const fetchYahooData = async (ticker: string): Promise<{ price: number | null, apy?: number }> => {
    try {
        // Yahoo Finance via Proxy to bypass CORS
        // We use query1.finance.yahoo.com/v8/finance/quote which returns price + yield
        const proxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url='
        ];

        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${ticker}`;
        
        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy + encodeURIComponent(targetUrl));
                if (res.ok) {
                    const data = await res.json();
                    const result = data.quoteResponse?.result?.[0];
                    
                    if (result) {
                        const price = result.regularMarketPrice || result.postMarketPrice || result.bid;
                        const dividendYield = result.trailingAnnualDividendYield || result.dividendYield;
                        
                        return { 
                            price: price || null,
                            apy: dividendYield ? (dividendYield) : undefined // Yahoo returns decimal (0.05), normally we want %, but let's check format. Yahoo usually returns 5.43 for 5.43% in summary, but decimal in quote. Let's assume decimal here and convert if needed, or check logs. Actually result.dividendYield is usually percentage in decimal (0.005). Wait, yahoo quote often returns it as percentage value directly or undefined. Let's assume if it is < 1 it is decimal.
                        };
                    }
                }
            } catch (e) {
                continue;
            }
        }
        return { price: null };
    } catch (e) {
        return { price: null };
    }
};

export const getStockData = async (ticker: string): Promise<{ price: number | null, apy?: number }> => {
    let cleanTicker = ticker.toUpperCase().trim();

    // --- Smart Mapping for KZ Stocks ---
    const kzMapping: Record<string, string> = {
        'HSBK': 'HSBK.KZ',   // Halyk Bank (KASE)
        'HALYK': 'HSBK.KZ',
        'KASPI': 'KSPI.KZ',  // Kaspi (KASE)
        'KSPI': 'KSPI.KZ',
        'BCC': 'CCBN.KZ',    // CenterCredit
        'CCBN': 'CCBN.KZ',
        'KAP': 'KAP.KZ',     // Kazatomprom
        'KEGOC': 'KEGC.KZ',
        'KAZAKHTELECOM': 'KZTK.KZ',
        'KZTK': 'KZTK.KZ',
        'KCELL': 'KCEL.KZ'
    };

    if (kzMapping[cleanTicker]) {
        cleanTicker = kzMapping[cleanTicker];
    }
    // -----------------------------------

    // 1. Check Crypto first (Binance is fastest/free)
    // Only if it doesn't look like a URL or complex stock symbol with dots
    if (!cleanTicker.includes('.')) {
        const cryptoPrice = await fetchCryptoPrice(cleanTicker);
        if (cryptoPrice) {
            return { price: cryptoPrice };
        }
    }

    // 2. Prepare Ticker Variations
    const variations = [cleanTicker];
    
    // If user enters basic ticker like "HSBK" (and it wasn't caught by mapping) or "AAPL"
    if (!cleanTicker.includes('.')) {
        // Only add international suffixes if it looks like a non-US ticker intent.
        // But for KZ stocks, we try .KZ if the base fails
        variations.push(`${cleanTicker}.KZ`); // Kazakhstan
        variations.push(`${cleanTicker}.IL`); // London (IOB)
        variations.push(`${cleanTicker}.L`);  // London
    }

    // 3. Try Providers loop
    for (const t of variations) {
        // A. Try Financial Modeling Prep (Best for US Stocks like AAPL)
        // Skip FMP for .KZ tickers as it usually fails or has old data
        if (!t.endsWith('.KZ')) {
            const fmpData = await fetchFMPData(t);
            if (fmpData.price) {
                return fmpData;
            }
        }

        // B. Try Yahoo Finance (Best for International/KZ)
        const yahooData = await fetchYahooData(t);
        if (yahooData.price) {
            // Fix Yahoo Yield: if it's 0.05, convert to 5.
            let finalApy = yahooData.apy;
            if (finalApy && finalApy < 1) finalApy = finalApy * 100;
            
            return { price: yahooData.price, apy: finalApy };
        }
    }

    return { price: null };
};

// Deprecated: Kept for backward compatibility
export const getStockQuote = async (ticker: string): Promise<number | null> => {
    const data = await getStockData(ticker);
    return data.price;
};

// ------------------------------

export const parseTransactionText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this financial text (like a bank SMS or user note) and extract data: "${text}". 
      Assume currency is KZT (тенге) if not specified. 
      Determine if it is 'income' or 'expense'.
      Map category to one of: Еда, Транспорт, Жилье, Развлечения, Здоровье, Покупки, Зарплата, Фриланс, Подарок, Возврат долга, Сбережения, Другое.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['income', 'expense'] }
          },
          required: ['amount', 'category', 'type']
        }
      }
    });

    let textResponse = response.text;
    if (textResponse) {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
          textResponse = jsonMatch[0];
      } else {
          textResponse = textResponse.replace(/```json|```/g, '');
      }
      return JSON.parse(textResponse);
    }
    return null;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

export const parseBankStatement = async (fileData: string, mimeType: string = 'text/plain') => {
  try {
    const promptInstructions = `You are a financial data parser. 
      Analyze the provided bank statement file (image or PDF) and extract transactions.
      
      RULES:
      1. Find all transactions. Ignore legal text, headers, and footers.
      2. Date Format: Convert to ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).
      3. Amount: POSITIVE number.
      4. Type: 'income' or 'expense'.
      5. Category: Map strictly to standard categories (Еда, Транспорт, Жилье, Развлечения, Здоровье, Покупки, Зарплата, Сбережения, Другое).
      6. Merchant: Extract the CLEAN merchant name (e.g. "Yandex Taxi", "Magnum", "Starbucks") from the description. Ignore transaction IDs or city names if possible.
      
      OUTPUT: Return ONLY a JSON Array of objects.`;

    const parts: any[] = [{ text: promptInstructions }];

    // Check if it's an image or PDF to use inlineData
    if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
      parts.push({ inlineData: { mimeType, data: fileData } });
    } else {
      // Fallback for plain text
      parts.push({ text: `Data Content:\n${fileData.slice(0, 15000)}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              category: { type: Type.STRING },
              merchant: { type: Type.STRING, description: 'Clean name of the merchant/shop' },
              description: { type: Type.STRING },
              date: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['income', 'expense'] }
            },
            required: ['amount', 'category', 'type', 'date']
          }
        }
      }
    });

    let text = response.text;
    if (!text) return [];

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) text = jsonMatch[0];
    else text = text.replace(/```json|```/g, '');

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Statement Parse Error:", error);
    throw new Error(error instanceof Error ? error.message : "Не удалось обработать файл.");
  }
};

export const getBudgetAdvice = async (income: number, expenses: number, currency: string, language: Language = 'ru') => {
  try {
    const langName = language === 'ru' ? 'Russian' : language === 'kz' ? 'Kazakh' : 'English';
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User has Income: ${income} ${currency}, Expenses: ${expenses} ${currency}.
      Analyze their budget health based on the 50/30/20 rule.
      Calculate strictly how much EXACTLY they can save.
      CRITICAL: The response 'message' and 'actionItems' MUST be in ${langName} language.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            savingsPotential: { type: Type.NUMBER },
            message: { type: Type.STRING },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return null;
  } catch (error) {
    return null;
  }
};

export const predictCategoryBudget = async (transactions: Transaction[], currency: string, language: Language = 'ru') => {
  try {
    const summary = transactions
      .filter(t => t.type === 'expense')
      .map(t => `${t.date}: ${t.category} ${t.amount}`)
      .join('\n');

    const langName = language === 'ru' ? 'Russian' : language === 'kz' ? 'Kazakh' : 'English';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on these past transactions, estimate a reasonable MONTHLY budget limit for each category.
      Transactions Data: ${summary.slice(0, 15000)}
      Return a JSON array with category and suggested limit amount in ${currency}. 
      Ensure category names match the input EXACTLY (in ${langName} if present).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              limit: { type: Type.NUMBER }
            },
            required: ['category', 'limit']
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return [];
  } catch (error) {
    return [];
  }
};

export const getMonthlyAnalysis = async (transactions: Transaction[], monthName: string, currency: string, language: Language = 'ru') => {
    try {
        const expenseSummary = transactions
            .filter(t => t.type === 'expense')
            .map(t => `${t.category}: ${t.amount}`)
            .join(', ');
        
        const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        const langName = language === 'ru' ? 'Russian' : language === 'kz' ? 'Kazakh' : 'English';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze spending for ${monthName}.
            Income: ${incomeTotal} ${currency}, Expenses: ${expenseTotal} ${currency}.
            Transactions: ${expenseSummary.slice(0, 5000)}.
            
            1. 'funnyComment': A friendly, encouraging, or slightly witty (but kind) comment about their spending behavior. Avoid roasting or being rude. Be supportive.
            2. 'advice': A single, actionable, and positive financial tip for next month based on this data.
            
            Language: ${langName}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        funnyComment: { type: Type.STRING },
                        advice: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return { funnyComment: "Упс, я не смог придумать шутку, но вы все равно молодец!", advice: "Продолжайте вести учет, это главное." };
    } catch (e) {
        return null;
    }
};

// --- Chat Assistant Tools ---

const createGoalTool: FunctionDeclaration = {
    name: 'create_savings_goal',
    description: 'Creates a new empty savings goal.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        amount: { type: Type.NUMBER },
      },
      required: ['name', 'amount'],
    },
};

const addTransactionTool: FunctionDeclaration = {
    name: 'add_transaction',
    description: 'Adds an income or expense.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        description: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['income', 'expense'] },
        dateOffset: { type: Type.NUMBER }
      },
      required: ['amount', 'category', 'type']
    }
};

const addRecurringTool: FunctionDeclaration = {
    name: 'add_recurring_expense',
    description: 'Adds a recurring expense like a subscription or loan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['subscription', 'loan'] },
        months: { type: Type.NUMBER }
      },
      required: ['name', 'amount', 'type']
    }
};

const addInvestmentTool: FunctionDeclaration = {
    name: 'add_investment',
    description: 'Adds an investment asset AND records the expense.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        type: { type: Type.STRING, enum: ['deposit', 'stocks', 'crypto', 'property', 'other'] },
        ticker: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
        price: { type: Type.NUMBER }
      },
      required: ['name', 'amount', 'type']
    }
};

const topUpGoalTool: FunctionDeclaration = {
    name: 'top_up_savings_goal',
    description: 'Adds funds to an existing savings goal AND records the expense.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        goalName: { type: Type.STRING },
        amount: { type: Type.NUMBER }
      },
      required: ['goalName', 'amount']
    }
};

export const chatWithFinancialAdvisor = async (
  currentMessage: string, 
  history: ChatMessage[],
  transactions: Transaction[], 
  strategy: BudgetStrategy,
  savingsGoals: SavingsGoal[],
  language: Language = 'ru'
) => {
  try {
    const lastTransactions = transactions
      .slice(0, 25)
      .map(t => `${t.date.split('T')[0]}: ${t.type} ${t.amount} (${t.category}) - ${t.description}`)
      .join('\n');

    const goalsList = savingsGoals.map(g => `${g.name}: ${g.savedAmount} / ${g.amount}`).join('\n');

    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    
    const langName = language === 'ru' ? 'Russian' : language === 'kz' ? 'Kazakh' : 'English';

    const systemPrompt = `You are 'Finguru', a financial agent.
    CURRENT STATE:
    - Today: ${new Date().toLocaleDateString()}
    - Balance: ${balance}
    - Recent Tx: \n${lastTransactions}
    - Goals: \n${goalsList}

    INSTRUCTIONS:
    1. Answer in ${langName}.
    2. STRICTLY NO HALLUCINATIONS. Only call tools if explicitly requested.
    3. Use tools: 'add_investment', 'top_up_savings_goal', 'create_savings_goal', 'add_transaction', 'add_recurring_expense'.
    4. Be helpful and encouraging.`;

    const MAX_HISTORY = 20;
    const recentHistory = history.slice(-MAX_HISTORY).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...recentHistory,
        { role: 'user', parts: [{ text: currentMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        temperature: 0, 
        tools: [{ functionDeclarations: [createGoalTool, addTransactionTool, addRecurringTool, addInvestmentTool, topUpGoalTool] }],
      }
    });

    return {
        text: response.text,
        functionCalls: response.functionCalls
    };

  } catch (error) {
    console.error("Assistant Chat Error:", error);
    return { text: "Извините, произошла ошибка связи с ИИ." };
  }
};