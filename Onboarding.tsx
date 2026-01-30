
import React, { useState } from 'react';
import { Shield, User, LogIn, UserPlus, Mail, Lock, UserCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface OnboardingProps {
  onAuthSuccess: (user: UserType) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [managerName, setManagerName] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !managerName) {
      setError('Por favor rellena todos los campos');
      return;
    }

    const usersJson = localStorage.getItem('mansos_users') || '[]';
    const users: UserType[] = JSON.parse(usersJson);

    if (users.some(u => u.email === email)) {
      setError('Este correo ya está registrado');
      return;
    }

    const newUser: UserType = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      password, // In real apps, never store passwords in plain text!
      managerName
    };

    localStorage.setItem('mansos_users', JSON.stringify([...users, newUser]));
    onAuthSuccess(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const usersJson = localStorage.getItem('mansos_users') || '[]';
    const users: UserType[] = JSON.parse(usersJson);

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onAuthSuccess(user);
    } else {
      setError('Correo o contraseña incorrectos');
    }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
            <p className="text-slate-400">Accede a tu equipo y liga</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-rose-400 text-sm text-center bg-rose-400/10 py-2 rounded-lg">{error}</p>}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="email"
                placeholder="Correo Electrónico"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              Entrar
            </button>
            <button type="button" onClick={() => setView('register')} className="w-full text-slate-400 hover:text-white transition-colors text-sm">
              ¿No tienes cuenta? <span className="text-indigo-400 font-bold">Regístrate</span>
            </button>
            <button type="button" onClick={() => setView('welcome')} className="w-full text-slate-500 hover:text-slate-300 transition-colors text-xs pt-2">
              Volver
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
            <p className="text-slate-400">Únete al ecosistema Mansos League</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-rose-400 text-sm text-center bg-rose-400/10 py-2 rounded-lg">{error}</p>}
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Nombre de Manager (ej. ProGamer99)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="email"
                placeholder="Correo Electrónico"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              Registrarse
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 hover:text-white transition-colors text-sm">
              ¿Ya tienes cuenta? <span className="text-indigo-400 font-bold">Inicia Sesión</span>
            </button>
            <button type="button" onClick={() => setView('welcome')} className="w-full text-slate-500 hover:text-slate-300 transition-colors text-xs pt-2">
              Volver
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-8 shadow-2xl shadow-indigo-500/40">M</div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none uppercase">
            Mansos<br/><span className="text-indigo-500">League</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-sm leading-relaxed">
            La ingeniería del fútbol virtual. Gestiona tu presupuesto, blinda a tu capitán y domina la liga.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setView('login')}
            className="w-full group relative bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-indigo-500 transition-all text-left flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <LogIn size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Iniciar Sesión</h3>
              <p className="text-sm text-slate-500">Accede a tu cuenta existente.</p>
            </div>
          </button>

          <button 
            onClick={() => setView('register')}
            className="w-full group relative bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500 transition-all text-left flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Registrarse</h3>
              <p className="text-sm text-slate-500">Crea una nueva identidad de manager.</p>
            </div>
          </button>
        </div>
      </div>
      
      <div className="fixed bottom-8 text-center w-full text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
        Propulsado por Inteligencia Artificial & Ingeniería Social
      </div>
    </div>
  );
};

export default Onboarding;
