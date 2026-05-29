import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Doctors from './pages/Doctors/Doctors';
import Login from './pages/Login/Login';

// Placeholder Pages
const Users = () => <div style={{padding: 24}}><h2>Quản lý Tài khoản (Users)</h2><p>Trang này đang được phát triển...</p></div>;
const Patients = () => <div style={{padding: 24}}><h2>Quản lý Bệnh nhân (Patients)</h2><p>Trang này đang được phát triển...</p></div>;
const Appointments = () => <div style={{padding: 24}}><h2>Quản lý Lịch hẹn (Appointments)</h2><p>Trang này đang được phát triển...</p></div>;
const MedicalRecords = () => <div style={{padding: 24}}><h2>Bệnh án & Chẩn đoán AI (Medical Records)</h2><p>Trang này đang được phát triển...</p></div>;
const Prescriptions = () => <div style={{padding: 24}}><h2>Quản lý Thuốc (Prescriptions)</h2><p>Trang này đang được phát triển...</p></div>;
const Invoices = () => <div style={{padding: 24}}><h2>Hóa đơn & Thanh toán (Invoices)</h2><p>Trang này đang được phát triển...</p></div>;

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="patients" element={<Patients />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="records" element={<MedicalRecords />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="*" element={<div style={{padding: 24}}><h2>Không tìm thấy trang</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
