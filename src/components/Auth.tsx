import { useState } from 'react';
import { BookOpen, LogIn, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUp(email, password, fullName)
        : await signIn(email, password);

      if (result.error) {
        setError(result.error.message || 'Ocorreu um erro. Tente novamente.');
      } else if (isSignUp) {
        // Sucesso no cadastro
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-dark-900 rounded-3xl shadow-2xl p-8 border border-dark-800 relative overflow-hidden">
          {/* Decorativo discreto */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-3xl" />

          {/* Logo */}
          <div className="flex items-center justify-center mb-8 relative z-10">
            <div className="bg-cream-100 p-3 rounded-2xl shadow-lg shadow-black/20">
              <BookOpen className="w-8 h-8 text-dark-950" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-center text-cream-100 mb-2 tracking-tight transition-all">
            BookMind
          </h1>
          <p className="text-center text-cream-200/50 mb-8 font-medium">
            Gerenciador Inteligente de Leituras
          </p>

          {/* Tab buttons */}
          <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-2xl border border-dark-800">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all duration-300 ${!isSignUp
                ? 'bg-dark-700 text-cream-100 shadow-xl'
                : 'text-cream-200/40 hover:text-cream-100'
                }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all duration-300 ${isSignUp
                ? 'bg-dark-700 text-cream-100 shadow-xl'
                : 'text-cream-200/40 hover:text-cream-100'
                }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-cream-200/60 uppercase tracking-widest px-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700 rounded-2xl text-cream-100 placeholder-dark-700 focus:outline-none focus:border-cream-100/30 focus:ring-4 focus:ring-cream-100/5 transition-all"
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-cream-200/60 uppercase tracking-widest px-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700 rounded-2xl text-cream-100 placeholder-dark-700 focus:outline-none focus:border-cream-100/30 focus:ring-4 focus:ring-cream-100/5 transition-all"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-cream-200/60 uppercase tracking-widest px-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-dark-800/50 border border-dark-700 rounded-2xl text-cream-100 placeholder-dark-700 focus:outline-none focus:border-cream-100/30 focus:ring-4 focus:ring-cream-100/5 transition-all"
                placeholder="········"
                required
                minLength={6}
                disabled={loading}
              />
              {isSignUp && (
                <p className="text-[10px] text-dark-700 font-bold uppercase tracking-wide px-1">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-sm font-medium text-red-400 text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm font-medium text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-black/40 transform active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-dark-950 border-t-transparent"></div>
                  <span>Processando...</span>
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5 mb-0.5" />
                  <span>Criar Conta</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mb-0.5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
