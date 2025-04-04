#include <iostream>
#include <string>
#include <thread>
#include <mutex>
#include <unordered_map>
#include <sstream>
#include <vector>
#include <cstring>
#include <netinet/in.h>
#include <unistd.h>
#include <arpa/inet.h>

using namespace std;

// Global map of username to client socket, protected by a mutex.
mutex clients_mutex;
unordered_map<string, int> clients;

// Function to trim leading and trailing whitespace.
string trim(const string &s) {
    size_t start = s.find_first_not_of(" \t\n\r");
    size_t end = s.find_last_not_of(" \t\n\r");
    return (start == string::npos) ? "" : s.substr(start, end - start + 1);
}

// This function handles an individual client.
void handle_client(int client_socket) {
    char buffer[1024];
    string username;

    // First message must be a login command: "LOGIN <username>"
    int bytes = read(client_socket, buffer, sizeof(buffer) - 1);
    if (bytes <= 0) {
        close(client_socket);
        return;
    }
    buffer[bytes] = '\0';
    string loginMsg(buffer);
    istringstream iss(loginMsg);
    string command;
    iss >> command;
    if (command != "LOGIN") {
        string err = "Expected LOGIN command\n";
        send(client_socket, err.c_str(), err.size(), 0);
        close(client_socket);
        return;
    }
    iss >> username;
    username = trim(username);
    if (username.empty()) {
        string err = "Username required\n";
        send(client_socket, err.c_str(), err.size(), 0);
        close(client_socket);
        return;
    }

    // Save the client in the global map.
    {
        lock_guard<mutex> lock(clients_mutex);
        clients[username] = client_socket;
    }

    string welcome = "Welcome " + username + "\n";
    send(client_socket, welcome.c_str(), welcome.size(), 0);
    cout << username << " has logged in." << endl;

    // Now continuously handle incoming messages from this client.
    while (true) {
        memset(buffer, 0, sizeof(buffer));
        bytes = read(client_socket, buffer, sizeof(buffer) - 1);
        if (bytes <= 0) {
            break; // Client disconnected.
        }
        buffer[bytes] = '\0';
        string msg(buffer);
        istringstream iss2(msg);
        string msgCommand;
        iss2 >> msgCommand;
        if (msgCommand != "MSG") {
            string err = "Unknown command. Use: MSG <recipient> <message>\n";
            send(client_socket, err.c_str(), err.size(), 0);
            continue;
        }
        string recipient;
        iss2 >> recipient;
        recipient = trim(recipient);
        if (recipient.empty()) {
            string err = "Recipient required\n";
            send(client_socket, err.c_str(), err.size(), 0);
            continue;
        }
        // The rest of the line is the message.
        string content;
        getline(iss2, content);
        content = trim(content);
        if (content.empty()) {
            string err = "Message content required\n";
            send(client_socket, err.c_str(), err.size(), 0);
            continue;
        }
        string fullMsg = username + ": " + content + "\n";

        // Forward the message to the recipient if they are online.
        {
            lock_guard<mutex> lock(clients_mutex);
            if (clients.find(recipient) != clients.end()) {
                int rec_sock = clients[recipient];
                send(rec_sock, fullMsg.c_str(), fullMsg.size(), 0);
            } else {
                string err = "Recipient not online\n";
                send(client_socket, err.c_str(), err.size(), 0);
            }
        }
    }

    // Remove client from the map when they disconnect.
    {
        lock_guard<mutex> lock(clients_mutex);
        clients.erase(username);
    }
    cout << username << " has disconnected." << endl;
    close(client_socket);
}

int main() {
    int server_fd;
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    const int PORT = 8081; // Chat server port

    // Create TCP socket.
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == 0) {
        perror("socket failed");
        return 1;
    }

    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt failed");
        return 1;
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY; // Listen on all interfaces.
    address.sin_port = htons(PORT);

    // Use the global scope operator for bind to avoid conflicts with std::bind.
    if (::bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
        perror("bind failed");
        return 1;
    }

    if (listen(server_fd, 10) < 0) {
        perror("listen failed");
        return 1;
    }

    cout << "Chat server listening on port " << PORT << endl;

    // Main loop: accept new client connections and create a thread for each.
    while (true) {
        int client_socket = accept(server_fd, (struct sockaddr*)&address, (socklen_t*)&addrlen);
        if (client_socket < 0) {
            perror("accept failed");
            continue;
        }
        thread t(handle_client, client_socket);
        t.detach();
    }

    close(server_fd);
    return 0;
}
