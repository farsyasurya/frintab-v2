import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import GroupDetail from '@/pages/GroupDetail';
import Notifications from '@/pages/Notifications';
import DashboardLayout from '@/components/DashboardLayout';
import PengajuanMe from '@/pages/PengajuanMe';
import Profile from '@/pages/Profile';
import SuperAdmin from '@/pages/SuperAdmin';

import Helpdesk from '@/pages/Helpdesk';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminHelpdesk from '@/pages/AdminHelpdesk';
import HelpdeskDetail from '@/pages/HelpdeskDetail';
import AdminHelpdeskDetail from '@/pages/AdminHelpdeskDetail';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route element={<DashboardLayout />}>
          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifikasi"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengajuan-me"
            element={
              <ProtectedRoute>
                <PengajuanMe />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

            <Route
              path="/helpdesk/:ticketId"
              element={
                <ProtectedRoute>
                  <HelpdeskDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/helpdesk/:ticketId"
              element={
                <ProtectedRoute>
                  <AdminHelpdeskDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <Helpdesk />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/helpdesk"
              element={
                <ProtectedRoute>
                  <AdminHelpdesk />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute>
                  <SuperAdmin />
                </ProtectedRoute>
              }
            />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
