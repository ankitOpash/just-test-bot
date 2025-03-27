"use client";
import React, {
  useEffect,
  useState,
  createContext,
  FC,
  useCallback,
} from "react";
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
const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const SocketConnection = useCallback(async () => {
    console.log("Socket is null, initiating connection...");

    const newSocket = io(baseURL);

    newSocket.on("connect_error", (err) => {
      console.log("Connection Error:", err);
    });

    newSocket.on("connect_timeout", () => {
      console.log("Connection Timeout");
    });

    newSocket.on("error", (err) => {
      console.log("Error:", err);
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
    try {
      const userid = localStorage.getItem("userid");
      if (!userid) {
        const message = await newSocket.emitWithAck("joinChat", {});
        if (message.cust_id && message.room) {
          localStorage.setItem("userid", message.cust_id);
          localStorage.setItem("chatID", message.room);
        }
        await newSocket.emitWithAck("joinRoom", {
          cust_id: message.cust_id,
        });
      } else {
        const message = await newSocket.emitWithAck("joinRoom", {
          cust_id: userid,
        });
      }

      setSocket(newSocket);
    } catch (error) {
      console.log("Error:", error);
    }

    setSocket(newSocket);
  }, []);

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

/// when get user first msg that time coonet socket coonection
