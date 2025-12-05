import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  phase: number;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  isEnabled: (featureKey: string) => boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('phase', { ascending: true })
        .order('feature_name', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const isEnabled = (featureKey: string): boolean => {
    const flag = flags.find(f => f.feature_key === featureKey);
    return flag?.is_enabled ?? false;
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refetch: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

export const useFeatureFlag = (featureKey: string): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(featureKey);
};
