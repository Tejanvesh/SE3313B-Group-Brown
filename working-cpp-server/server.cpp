#include "App.h"
#include <iostream>
#include <unordered_map>
#include <string>
#include <sstream>
#include <thread>
#include <mutex>

std::mutex clients_mutex;

using namespace std;

struct ClientData
{
    string username;
};

void printClients(const std::unordered_map<std::string, uWS::WebSocket<false, true, ClientData> *> &clients)
{
    cout << "Connected clients:\n";
    for (const auto &pair : clients)
    {
        cout << "Username: " << pair.first << "\n";
    }
}

int main()
{
    unordered_map<string, uWS::WebSocket<false, true, ClientData> *> clients;

    uWS::App().ws<ClientData>("/*", {.open = [](auto *ws)
                                     { cout << "Client connected!\n"; },

                                     .message = [&clients](auto *ws, string_view message, uWS::OpCode opCode)
                                     {
                                         cout << "Received: " << message << "\n";
                                         string msg(message);
                                         auto *socket = ws;

                                         thread([msg, socket, &clients]()
                                                {
                istringstream iss(msg);
                string command, username, sender, text;
                iss >> command >> username >>sender;

                if (command == "CONNECT") {
                    {
                        lock_guard<mutex> lock(clients_mutex);
                        socket->getUserData()->username = username;
                        clients[username] = socket;
                        cout << username << " connected\n";
                        printClients(clients);
                    }
                } else if (command == "CHECK") {
                    lock_guard<mutex> lock(clients_mutex);
                    cout << "checking for: " << username << "\n";
                    if (clients.find(username) != clients.end()) {
                        socket->send("YES", uWS::OpCode::TEXT);
                    } else {
                        cout << "sending no: " << username << "\n";
                        socket->send("NO", uWS::OpCode::TEXT);
                    }
                } else if (command == "SEND") {
                    getline(iss, text);
                    {
                        lock_guard<mutex> lock(clients_mutex);
                        if (clients.find(username) != clients.end()) {
                            string fullMessage = sender + ": " + message;
                            clients[username]->send(fullMessage, uWS::OpCode::TEXT);
                        } else {
                            socket->send("Error: Recipient not connected", uWS::OpCode::TEXT);
                        }
                    }
                } })
                                             .detach(); // Start and detach the thread
                                     },

                                     .close = [&clients](auto *ws, int code, string_view message)
                                     {
            lock_guard<mutex> lock(clients_mutex);
            string username = ws->getUserData()->username;
            clients.erase(username);
            cout << username << " disconnected!\n"; }})
        .listen(9001, [](auto *token)
                {
        if (token) {
            cout << "Listening on port 9001\n"; //start listen
        } })
        .run();
}
