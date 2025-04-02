import React, { useState, useEffect } from "react";
import "./Messages.css";

function Messages() {
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handlePlusClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Debounce API call when searchQuery changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        fetch(`http://localhost:5000/searchUsers?query=${encodeURIComponent(searchQuery)}`)
          .then(response => response.json())
          .then(data => {
            setSearchResults(data);
          })
          .catch(err => {
            console.error("Error fetching search results:", err);
          });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="messages-container">
      <div className="contacts">
        <div className="contacts-header">
          <h2>Contacts</h2>
          <button className="add-contact" onClick={handlePlusClick}>+</button>
        </div>
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

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Search Users</h3>
              <button className="close-popup" onClick={handleClosePopup}>X</button>
            </div>
            <div className="search-input-div">
                <input
                className="search-input"
                type="text"
                placeholder="Type to search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                />
            </div>
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((username, index) => (
                    <li key={index}>
                            {username}
                            <button className="add-friend-button">Add</button>
                    </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
