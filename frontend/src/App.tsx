/**
 * Main application component with React Router setup
 * Defines routes for Unified Search and Feedback pages
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import UnifiedSearch from './pages/UnifiedSearch';
import Feedback from './pages/Feedback';
import { CommandPalette } from './components/CommandPalette';
import { Toaster } from './components/ui/sonner';
import './index.css';

function AppContent() {
  return (
    <>
      <CommandPalette />
      <Toaster />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Unified search routes */}
            <Route path="/" element={<UnifiedSearch />} />
            <Route path="/politician" element={<UnifiedSearch />} />
            <Route path="/politician/:id" element={<UnifiedSearch />} />
            <Route path="/politician/compare" element={<UnifiedSearch />} />
            <Route path="/donor" element={<UnifiedSearch />} />
            <Route path="/donor/:id" element={<UnifiedSearch />} />

            {/* Other routes */}
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
