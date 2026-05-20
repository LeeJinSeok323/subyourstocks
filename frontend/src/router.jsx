import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Screening from './pages/Screening';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import MarketTrend from './pages/MarketTrend';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,         element: <Dashboard /> },
      { path: 'screening',   element: <Screening /> },
      { path: 'watchlist',   element: <Watchlist /> },
      { path: 'portfolio',   element: <Portfolio /> },
      { path: 'market',      element: <MarketTrend /> },
    ],
  },
]);

export default router;
