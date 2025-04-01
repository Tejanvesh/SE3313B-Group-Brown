#include <iostream>
#include <cstring>
#include <thread>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

using namespace std;

void forward_messages(int from_fd, int to_fd) {
    char buffer[1024];
    while (true) {
        memset(buffer, 0, sizeof(buffer));
        int bytes = read(from_fd, buffer, sizeof(buffer));
        if (bytes <= 0) {
            // Connection closed or error occurred.
            break;
        }
        cout << "Forwarding: " << buffer;
        send(to_fd, buffer, bytes, 0);
    }
}

int main() {
    int server_fd, client1_fd, client2_fd;
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    const int PORT = 8080;

    // Create a TCP socket.
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == 0) {
        perror("socket failed");
        return 1;
    }

    // Set SO_REUSEADDR so we can reuse the port if needed.
    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt SO_REUSEADDR failed");
        return 1;
    }

    // Bind to any available network interface.
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (::bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        return 1;
    }

    // Listen for incoming connections; allow up to 2 pending connections.
    if (listen(server_fd, 2) < 0) {
        perror("listen failed");
        return 1;
    }

    cout << "Server listening on port " << PORT << ". Waiting for two clients..." << endl;

    // Accept first client connection.
    client1_fd = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen);
    if (client1_fd < 0) {
        perror("accept client1 failed");
        return 1;
    }
    cout << "Client 1 connected." << endl;

    // Accept second client connection.
    client2_fd = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen);
    if (client2_fd < 0) {
        perror("accept client2 failed");
        return 1;
    }
    cout << "Client 2 connected." << endl;

    // Create two threads to forward messages between the clients.
    thread t1(forward_messages, client1_fd, client2_fd);
    thread t2(forward_messages, client2_fd, client1_fd);

    // Wait for both threads to finish.
    t1.join();
    t2.join();

    close(client1_fd);
    close(client2_fd);
    close(server_fd);
    return 0;
}
