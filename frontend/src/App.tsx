/**
 * Main application component with React Router setup
 * Defines routes for Politician Search, Donor Search, and Feedback pages
 */
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import PoliticianSearch from './pages/PoliticianSearch';
import DonorSearch from './pages/DonorSearch';
import Feedback from './pages/Feedback';
import { CommandPalette } from './components/CommandPalette';
import type { Politician } from './types/api';
import './index.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectPolitician = (politician: Politician) => {
    // Navigate to home if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }

    // Dispatch custom event that PoliticianSearch can listen to
    const event = new CustomEvent('selectPoliticianFromCommand', {
      detail: politician,
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <CommandPalette onSelectPolitician={handleSelectPolitician} />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PoliticianSearch />} />
            <Route path="/donor_search" element={<DonorSearch />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
