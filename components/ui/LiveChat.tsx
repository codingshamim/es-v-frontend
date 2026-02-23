'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatIcon, CloseIcon, SendIcon, PaperclipIcon } from '@/components/icons';

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '👋 হ্যালো! ES FITT-এ স্বাগতম। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      isUser: false,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
      timestamp: 'Just now',
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: 'ধন্যবাদ! আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে। আপনি এই পেজেই থাকুন।',
        isUser: false,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const sendQuickMessage = (message: string) => {
    const newMessage = {
      id: messages.length + 1,
      text: message,
      isUser: true,
      timestamp: 'Just now',
    };

    setMessages([...messages, newMessage]);

    // Simulate bot response
    setTimeout(() => {
      let response = '';
      if (message.includes('ট্র্যাক')) {
        response = 'অর্ডার ট্র্যাক করতে আপনার অর্ডার নম্বর দিন। উদাহরণ: ES-78542';
      } else if (message.includes('সাইজ')) {
        response = 'আমাদের সাইজ গাইড: S (36"), M (38"), L (40"), XL (42"), XXL (44")। বিস্তারিত জানতে প্রোডাক্ট পেজে "সাইজ বিস্তারিত" দেখুন।';
      } else if (message.includes('রিটার্ন')) {
        response = 'আমরা ৭ দিনের রিটার্ন পলিসি অফার করি। প্রোডাক্ট অবিকৃত থাকলে রিফান্ড পাবেন।';
      }
      
      const botResponse = {
        id: messages.length + 2,
        text: response || 'আমি আপনাকে কীভাবে আরও সাহায্য করতে পারি?',
        isUser: false,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        ref={chatWindowRef}
        className={`mb-4 w-80 sm:w-96 bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden transition-all duration-300 ${
          isOpen ? 'block' : 'hidden'
        }`}
        role="dialog"
        aria-label="Live chat"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Chat Header */}
        <div className="bg-accent-teal p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ChatIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">ES FITT Support</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                <span className="text-white/80 text-xs">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 bg-accent-teal rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  ES
                </div>
              )}
              <div
                className={`${
                  message.isUser
                    ? 'bg-accent-teal text-white rounded-2xl rounded-br-sm'
                    : 'bg-white dark:bg-[#1a1a1a] rounded-2xl rounded-bl-sm shadow-sm'
                } px-4 py-3 max-w-[80%]`}
              >
                <p className={`text-sm ${message.isUser ? 'text-white' : 'text-gray-700 dark:text-gray-300'} font-bengali`}>
                  {message.text}
                </p>
                <span className={`text-[10px] ${message.isUser ? 'text-white/70' : 'text-gray-400'} mt-1 block`}>
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          
          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 ml-10">
              <button
                onClick={() => sendQuickMessage('আমি অর্ডার ট্র্যাক করতে চাই')}
                className="px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-full text-xs text-gray-600 dark:text-gray-400 hover:border-accent-teal hover:text-accent-teal transition-colors font-bengali"
              >
                অর্ডার ট্র্যাক
              </button>
              <button
                onClick={() => sendQuickMessage('সাইজ গাইড দরকার')}
                className="px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-full text-xs text-gray-600 dark:text-gray-400 hover:border-accent-teal hover:text-accent-teal transition-colors font-bengali"
              >
                সাইজ গাইড
              </button>
              <button
                onClick={() => sendQuickMessage('রিটার্ন পলিসি জানতে চাই')}
                className="px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-full text-xs text-gray-600 dark:text-gray-400 hover:border-accent-teal hover:text-accent-teal transition-colors font-bengali"
              >
                রিটার্ন পলিসি
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-4 bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-gray-400 hover:text-accent-teal transition-colors"
              aria-label="Attach file"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="মেসেজ লিখুন..."
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl border-none outline-none text-sm font-bengali placeholder:text-gray-400 focus:ring-2 focus:ring-accent-teal"
              aria-label="Type your message"
            />
            <button
              onClick={sendMessage}
              className="p-2.5 bg-accent-teal text-white rounded-xl hover:bg-accent-teal/90 transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">Powered by ES FITT Live Support</p>
        </div>
      </div>
      
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="relative w-14 h-14 bg-accent-teal rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label={isOpen ? 'Close chat' : 'Open live chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <CloseIcon className="w-6 h-6" />
        ) : (
          <>
            <ChatIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              1
            </span>
          </>
        )}
      </button>
    </div>
  );
}
