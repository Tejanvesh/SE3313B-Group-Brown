import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const baseURL = process.env.REACT_APP_API_BASE_URL;


function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${baseURL}/addUser`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            if (response.ok) {
                navigate("/");
            } else {
                console.log("Error creating user");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h3><b>Register</b></h3>
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
