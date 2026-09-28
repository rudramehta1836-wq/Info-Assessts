import React, { useState } from 'react';
import { api, setToken } from '../api';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('manager@city.gov');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Infrastructure System</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage city assets</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-3 font-medium text-center">Demo Accounts (Password: password)</p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button onClick={() => setEmail('manager@city.gov')} className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Manager:</span> manager@city.gov
            </button>
            <button onClick={() => setEmail('inspector@city.gov')} className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Inspector:</span> inspector@city.gov
            </button>
            <button onClick={() => setEmail('auditor@city.gov')} className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Auditor:</span> auditor@city.gov
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
