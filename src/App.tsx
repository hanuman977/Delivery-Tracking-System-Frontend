import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { OperatorDashboard } from "./pages/OperatorDashboard";
import { CustomerTracking } from "./pages/CustomerTracking";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import { PackageIcon, UserIcon } from "lucide-react";
function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex items-center flex-shrink-0">
              <PackageIcon className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                LogisticHub
              </span>
            </div>
            <div className="flex ml-6 space-x-8">
              <NavLink
                to="/track"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                <PackageIcon className="w-4 h-4 mr-2" />
                Track Delivery
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Operator Dashboard
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <OperatorDashboard />
              </ProtectedRoute>
            } />
            {/* Tracking routes */}
            <Route path="/track" element={<CustomerTracking />} />
            <Route path="/track/:trackingId" element={<CustomerTracking />} />
            {/* Back-compat: keep root pointing to tracking page */}
            <Route path="/" element={<CustomerTracking />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
