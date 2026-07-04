import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="center-card">
      <h1>Listing Reel Studio</h1>
      <p>
        {sent
          ? 'Check your inbox — we sent a sign-in link to ' + email
          : 'Enter your office email. We will send a one-click sign-in link, no password needed.'}
      </p>
      {!sent && (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="you@youroffice.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Sending…' : 'Send sign-in link'}
          </button>
        </form>
      )}
      {error && <p style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</p>}
    </div>
  );
}
