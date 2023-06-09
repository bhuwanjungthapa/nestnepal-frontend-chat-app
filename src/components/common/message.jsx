import React, { useState, useEffect, useCallback } from "react";
import queryString from "query-string";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Navbar from "./navbar";
import { useContext } from "react";
import UserContext from "./usercontext";
import axios from "axios";

const Message = ({ senderEmail, recipientEmail }) => {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const location = useLocation();
  const { sender, recipient } = queryString.parse(location.search);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://chat-app-787f3-default-rtdb.firebaseio.com/messages.json"
      );
      const data = response.data;
      const userMessages = Object.entries(data)
        .map(([key, value]) => ({ id: key, ...value }))
        .filter(
          (msg) =>
            (msg.sender === sender && msg.recipient === recipient) ||
            (msg.sender === recipient && msg.recipient === sender)
        );
      setMessages(userMessages);
    } catch (error) {
      console.error(error);
    }
  }, [sender, recipient]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Fetches every 5 seconds
    return () => clearInterval(interval); // Clears interval on component unmount
  }, [fetchMessages]);

  const sendMessage = async (sender, recipient, message) => {
    await axios.post(
      "https://chat-app-787f3-default-rtdb.firebaseio.com/messages.json",
      {
        sender: sender,
        recipient: recipient,
        message: message,
      }
    );
    fetchMessages();
  };

  const updateMessage = async (id, updatedMessage) => {
    await axios.patch(
      `https://chat-app-787f3-default-rtdb.firebaseio.com/messages/${id}.json`,
      updatedMessage
    );
    fetchMessages();
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const deleteMessage = async (id) => {
    await axios.delete(
      `https://chat-app-787f3-default-rtdb.firebaseio.com/messages/${id}.json`
    );
    fetchMessages();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(sender, recipient, message);
    setMessage("");
  };

  return (
    <>
      <Navbar username={user?.username} />
      <div className="flex justify-center h-full py-6 bg-gray-100">
        <div className="w-full max-w-2xl rounded-lg shadow-lg bg-white overflow-hidden">
          <div className="p-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.sender === user.email ? "text-right" : ""
                }`}
              >
                <div className="flex items-center space-x-4 mb-2">
                  <div
                    className={`font-medium text-lg ${
                      msg.sender === user.email ? "ml-auto" : "text-blue-500"
                    }`}
                  >
                    {msg.sender === user.email ? "You" : msg.sender}
                  </div>
                </div>
                {editingMessageId === msg.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                      className="border rounded p-2"
                    />
                    <button
                      onClick={() =>
                        updateMessage(msg.id, {
                          ...msg,
                          message: editedMessageText,
                        })
                      }
                      className="bg-blue-500 text-white px-2 py-1 ml-2 rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p>{msg.message}</p>
                )}
                {msg.sender === user.email && (
                  <div>
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditedMessageText(msg.message);
                      }}
                      className="bg-blue-500 text-white px-2 py-1 ml-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="bg-red-500 text-white px-2 py-1 ml-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t-2">
            <form className="p-6" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  className="block text-gray-700 font-bold mb-2"
                  htmlFor="message"
                >
                  Message to {recipient}
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="message"
                  rows="4"
                  placeholder="Type your message here"
                  value={message}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                  type="submit"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;
