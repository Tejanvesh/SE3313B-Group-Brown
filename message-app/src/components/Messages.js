import React, { useState, useEffect } from "react";
import "./Messages.css";
const baseURL = process.env.REACT_APP_API_BASE_URL;

function Messages() {
  const currentUsername = localStorage.getItem("username");

  const [currentChatFriend, setCurrentChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // Fetch friends list when the component mounts
  useEffect(() => {
    fetch(`${baseURL}/getFriends/${encodeURIComponent(currentUsername)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.friends) {
          setFriends(data.friends);
        }
      })
      .catch((err) => {
        console.error("Error fetching friends:", err);
      });
  }, [currentUsername]);

  useEffect(() => {
    if (!currentChatFriend) return;
    fetch(
      `${baseURL}/getChat?sender=${encodeURIComponent(
        currentUsername
      )}&receiver=${encodeURIComponent(currentChatFriend)}`
    )
      .then((res) => res.json())
      .then((msgs) => {
        if (Array.isArray(msgs)) {
          setChatMessages(msgs);
        } else {
          setChatMessages([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching chat:", err);
      });
  }, [currentChatFriend, currentUsername]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentChatFriend) {
      return;
    }
    fetch(`${baseURL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: currentUsername,
        receiver: currentChatFriend,
        content: newMessage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setNewMessage("");
        if (!data.error) {
          fetch(
            `${baseURL}/getChat?sender=${encodeURIComponent(
              currentUsername
            )}&receiver=${encodeURIComponent(currentChatFriend)}`
          )
            .then((r) => r.json())
            .then((msgs) => {
              if (Array.isArray(msgs)) {
                setChatMessages(msgs);
              } else {
                setChatMessages([]);
              }
            })
            .catch((err) => console.error("Error re-fetching chat:", err));
        }
      })
      .catch((err) => {
        console.error("Error sending message:", err);
      });
  };

  const handlePlusClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSearchQuery("");
    setSearchResults([]);
    setFriendRequests([]);
    setSentRequests([]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // When popup opens, fetch friend requests
  useEffect(() => {
    if (showPopup) {
      fetch(
        `${baseURL}/getFriendRequests/${encodeURIComponent(currentUsername)}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.requests) {
            setFriendRequests(data.requests);
          }
        })
        .catch((err) => {
          console.error("Error fetching friend requests:", err);
        });
    }
  }, [showPopup, currentUsername]);

  // Fetch search results and updated friends list every time searchQuery changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        Promise.all([
          fetch(
            `${baseURL}/searchUsers?query=${encodeURIComponent(searchQuery)}`
          ).then((response) => response.json()),
          fetch(
            `${baseURL}/getFriends/${encodeURIComponent(currentUsername)}`
          ).then((response) => response.json()),
        ])
          .then(([searchData, friendsData]) => {
            if (friendsData.friends) {
              setFriends(friendsData.friends);
            }
            const filtered = searchData.filter(
              (username) => username !== currentUsername
            );
            setSearchResults(filtered);
          })
          .catch((err) => {
            console.error(
              "Error fetching search results or friends:",
              err
            );
          });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUsername]);

  const handleSendFriendRequest = (toUsername) => {
    if (currentUsername === toUsername) {
      alert("You cannot send a friend request to yourself.");
      return;
    }
    fetch(`${baseURL}/sendFriendRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUsername: currentUsername, toUsername }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message || "Friend request sent successfully");
        setSentRequests((prev) => [...prev, toUsername]);
      })
      .catch((err) => {
        console.error("Error sending friend request:", err);
      });
  };

  const handleRemoveFriend = (friendUsername) => {
    fetch(`${baseURL}/removeFriend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername, friendUsername }),
    })
      .then((response) => response.json())
      .then((data) => {
        setFriends(friends.filter((friend) => friend !== friendUsername));
        alert(data.message || "Friend removed successfully");
      })
      .catch((err) => {
        console.error("Error removing friend:", err);
      });
  };

  const handleAcceptRequest = (fromUsername) => {
    fetch(`${baseURL}/acceptFriendRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername, fromUsername }),
    })
      .then((response) => response.json())
      .then(() => {
        setFriendRequests(
          friendRequests.filter((req) => req !== fromUsername)
        );
        fetch(
          `${baseURL}/getFriends/${encodeURIComponent(currentUsername)}`
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.friends) {
              setFriends(data.friends);
            }
          })
          .catch((err) => {
            console.error("Error fetching friends:", err);
          });
      })
      .catch((err) => {
        console.error("Error accepting friend request:", err);
      });
  };

  const handleRejectRequest = (fromUsername) => {
    fetch(`${baseURL}/rejectFriendRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername, fromUsername }),
    })
      .then((response) => response.json())
      .then(() => {
        setFriendRequests(
          friendRequests.filter((req) => req !== fromUsername)
        );
      })
      .catch((err) => {
        console.error("Error rejecting friend request:", err);
      });
  };

  return (
    <div className="messages-container">
      <div className="contacts">
        <div className="contacts-header">
          <h2>Contacts</h2>
          <button className="add-contact" onClick={handlePlusClick}>
            +
          </button>
        </div>
        <ul>
          {friends.map((friend, index) => (
            <li
              key={index}
              onClick={() => setCurrentChatFriend(friend)}
              style={{
                cursor: "pointer",
                fontWeight:
                  currentChatFriend === friend ? "bold" : "normal",
              }}
            >
              {friend}
            </li>
          ))}
        </ul>
      </div>
      <div className="message-section">
        <h2>Chat with {currentChatFriend || "select a contact"}</h2>
        <div className="messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className="message">
              <strong>{msg.sender}: </strong>
              {msg.content}
              <div style={{ fontSize: "0.8em", color: "#666" }}>
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="message-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Add Friends</h3>
              <button className="close-popup" onClick={handleClosePopup}>
                X
              </button>
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
            {friendRequests.length > 0 && (
              <div className="friend-requests-section">
                <h4>Friend Requests</h4>
                <ul className="friend-requests-list">
                  {friendRequests.map((request, index) => (
                    <li key={index} className="friend-request-item">
                      <span>{request}</span>
                      <div>
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          className="accept-friend-button"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request)}
                          className="reject-friend-button"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((username, index) => {
                  const isFriend = friends.includes(username);
                  const isSent = sentRequests.includes(username);
                  return (
                    <li key={index}>
                      {username}
                      {isFriend ? (
                        <button
                          className="remove-friend-button"
                          onClick={() => handleRemoveFriend(username)}
                        >
                          Remove
                        </button>
                      ) : isSent ? (
                        <button className="sent-friend-button" disabled>
                          Sent
                        </button>
                      ) : (
                        <button
                          className="add-friend-button"
                          onClick={() => handleSendFriendRequest(username)}
                        >
                          Add
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
