import { useState, useEffect } from 'react';

export function useFetchJson<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}${path}`)
      .then(r => r.json())
      .then(setData);
  }, [path]);
  return data;
}
