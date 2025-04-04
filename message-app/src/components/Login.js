import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Import the CSS file with your styling
const baseURL = process.env.REACT_APP_API_BASE_URL;


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post(`${baseURL}/login`, { email, password });
      localStorage.setItem("username", response.data.user.username); // Store the username in local storage
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
