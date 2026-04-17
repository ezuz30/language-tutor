import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Placeholder from './pages/Placeholder';
import Reading from './pages/Reading';
import Speaking from './pages/Speaking';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/read" element={<Reading />} />
        <Route path="/listen" element={<Placeholder title="Listening mode" />} />
        <Route path="/speak" element={<Speaking />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}
