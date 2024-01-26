import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoutes from "./utils";

import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Login from "./pages/Login";
import { useToast } from "./context/ToastContext";
import ToastWrapper from "./components/Toast";

function App() {
  const { toasts } = useToast();

  return (
    <>
      <ToastWrapper toasts={toasts} />
      <Router>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route element={<Dashboard />} path="/" />
            <Route element={<Dashboard />} path="/dashboard" />
            <Route element={<Sales />} path="/pedidos" />
          </Route>
          <Route element={<Login />} path="/login" />
        </Routes>
      </Router>
    </>
  );
}

export default App;
