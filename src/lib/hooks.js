import { useCallback, useEffect, useRef, useState } from 'react';
import { listTopics } from './api';

/** Asinxron yuklash: { data, loading, error, reload } */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const counter = useRef(0);

  const run = useCallback(async () => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === counter.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === counter.current) setState({ data: null, loading: false, error });
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run };
}

export function useTopics() {
  const res = useAsync(() => listTopics(), []);
  return { topics: res.data || [], loading: res.loading, reload: res.reload };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
