import { useCallback, useEffect, useRef, useState } from "react";

export function useLoad<T>(
  loader: () => Promise<T>,
  _dependencies: unknown[] = [],
) {
  const loaderRef = useRef(loader);
  // Keep refresh actions pointed at the latest route-specific loader.
  // eslint-disable-next-line react-hooks/refs
  loaderRef.current = loader;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      setData(await loaderRef.current());
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load data",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data, loading, refreshing, error, reload: () => load(true) };
}
