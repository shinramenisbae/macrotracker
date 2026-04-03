import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import WeightPage from './pages/WeightPage';
import HistoryPage from './pages/HistoryPage';
import FoodDetailPage from './pages/FoodDetailPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/weight" element={<WeightPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/entry/:id" element={<FoodDetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
