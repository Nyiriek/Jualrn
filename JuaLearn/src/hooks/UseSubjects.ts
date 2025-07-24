import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Subject {
  id: number;
  name: string;
  description: string;
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

  const fetchSubjects = useCallback(() => {
    if (!token) return;
    setLoading(true);
    axios.get('/api/subjects/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setSubjects(res.data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to load subjects');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, error, refreshSubjects: fetchSubjects };
}
