import React from "react";
import "./Messages.css";

function Messages() {
    return (
        <div className="messages-container">
            <div className="contacts">
                <h2>Contacts</h2>
                <ul>
                    <li>Contact 1</li>
                    <li>Contact 2</li>
                    <li>Contact 3</li>
                    <li>Contact 4</li>
                    <li>Contact 5</li>
                </ul>
            </div>
            <div className="message-section">
                <h2>Chat</h2>

                <div className="messages">
                    <div className="message">Hello, how are you?</div>
                    <div className="message">I am good, thanks! How about you?</div>
                    <div className="message">Good too, just working on the app!</div>
                </div>
                <div className="message-input">
                    <input type="text" placeholder="Type a message..." />
                    <button>Send</button>
                </div>
            </div>
        </div>
    );
}

export default Messages;
