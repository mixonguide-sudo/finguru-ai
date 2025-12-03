
import { Currency } from '../types';

// Default Fallback Rates relative to KZT
const DEFAULT_RATES: Record<Currency, number> = {
  'KZT': 1,
  'USD': 495.0,
  'EUR': 535.0,
  'RUB': 5.2
};

const CACHE_KEY = 'finguru_currency_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getStoredRates = (): Record<Currency, number> => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
            const { rates, timestamp } = JSON.parse(stored);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return rates;
            }
        }
    } catch (e) {
        console.error("Error reading rates", e);
    }
    return DEFAULT_RATES;
};

export const updateExchangeRates = async (): Promise<void> => {
    try {
        // Using a free API (open.er-api.com)
        const response = await fetch('https://open.er-api.com/v6/latest/KZT');
        if (response.ok) {
            const data = await response.json();
            const apiRates = data.rates; // 1 KZT = x USD

            // We need 1 USD = x KZT, so we invert
            const newRates: Record<Currency, number> = {
                'KZT': 1,
                'USD': 1 / apiRates.USD,
                'EUR': 1 / apiRates.EUR,
                'RUB': 1 / apiRates.RUB
            };

            // Sanity check
            if (newRates.USD > 100 && newRates.RUB > 1) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    rates: newRates,
                    timestamp: Date.now()
                }));
            }
        }
    } catch (e) {
        console.warn("Failed to fetch rates, using defaults");
    }
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
  if (from === to) return amount;

  const rates = getStoredRates();
  const fromRate = rates[from as Currency] || DEFAULT_RATES[from as Currency] || 1;
  const toRate = rates[to as Currency] || DEFAULT_RATES[to as Currency] || 1;

  // Convert to KZT first, then to target
  // Rates structure: 1 USD = 495 KZT
  const amountInKzt = amount * fromRate;
  const result = amountInKzt / toRate;

  return parseFloat(result.toFixed(2));
};

export const getExchangeRate = (currency: Currency): number => {
    const rates = getStoredRates();
    return rates[currency] || DEFAULT_RATES[currency] || 1;
};

export const AVAILABLE_CURRENCIES: Currency[] = ['KZT', 'USD', 'EUR', 'RUB'];
