import React, { useState, useEffect, useRef } from "react";
import "./Messages.css";
import { FaUserCircle } from "react-icons/fa";

function Messages() {
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [recpient, setRec] = useState(null);
  const [response, setResponse] = useState({ msg: "", timestamp: 0 });
  const [newMessage, setNewMessage] = useState("");
  const [profileVisible, setProfileVisible] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, forceRender] = useState(0);




  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);




  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  let isConnected = false;
  //console.log(storedUser.username);

  useEffect(() => {
    //const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(storedUser);
      console.log(currentUser)
    } else {
      console.log("No user found in localStorage");
    }
  }, []); // This runs once when the component mounts

  useEffect(() => {
    if (isLoggingOut) {
      console.log("Logout in progress, stopping further requests...");
      return; // Exit if logging out
    }

    const intervalId = setInterval(() => {
      if (currentUser && !isLoggingOut) {
        fetchFriendRequests(currentUser.username);
      }
    }, 5000); // Check every 5 seconds for new requests

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [currentUser, isLoggingOut]);


  // Create the WebSocket connection when the component mounts
  const handleConnectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:9001');

    socket.onopen = () => {
      console.log("Connected to server");
      if (storedUser) {
        socket.send('CONNECT ' + storedUser.username);
        setConnected(true);
      }
    };

    socket.onmessage = (event) => {
      console.log("Received from server: ", event.data);

      setResponse({
        msg: event.data.trim().split(" ").slice(1),
        timestamp: Date.now(),
        user: event.data.trim().split(" ")[0]// Store received message
      });
    };

    socket.onclose = () => {
      console.log("Disconnected from server");
      setConnected(false);
    };

    // Store the socket instance in state to use later
    setWs(socket);

    // Clean up on component unmount
    return () => {
      socket.close(); // Close the WebSocket connection
    };
  };

  useEffect(() => {


    console.log("The response is: " + response.msg);

    if (response.user === "YES") {
      sendMessage(recpient, newMessage);
      console.log("Message sent");
      // isConnected = true;
      handleSendMessage();
      //setNewMessage("");
    } else if (response.user === "NO") {
      handleSendMessage();
      //setNewMessage("");

      isConnected = false;
    } else {
      isConnected = true;
      console.log("User: " + response.user);
      console.log("Selected uSER: " + selectedUser);
      if (response.user == selectedUser) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { receiver: selectedUser, content: response.msg }
        ]);
      }



    }
    console.log("Updated response:", response);
  }, [response.timestamp]);

  function checkForUser(recp) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("CHECK " + recp);
      console.log('Sent: CHECK ' + recp);

    } else {
      console.log('WebSocket is not open');
    }
  };


  function sendMessage(recp, msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("SEND " + recp + " " + currentUser.username + " " + msg);
      console.log("Sent " + msg + " to" + recp + "from " + currentUser.username);
    } else {
      console.log('WebSocket is not open');
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetch(`http://localhost:5000/getChats?username=${currentUser.username}`)
        .then((response) => response.json())
        .then((data) => {
          setChats(data); // Set the chats retrieved from the backend
        })
        .catch((err) => {
          console.error("Error fetching chats:", err);
        });
    }
  }, [currentUser]);

  const handlePlusClick = () => {
    setShowPopup(true);
  };

  const handleChange = (event) => {
    setMessage(event.target.value);
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

  //sends friend request to the selected user
  const handleSendRequest = (receiver) => {
    // Send a friend request to the backend
    fetch("http://localhost:5000/sendFriendRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromUsername: currentUser.username,
        toUsername: receiver,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error sending friend request:", data.error);
          return;
        }

        console.log("Friend request sent:", data.message);

        // Optional: Show success message or update UI here
        alert("Friend request sent successfully!");

        // Optionally, disable the button to prevent multiple requests
        setSearchResults((prevResults) =>
          prevResults.map((user) =>
            user === receiver ? `${user} (Request Sent)` : user
          )
        );
      })
      .catch((error) => {
        console.error("Error sending friend request:", error);
      });
  };

  const handleRejectRequest = (fromUsername) => {
    fetch("http://localhost:5000/rejectFriendRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: currentUser.username,
        fromUsername: fromUsername,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error rejecting friend request:", data.error);
          return;
        }

        console.log("Friend request rejected:", data.message);

        // Remove the rejected request from the state
        setFriendRequests((prevRequests) =>
          prevRequests.filter((request) => request !== fromUsername)
        );
      })
      .catch((error) => {
        console.error("Error rejecting friend request:", error);
      });
  };

  //accept friend request
  const handleAddFriend = (receiver) => {
    // Accept the friend request on the backend
    fetch("http://localhost:5000/acceptFriendRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromUsername: currentUser.username,
        toUsername: receiver,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error accepting friend request:", data.error);
          return;
        }

        console.log("Friend request accepted:", data.message);

        // Start a chat after accepting the friend request
        startChat(currentUser.username, receiver);

        // Update UI to reflect friend addition
        setFriendRequests((prevRequests) => prevRequests.filter((request) => request !== receiver));
        alert("Friend request accepted, starting chat...");
      })
      .catch((error) => {
        console.error("Error accepting friend request:", error);
      });
  };

  //start chat between two users
  const startChat = (sender, receiver) => {
    fetch("http://localhost:5000/startChat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender,
        receiver: receiver,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error starting chat:", data.error);
          return;
        }

        console.log("Chat started successfully:", data.message);

        // Add the newly started chat to the state
        const newChat = {
          _id: data.data._id,
          participants: data.data.participants,
          messages: data.data.messages,
          lastMessage: data.data.lastMessage,
          updatedAt: data.data.updatedAt,
        };

        setChats((prevChats) => {
          // Ensure prevChats is an array
          if (!Array.isArray(prevChats)) {
            prevChats = []; // If prevChats is not an array, initialize as an empty array
          }

          const chatExists = prevChats.some(chat => chat._id === newChat._id);

          if (!chatExists) {
            return [newChat, ...prevChats]; // Add the new chat if it doesn't already exist
          } else {
            return prevChats; // Return the existing chats if the new chat already exists
          }
        });
      })
      .catch((error) => {
        console.error("Error starting chat:", error);
      });
  };

  //fetch the friend requests of the user
  const fetchFriendRequests = (username) => {
    if (isLoggingOut) return; // Prevent fetching if logging out

    fetch(`http://localhost:5000/getFriendRequests/${username}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error fetching friend requests:", data.error);
          return;
        }
        setFriendRequests(data.requests);
      })
      .catch((err) => {
        console.error("Error fetching friend requests:", err);
      });
  };


  //get the messages of the selected user
  const handleUserClick = (username) => {
    setMessages([]);
    setSelectedUser(username);

    fetch(`http://localhost:5000/getMessages?sender=${currentUser.username}&receiver=${username}`)
      .then((response) => response.json())
      .then((data) => {
        setMessages(data.messages);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
      });
  };

  //send message to the selected user
  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      console.log("Message cannot be empty");
      return;
    }

    const messageData = {
      sender: currentUser.username,
      receiver: selectedUser,
      content: newMessage,
    };

    fetch("http://localhost:5000/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error sending message:", data.error);
          return;
        }

        console.log("Message added successfully:", data.message);

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: currentUser.username,
            receiver: selectedUser,
            content: newMessage,
            timestamp: new Date().toISOString(),
          },
        ]);

        setNewMessage("");
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  };

  //logout bbutton in profile
  const handleLogout = () => {
    setIsLoggingOut(true); // Set the logging out state
    setFriendRequests([]);
    localStorage.removeItem("currentUser");
    setIsLoggingOut(false);
    window.location.href = "/";
  };

  //toggle function to tooggle the profile section
  const toggleProfile = () => {
    setProfileVisible(!profileVisible);
  };

  //profile section with friend requests and logout button
  const ProfileSection = () => (
    <div className="profile-section">
      <h3>{currentUser.username}</h3>
      <div className="friend-requests">
        <h4>Friend Requests</h4>
        {friendRequests.length > 0 ? (
          <ul>
            {friendRequests.map((request, index) => (
              <li key={index}>
                {request}
                <div className="request-actions">
                  <button
                    className="connect-button"
                    onClick={() => handleAddFriend(request)}
                    aria-label="Accept request"
                  >
                    <span className="check-icon">✔</span>
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleRejectRequest(request)}
                    aria-label="Reject request"
                  >
                    <span className="cross-icon">✖</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pending requests</p>
        )}
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );


  return (
    <div className="messages-container">
      <div className="profile-icon" onClick={toggleProfile}>
        <FaUserCircle size={30} color="#4d4d4d" />
        {hasNewRequests && <span className="notification-dot"></span>}
      </div>

      {profileVisible && (
        <div className="profile-container">
          {currentUser && <ProfileSection />}
        </div>
      )}
      <div className="contacts">
        <div className="contacts-header">
          <h2>Contacts</h2>
          <button className="add-contact" onClick={handlePlusClick}>+</button>
        </div>
        <ul>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <li key={chat._id} onClick={() => {
                handleConnectWebSocket();
                console.log("Test Connection");
                const recp = (chat.participants.filter((p) => p !== currentUser.username)[0]);
                handleUserClick(recp);
                setRec(recp);
              }}>
                <div className="chat-preview">
                  <h3>{chat.participants.filter((p) => p !== currentUser.username)[0]}</h3>
                  <p>{chat.messages[chat.messages.length - 1]?.content}</p>
                </div>
              </li>
            ))
          ) : (
            <li>No chats available</li>
          )}
        </ul>
      </div>
      <div className="message-section">
        <h2>Chat</h2>
        <div className="messages">
          {(isConnected
            ? [...messages, { sender: currentUser.username, content: response.msg }]
            : messages
          ).map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender === currentUser.username ? 'user-message' : 'recipient-message'}`}
            >
              {msg.sender !== currentUser.username && <span>{msg.sender}</span>}
              {msg.content}
            </div>
          ))}

          {messages.length === 0 && !isConnected && <div>No messages yet</div>}
        </div>
        <div className="message-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button onClick={() => {
            checkForUser(recpient || "user");
          }}>
            Send
          </button>
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
                    <button
                      className="add-friend-button"
                      onClick={() => handleSendRequest(username)}
                      disabled={username.includes("(Request Sent)")}
                    >
                      {username.includes("(Request Sent)") ? "Request Sent" : "Add"}
                    </button>
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
