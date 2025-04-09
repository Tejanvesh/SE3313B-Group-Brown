import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        console.log("User logged in:", data.user.username);

        console.log("Login successful");
        navigate("/messages");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred while logging in. Please try again later.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3><b>Login</b></h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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