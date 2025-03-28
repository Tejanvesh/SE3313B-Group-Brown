import React from "react";
import "./Login.css";

import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    return (
        <div className="container">
            <div className="card">
                <h3><b>Login</b></h3>
                <form>
                    <input type="text" placeholder="Username" />
                    <input type="password" placeholder="Password" />
                    <button onClick={() => navigate('/Messages')}>Login</button>
                </form>
                <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
        </div>
    );
}

export default Login;
