import { useState } from 'react';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) throw new Error('Invalid passphrase');
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError('Invalid passphrase');
    }
  };

  return (
    <div className="min-h-screen bg-canvas-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-section-heading text-near-black tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-slate text-caption mt-2">{APP_TAGLINE}</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-8">
          <label className="block mb-2 text-caption text-muted-slate">Access Key</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter your passphrase"
            className="w-full border border-border-light rounded-sm px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-form-focus focus:border-transparent"
          />
          {error && <p className="text-error-red text-micro mt-2">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-6">Sign In</button>
        </form>
      </div>
    </div>
  );
}