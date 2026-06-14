import { useState, useCallback } from 'react';
import { fetch as Fetch } from '../utils/request';
import { activity_api, login_api } from '../config/api';

interface Activity {
  name: string;
  activeId?: number;
  courseId?: string | number;
  classId?: string | number;
  otherId?: string | number;
}

export function useActivity() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const detectActivity = useCallback(async (userParams: UserParamsType) => {
    setLoading(true);
    setError('');
    setActivity(null);

    try {
      // Check if credentials need refresh (5 days)
      if (Date.now() - new Date(userParams.date).getTime() > 432000000) {
        const refreshed = await Fetch(login_api, {
          method: 'POST',
          body: {
            phone: userParams.phone,
            password: userParams.password,
          },
        });
        if (refreshed === 'AuthFailed') {
          setError('sign.authRequired');
          setLoading(false);
          return null;
        }
        // Update userParams with refreshed credentials
        userParams = { ...userParams, ...refreshed, date: new Date() };
      }

      const result = await Fetch(activity_api, {
        method: 'POST',
        body: {
          uf: userParams.uf,
          _d: userParams._d,
          vc3: userParams.vc3,
          uid: userParams._uid,
        },
      });

      switch (result) {
        case 'NoActivity':
          setError('sign.noActivity');
          break;
        case 'AuthRequired':
          setError('sign.authRequired');
          break;
        case 'NoCourse':
          setError('sign.noCourse');
          break;
        default:
          setActivity(result as Activity);
          setLoading(false);
          return result as Activity;
      }
    } catch (e) {
      setError('common.error');
    }

    setLoading(false);
    return null;
  }, []);

  const clearActivity = useCallback(() => {
    setActivity(null);
    setError('');
  }, []);

  return { activity, loading, error, detectActivity, clearActivity };
}

export type { Activity };
