"use client";
import React, { useEffect, useState, createContext, FC } from "react";
import { Socket, io } from "socket.io-client";

// Define the context type
interface SocketContextType {
    socket: Socket | null;
    SocketConnection: () => void;
}

// Define the props type for the provider
interface SocketProviderProps {
    children: React.ReactNode;
}

// Update the context with the correct type
export const SocketContext = createContext<SocketContextType>({
    socket: null,
    SocketConnection: () => {},
});

const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    const SocketConnection = () => {
        const newSocket = io(baseURL);
        const userid = localStorage.getItem('userid');
        const chatID = localStorage.getItem('chatID');
        console.log('User ID:', userid, 'Chat ID:', chatID);

        newSocket.on('connect_error', (err) => {
            console.log('Connection Error:', err);
        });

        newSocket.on('connect_timeout', () => {
            console.log('Connection Timeout');
        });

        newSocket.on('error', (err) => {
            console.log('Error:', err);
        });

        newSocket.on("disconnect", (reason) => {
            if (reason === "io server disconnect") {
              newSocket.connect();
            }
        });

        // Check if the socket is connected
        if (!newSocket.connected) {
            newSocket.connect();
        }

        // Check if the user is in a room
        if (!userid) {
            newSocket.emit("joinChat", {}, (message: any) => {
                if (message.cust_id && message.room) {
                    localStorage.setItem('userid', message.cust_id);
                    localStorage.setItem('chatID', message.room);
                }
            });
        } else {
            newSocket.emit("joinRoom", { cust_id: userid}, (message: any) => {
                console.log('joinRoom Response:', message);
            });
        }

        setSocket(newSocket);
    };

    const disconnectSocket = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    };

    useEffect(() => {
        SocketConnection();

        return () => {
            disconnectSocket();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, SocketConnection }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;