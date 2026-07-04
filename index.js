import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [uploadStatus, setUploadStatus] = useState('');
  const iframeRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace('/login');
  }, [session, router]);

  useEffect(() => {
    async function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || msg.type !== 'reel-rendered') return;

      setUploadStatus('Uploading to shared gallery…');
      try {
        const blob = msg.blob;
        const fileName = `${session.user.id}/${Date.now()}.webm`;

        const { error: uploadError } = await supabase.storage
          .from('reels')
          .upload(fileName, blob, { contentType: 'video/webm' });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('reels').getPublicUrl(fileName);

        const { error: insertError } = await supabase.from('projects').insert({
          user_email: session.user.email,
          title: msg.title || 'Untitled listing reel',
          video_url: publicUrlData.publicUrl,
          duration_seconds: msg.duration || null,
        });
        if (insertError) throw insertError;

        setUploadStatus('Saved to shared gallery ✓');
        setTimeout(() => setUploadStatus(''), 4000);
      } catch (err) {
        console.error(err);
        setUploadStatus('Upload failed: ' + err.message);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session]);

  if (!session) return <div className="empty">Loading…</div>;

  return (
    <div>
      <div className="topbar">
        <div className="brand">Listing Reel <span>Studio</span></div>
        <div className="nav">
          <span style={{ fontSize: 12, color: 'var(--ivory-dim)', marginRight: 12 }}>
            {uploadStatus || session.user.email}
          </span>
          <a href="/gallery">Team gallery</a>
          <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>Sign out</a>
        </div>
      </div>
      <iframe ref={iframeRef} className="studio-frame" src="/studio.html" title="Reel Studio" />
    </div>
  );
}
