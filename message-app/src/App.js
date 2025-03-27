import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Messages from "./components/Messages";  // Import the Messages component

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the Login page */}
        <Route path="/" element={<Login />} />

        {/* Route for the Messages page */}
        <Route path="/Messages" element={<Messages />} />
      </Routes>
    </Router>
  );
}

export default App;
