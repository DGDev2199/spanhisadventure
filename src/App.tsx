import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TutorialProvider } from "./components/tutorial";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FeatureGate from "./components/FeatureGate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardRouter from "./components/DashboardRouter";
import PlacementTest from "./pages/PlacementTest";
import TakeCustomTest from "./pages/TakeCustomTest";
import TakeReevaluationTest from "./pages/TakeReevaluationTest";
import ProfileVerification from "./pages/ProfileVerification";
import PendingApproval from "./pages/PendingApproval";
import BrowseTeachers from "./pages/BrowseTeachers";
import Feed from "./pages/Feed";
import DevPanel from "./pages/DevPanel";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import "./i18n/config";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FeatureFlagsProvider>
          <AuthProvider>
            <TutorialProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dev-panel" element={<DevPanel />} />
                <Route
                  path="/profile-verification"
                  element={
                    <ProtectedRoute>
                      <ProfileVerification />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pending-approval"
                  element={
                    <ProtectedRoute>
                      <PendingApproval />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/browse-teachers"
                  element={
                    <ProtectedRoute requiredRole={['student']}>
                      <FeatureGate feature="browse_teachers" fallback={<NotFound />}>
                        <BrowseTeachers />
                      </FeatureGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/placement-test"
                  element={
                    <ProtectedRoute requiredRole={['student']}>
                      <FeatureGate feature="placement_test" fallback={<NotFound />}>
                        <PlacementTest />
                      </FeatureGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test/:assignmentId"
                  element={
                    <ProtectedRoute requiredRole={['student']}>
                      <FeatureGate feature="custom_tests" fallback={<NotFound />}>
                        <TakeCustomTest />
                      </FeatureGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/take-reevaluation-test/:testId"
                  element={
                    <ProtectedRoute requiredRole={['student']}>
                      <TakeReevaluationTest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feed"
                  element={
                    <ProtectedRoute>
                      <FeatureGate feature="community_feed" fallback={<NotFound />}>
                        <Feed />
                      </FeatureGate>
                    </ProtectedRoute>
                  }
                />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TutorialProvider>
          </AuthProvider>
        </FeatureFlagsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
