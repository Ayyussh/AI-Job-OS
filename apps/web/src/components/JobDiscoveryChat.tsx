'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ExternalLink, Loader2, Globe } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  portal: string;
  url: string;
  applyUrl: string;
  matchScore: number;
  description: string;
  workMode: string;
  skills: string[];
  postedAt: string;
  isNew: boolean;
}

interface Portal {
  name: string;
  searchUrl: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'jobs' | 'portals';
  jobs?: Job[];
  portals?: Portal[];
  timestamp: Date;
}

interface JobDiscoveryChatProps {
  userSkills?: string[];
}

export function JobDiscoveryChat({ userSkills = [] }: JobDiscoveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 I can help you find jobs from ALL portals!\n\nTry asking:\n• "Find React jobs in India"\n• "Show me frontend developer roles"\n• "Find remote jobs"\n\n💡 I\'ll show jobs from all portals with one-click apply!',
      type: 'text',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to check if message is job-related
  const isJobQuery = (message: string): boolean => {
    const keywords = ['find', 'search', 'job', 'work', 'role', 'position', 'hiring', 
                      'developer', 'engineer', 'designer', 'manager', 'react', 'node',
                      'frontend', 'backend', 'full stack', 'remote'];
    const lower = message.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword));
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
      // Check if job-related query
      if (isJobQuery(input)) {
        const loadingMessage: Message = {
          role: 'assistant',
          content: '🔍 Searching all portals for jobs...',
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

        setMessages(prev => prev.filter(m => m.content !== '🔍 Searching all portals for jobs...'));

        if (data.jobs && data.jobs.length > 0) {
          // Show jobs
          const jobMessage: Message = {
            role: 'assistant',
            content: data.summary || `🎯 Found ${data.jobs.length} jobs!`,
            type: 'jobs',
            jobs: data.jobs.slice(0, 15),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, jobMessage]);

          // Show portals
          if (data.portals && data.portals.length > 0) {
            const portalMessage: Message = {
              role: 'assistant',
              content: '🔗 **Search these portals directly:**',
              type: 'portals',
              portals: data.portals,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, portalMessage]);
          }
        } else {
          const portalMessage: Message = {
            role: 'assistant',
            content: "I couldn't find jobs matching your query. Try these direct searches:",
            type: 'portals',
            portals: data.portals || [],
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, portalMessage]);
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

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getMatchBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">AI Job Discovery</h3>
            <p className="text-xs opacity-80">Find jobs from ALL portals • One-click apply</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
            <Globe className="w-3 h-3" />
            <span>18+ portals</span>
          </div>
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
              <div className="ml-11 mt-3 space-y-3">
                {message.jobs.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMatchBadge(job.matchScore)}`}>
                            {job.matchScore}%
                          </span>
                          {job.isNew && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                          <span>📍 {job.location}</span>
                          <span>•</span>
                          <span>{job.workMode}</span>
                          <span>•</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{job.portal}</span>
                          <span>•</span>
                          <span className="text-gray-400">{job.postedAt}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Portals List */}
            {message.type === 'portals' && message.portals && (
              <div className="ml-11 mt-2 space-y-1">
                {message.portals.slice(0, 10).map((portal, i) => (
                  <a
                    key={i}
                    href={portal.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {portal.name}
                  </a>
                ))}
                {message.portals.length > 10 && (
                  <span className="text-xs text-gray-400">
                    +{message.portals.length - 10} more portals
                  </span>
                )}
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
            placeholder="Find jobs (e.g., 'Find React jobs in India')..."
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
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-gray-400">Quick:</span>
          {['React jobs', 'Remote jobs', 'Frontend roles', 'Full stack'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setInput(s);
                setTimeout(handleSend, 100);
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}