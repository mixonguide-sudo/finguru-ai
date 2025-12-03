
import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../services/firebase';
import { Bot, Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPass) {
           throw new Error("Пароли не совпадают");
        }
        if (password.length < 6) {
           throw new Error("Пароль должен быть не менее 6 символов");
        }
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
       let msg = "Ошибка авторизации";
       if (err.message.includes("auth/invalid-email")) msg = "Некорректный Email";
       if (err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password") || err.message.includes("auth/invalid-credential")) msg = "Неверный логин или пароль";
       if (err.message.includes("auth/email-already-in-use")) msg = "Email уже зарегистрирован";
       if (err.message.includes("auth/weak-password")) msg = "Слишком слабый пароль";
       if (err.message === "Пароли не совпадают") msg = err.message;
       
       setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
          await loginWithGoogle();
      } catch (err) {
          setError("Не удалось войти через Google");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg pointer-events-none">
            <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 rotate-3 hover:rotate-6 transition-transform">
                    <Bot size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                    Finguru <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">AI</span>
                </h1>
                <p className="text-gray-400 text-sm">
                    Ваш умный финансовый ассистент
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-start gap-2 text-red-400 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 ml-1">Пароль</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {isRegistering && (
                    <div className="space-y-1 animate-slide-up">
                        <label className="text-xs font-medium text-gray-500 ml-1">Подтвердите пароль</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                            <input 
                                type="password" 
                                required
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        isRegistering ? (
                            <><UserPlus size={18} /> Зарегистрироваться</>
                        ) : (
                            <><LogIn size={18} /> Войти</>
                        )
                    )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900/80 text-gray-500">или</span>
                </div>
            </div>

            <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
            </button>

            <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                    {isRegistering ? "Уже есть аккаунт?" : "Нет аккаунта?"}
                    <button 
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors"
                    >
                        {isRegistering ? "Войти" : "Создать"}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};
