import React from 'react';
import { useFeatureFlag } from '@/contexts/FeatureFlagsContext';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback = null }) => {
  const isEnabled = useFeatureFlag(feature);
  
  if (!isEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default FeatureGate;
