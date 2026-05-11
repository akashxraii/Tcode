import Navbar from "./components/navbar"
import Home from "./pages/home"
import ProblemWorkspace from "./pages/problemWorkspace"
import Problems from "./pages/problems"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import './App.css'

function AppRoutes() {
  const location = useLocation();
  const isWorkspace = /^\/problems\/[^/]+/.test(location.pathname);

  return (
    <>
      {!isWorkspace && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:slug" element={<ProblemWorkspace key={location.pathname} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
