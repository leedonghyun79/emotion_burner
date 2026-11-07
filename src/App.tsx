import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      if (location.key !== 'default') {
        navigate(-1);
      } else {
        window.history.pushState({ page: 'root' }, '', '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, location]);

  return null;
}

function AppRoutes() {
  const { isOnboardingComplete } = useApp();

  if (!isOnboardingComplete) {
    return (
      <>
        <BackButtonHandler />
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <BackButtonHandler />
      <Routes>
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
