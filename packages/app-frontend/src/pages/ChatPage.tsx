import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User, FileText, ExternalLink, Sparkles } from 'lucide-react';
import { chatQuery } from '../utils/api';

interface Citation {
  documentId: number;
  chunkId: number;
  filePath: string;
  title: string;
  page?: number;
  paragraph?: number;
  excerpt: string;
  score: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Hello! I can help you search the knowledge base. Ask me anything about the uploaded documents, tenders, or rules.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatQuery(input.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        citations: response.data.citations,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="bg-white shadow rounded-lg overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 12rem)' }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={24} />
            <div>
              <h2 className="text-xl font-bold">Knowledge Base Chat</h2>
              <p className="text-sm text-blue-100">
                Ask questions and get AI-powered answers with citations
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                </div>
              )}

              <div
                className={`flex-1 max-w-2xl ${message.role === 'user' ? 'flex justify-end' : ''}`}
              >
                <div
                  className={`rounded-lg p-4 ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Sparkles size={14} className="text-yellow-500" />
                      <span>Sources ({message.citations.length})</span>
                    </div>
                    {message.citations.map(citation => (
                      <div
                        key={`${citation.documentId}-${citation.chunkId}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 text-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText size={16} className="text-blue-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">
                              {citation.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {Math.round(citation.score * 100)}% match
                            </span>
                            <button
                              onClick={() =>
                                window.open(`/documents/${citation.documentId}`, '_blank')
                              }
                              className="text-blue-600 hover:text-blue-800"
                              title="Open document"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2 mb-1">
                          {citation.excerpt}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          {citation.page && <span>Page {citation.page}</span>}
                          {citation.paragraph && <span>¶ {citation.paragraph}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex gap-2">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
