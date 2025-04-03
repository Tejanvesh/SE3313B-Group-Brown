import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Import the CSS file with your styling

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("/login", { username, password });
      // Assuming the login is successful and session cookies are handled automatically
      navigate("/Messages");
    } catch (err) {
      // Display the error message from the server or a default error message
      setError(err.response?.data?.message || "An error occurred during login.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3>
          <b>Login</b>
        </h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
