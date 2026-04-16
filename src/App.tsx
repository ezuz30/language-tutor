import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/read" element={<Placeholder title="Reading mode" />} />
        <Route path="/listen" element={<Placeholder title="Listening mode" />} />
        <Route path="/speak" element={<Placeholder title="Speaking mode" />} />
        <Route path="/history" element={<Placeholder title="History" />} />
      </Routes>
    </BrowserRouter>
  );
}
