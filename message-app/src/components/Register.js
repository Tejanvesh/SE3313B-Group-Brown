import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    // State to hold form data
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password || !email) {
            setError("All fields are required");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/addUser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/");
            } else {
                setError(data.error || "Failed to register");
            }
        } catch (error) {
            console.error("Error during registration:", error);
            setError("Failed to register. Please try again later.");
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h3><b>Register</b></h3>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Sign Up</button>
                </form>
                <p>Already have an account? <Link to="/">Login here</Link></p>
            </div>
        </div>
    );
}

export default Register;
