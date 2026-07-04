import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Gallery() {
  const [session, setSession] = useState(undefined);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (session === null) router.replace('/login');
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProjects(data || []);
        setLoading(false);
      });
  }, [session]);

  if (!session) return <div className="empty">Loading…</div>;

  return (
    <div>
      <div className="topbar">
        <div className="brand">Listing Reel <span>Studio</span></div>
        <div className="nav">
          <a href="/">Back to studio</a>
          <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>Sign out</a>
        </div>
      </div>

      {loading && <div className="empty">Loading gallery…</div>}
      {!loading && projects.length === 0 && (
        <div className="empty">No reels rendered yet — go make the first one.</div>
      )}
      <div className="gallery-grid">
        {projects.map((p) => (
          <div className="gallery-card" key={p.id}>
            <video src={p.video_url} controls preload="metadata" />
            <div className="gallery-meta">
              <strong>{p.title}</strong>
              {p.user_email} · {new Date(p.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
