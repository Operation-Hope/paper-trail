/**
 * Main application component with React Router setup
 * Defines routes for Politician Search, Donor Search, and Feedback pages
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PoliticianSearch from './pages/PoliticianSearch';
import DonorSearch from './pages/DonorSearch';
import Feedback from './pages/Feedback';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoliticianSearch />} />
        <Route path="/donor_search" element={<DonorSearch />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
