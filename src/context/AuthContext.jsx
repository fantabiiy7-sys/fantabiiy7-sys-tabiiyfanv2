import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

async function fetchIsAdmin() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // Tarmoq yoki brauzer muammosida yuklanish cheksiz davom etmasin
    const guard = setTimeout(() => active && setLoading(false), 6000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        setIsAdmin(data.session ? await fetchIsAdmin() : false);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(guard);
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Supabase tavsiyasi: callback ichida to'g'ridan-to'g'ri await qilmaslik
      setTimeout(async () => {
        const admin = s ? await fetchIsAdmin() : false;
        if (active) setIsAdmin(admin);
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(guard);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const admin = await fetchIsAdmin();
    if (!admin) {
      await supabase.auth.signOut();
      const e = new Error('not_admin');
      e.code = 'not_admin';
      throw e;
    }
    setSession(data.session);
    setIsAdmin(true);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
