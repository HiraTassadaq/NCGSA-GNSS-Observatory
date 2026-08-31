
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Footer2 from './components/Footer2';
import Copilot from './components/Copilot';
import Glossary from './pages/Glossary';
import Home from './pages/Home';
import Contributor from './pages/Contributors/Contributor';
import Septentrio from './dashboard/Septentrio';
import Global from './dashboard/Global';
import Ublox from './dashboard/Ublox';
import ICTP from './dashboard/ICTP';
import './dashboardStyle.css';
import "./dashboard/Stylesheet/ictp.css";
const Dashboard = lazy(() => import('./pages/Dashboard'));

const Loading = () => (
  <div className="route-loading">
    <div className="spinner" />
    Loading observatory data…
  </div>
);

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Suspense fallback={<Loading />}>
          <Routes>

            {/* Landing Page */}
            <Route
              path="/"
              element={<Home />}
            />

            {/* Main Dashboard */}
            <Route
              path="/dashboards"
              element={<Dashboard />}
            />

            {/* Global Receiver */}
            <Route
              path="/dashboards/global"
              element={<Global />}
            />
            {/* Septentrio Receiver */}
            <Route
              path="/dashboards/septentrio"
              element={<Septentrio />}
            />
            {/* Ublox Receiver */}
            <Route
              path="/dashboards/ublox"
              element={<Ublox />}
            />
            {/* ICTP Receiver */}
            <Route
              path="/dashboards/ictp"
              element={<ICTP />}
            />

            {/* Copilot */}
            <Route
              path="/copilot"
              element={<Copilot />}
            />

            {/* Credits */}
            <Route
              path="/contributor"
              element={<Contributor />}
            />

            {/* Glossary */}
            <Route
              path="/glossary"
              element={<Glossary />}
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<Home />}
            />

          </Routes>
        </Suspense>
      </main>
      
    </>
  );
}