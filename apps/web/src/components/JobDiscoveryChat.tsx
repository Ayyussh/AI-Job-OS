'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ExternalLink, Database, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'jobs' | 'urls';
  jobs?: any[];
  urls?: string[];
  timestamp: Date;
}

interface JobDiscoveryChatProps {
  userSkills?: string[];
}

export function JobDiscoveryChat({ userSkills = [] }: JobDiscoveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 I can help you find jobs! Try asking:\n- "Find remote React jobs"\n- "Show me frontend developer roles"\n- "Find jobs matching my skills"',
      type: 'text',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const response = await fetch('http://localhost:5000/scraping/scrape-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      const resultMessage: Message = {
        role: 'system',
        content: `✅ Scraping complete!\n- Total jobs: ${data.total}\n- New jobs: ${data.newJobs}\n- Successful sources: ${data.success.length}\n- Failed sources: ${data.failed.length}`,
        type: 'text',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      console.error('Scraping failed:', error);
      const errorMessage: Message = {
        role: 'system',
        content: '❌ Failed to scrape jobs. Please try again.',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Detect if user wants to discover jobs
      if (input.toLowerCase().includes('find') || 
          input.toLowerCase().includes('search') ||
          input.toLowerCase().includes('discover') ||
          input.toLowerCase().includes('look for')) {
        
        const loadingMessage: Message = {
          role: 'assistant',
          content: '🔍 Searching for jobs matching your query...',
          type: 'text',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);

        const response = await fetch('http://localhost:5000/ai/discover-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: input,
            skills: userSkills,
          }),
        });
        const data = await response.json();

        setMessages(prev => prev.filter(m => m.content !== '🔍 Searching for jobs matching your query...'));

        if (data.jobs && data.jobs.length > 0) {
          const newJobs = data.jobs.filter((j: any) => j._isNew);

          let resultContent = `🎯 Found ${data.total} jobs:\n`;
          if (newJobs.length > 0) {
            resultContent += `\n🆕 ${newJobs.length} NEW jobs (not in database)`;
          }

          const resultMessage: Message = {
            role: 'assistant',
            content: resultContent,
            type: 'jobs',
            jobs: data.jobs.slice(0, 10),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, resultMessage]);

          const urlResponse = await fetch(`http://localhost:5000/ai/search-urls?query=${encodeURIComponent(input)}&location=remote`);
          const urlData = await urlResponse.json();
          
          if (urlData.urls && urlData.urls.length > 0) {
            const urlMessage: Message = {
              role: 'assistant',
              content: '🔗 Search these job boards directly:',
              type: 'urls',
              urls: urlData.urls,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, urlMessage]);
          }
        } else {
          const urlResponse = await fetch(`http://localhost:5000/ai/search-urls?query=${encodeURIComponent(input)}&location=remote`);
          const urlData = await urlResponse.json();
          
          const fallbackMessage: Message = {
            role: 'assistant',
            content: "I couldn't find jobs in my database. Try searching these external job boards:",
            type: 'urls',
            urls: urlData.urls || [],
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      } else {
        // Regular chat
        const response = await fetch('http://localhost:5000/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input,
            context: { skills: userSkills },
          }),
        });
        const data = await response.json();
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || "I couldn't process that. Please try again.",
          type: 'text',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Job Discovery Chat</h3>
              <p className="text-xs opacity-80">Find jobs not in your database</p>
            </div>
          </div>
          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Scrape Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>

            {/* Jobs List */}
            {message.type === 'jobs' && message.jobs && (
              <div className="ml-11 mt-2 space-y-2">
                {message.jobs.map((job: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{job.title}</h4>
                        <p className="text-xs text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-500">{job.location}</p>
                        {job._isNew && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1">
                            <Sparkles className="w-3 h-3" />
                            New
                          </span>
                        )}
                      </div>
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* URLs List */}
            {message.type === 'urls' && message.urls && (
              <div className="ml-11 mt-2 space-y-1">
                {message.urls.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:underline break-all"
                  >
                    🔗 {url}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask to find jobs (e.g., 'Find remote React jobs')..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {userSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-gray-400">Your skills:</span>
            {userSkills.slice(0, 5).map((skill) => (
              <span key={skill} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}