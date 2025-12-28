import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback = null }) => {
  const { isEnabled, loading } = useFeatureFlags();
  
  // Show loading spinner while feature flags are being fetched
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isEnabled(feature)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default FeatureGate;
