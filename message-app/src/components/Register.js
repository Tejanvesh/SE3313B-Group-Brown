import React from "react";
import { Link, useNavigate } from "react-router-dom";


function Register() {
    const navigate = useNavigate();
    return (
        <div className="container">
            <div className="card">
                <h3><b>Register</b></h3>
                <form>
                    <input type="text" placeholder="Username" />
                    <input type="password" placeholder="Password" />
                    <button onClick={() => navigate('/')} type="submit">Sign Up</button>
                </form>
                <p>Already have an account? <Link to="/">Login here</Link></p>
            </div>
        </div>
    );
}

export default Register;
