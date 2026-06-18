'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Cpu, Loader2, Sparkles } from 'lucide-react';

export function AIStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [models, setModels] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const modelNames = data.models?.map((m: any) => m.name) || [];
        setModels(modelNames);
        setStatus(modelNames.length > 0 ? 'online' : 'offline');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    }
  };

  const getModelBadge = (model: string) => {
    if (model.includes('llama')) return 'bg-blue-100 text-blue-700';
    if (model.includes('qwen')) return 'bg-purple-100 text-purple-700';
    if (model.includes('deepseek')) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 text-sm cursor-pointer hover:bg-gray-100 transition"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <Cpu className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">AI:</span>
        {status === 'checking' && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
        {status === 'online' && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">Online</span>
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span className="text-gray-400 text-xs">{models.length} models</span>
          </>
        )}
        {status === 'offline' && (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600 font-medium">Offline</span>
          </>
        )}
      </div>

      {showDetails && status === 'online' && models.length > 0 && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
          <p className="text-xs font-semibold text-gray-700 mb-2">Available Models:</p>
          <div className="flex flex-wrap gap-1">
            {models.map((model) => (
              <span key={model} className={`px-2 py-0.5 rounded-full text-xs ${getModelBadge(model)}`}>
                {model.split(':')[0]}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {models.includes('deepseek-r1') && '🧠 Best for deep analysis'}
            {models.includes('qwen3') && '🎯 Best balance'}
            {models.includes('llama3.2') && '⚡ Fastest'}
          </p>
        </div>
      )}
    </div>
  );
}