import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import Agents from './pages/Agents';
import Layout from './components/Layout';

function App() {
  const [token, setToken] = useState(localStorage.getItem('agentcart_token'));

  if (!token) {
    return <Login onLogin={(t) => { setToken(t); localStorage.setItem('agentcart_token', t); }} />;
  }

  return (
    <Layout onSignOut={() => { setToken(null); localStorage.removeItem('agentcart_token'); }}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/products" element={<Products />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;