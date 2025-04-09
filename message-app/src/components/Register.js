import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Register() {
    const navigate = useNavigate();

    // State to hold form data
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password || !email) {
            setError("All fields are required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            setIsLoading(true);
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
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error during registration:", error);
            setError("Failed to register. Please try again later.");
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <div className="brand">
                    <div className="brand-name">RealTalk++</div>
                </div>

                <h3>Create Account</h3>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Sign Up"}
                    </button>

                </form>
                <p>Already have an account? <Link to="/">Login here</Link></p>
            </div>
        </div>
    );
}

export default Register;
