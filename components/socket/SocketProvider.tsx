"use client";
import React from "react";
import { useEffect, useState } from "react";
import { connect,Socket, io } from "socket.io-client";


// Define the context type
interface SocketContextType {
    socket: Socket | null;
    SocketConnection: () => void;
}

// Define the props type for the provider
interface SocketProviderProps {
    children: any;
}

// Update the context with the correct type
export const SocketContext = React.createContext<SocketContextType>({
    socket: null,
    SocketConnection: () => {},
});

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

    

    const SocketConnection = () => {
        const newSocket = io(baseURL);
        const userid = localStorage.getItem('userid');
        const chatID = localStorage.getItem('chatID');
    
        if (userid && chatID) {
            newSocket.emit("joinRoom", { cust_id: chatID}, (message: any) => {
                console.log(message);
            });
        } else {
            newSocket.emit("joinChat", {}, (message: any) => {
                if (message.cust_id && message.room) {
                    localStorage.setItem('userid', message.cust_id);
                    localStorage.setItem('chatID', message.room);
                }
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