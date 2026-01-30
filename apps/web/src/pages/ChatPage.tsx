import { useState } from 'react';
import { Send, Bot, User, Loader2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { chatApi, ChatResponse, FunctionCallResult } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: ChatResponse['action'];
  parameters?: ChatResponse['parameters'];
  sources?: ChatResponse['sources'];
  confidence?: ChatResponse['confidence'];
  thinking?: string;
  rawJson?: any;
  functionCall?: FunctionCallResult;
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<'customer' | 'technician'>('customer');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Build history
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    // Create placeholder assistant message
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        action: undefined,
        parameters: undefined,
        sources: undefined,
        confidence: undefined,
      },
    ]);

    setInput('');
    setIsStreaming(true);

    try {
      await chatApi.sendStream(
        input,
        mode,
        history,
        // onToken
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: updated[assistantIndex].content + token,
            };
            return updated;
          });
        },
        // onDone
        (metadata) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              action: metadata.action,
              parameters: metadata.parameters,
              sources: metadata.sources,
              confidence: metadata.confidence,
              thinking: metadata.thinking,
              rawJson: metadata.rawJson,
              functionCall: metadata.functionCall,
            };
            return updated;
          });
          setIsStreaming(false);
        },
      );
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  };

  const confidenceColors = {
    low: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white rounded-lg shadow h-[calc(100vh-240px)] flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Chat Test</h2>
          
          {/* Mode Switch */}
          <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('customer')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'customer'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Müşteri
            </button>
            <button
              onClick={() => setMode('technician')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'technician'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔧 Teknisyen
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {mode === 'customer' 
            ? 'Müşteri modu: Basit ve anlaşılır cevaplar' 
            : 'Teknisyen modu: Detaylı teknik bilgiler'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p>Bir soru sorarak başlayın</p>
            <p className="text-sm mt-2">
              Örnek: "Yazıcı bağlanmıyor ne yapmalıyım?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-kerzz-100 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-kerzz-600" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-kerzz-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Function Call Result */}
              {msg.functionCall && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={14} className="text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-700">
                      Fonksiyon: {msg.functionCall.name}
                    </span>
                    {msg.functionCall.result.success ? (
                      <CheckCircle size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-red-600" />
                    )}
                  </div>
                  
                  {/* Function Arguments */}
                  {Object.keys(msg.functionCall.args).length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Parametreler:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(msg.functionCall.args).map(([key, value]) => (
                          <span key={key} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Function Result Details */}
                  {msg.functionCall.result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-700">
                        📊 Detaylı Sonuç
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap bg-indigo-50 p-2 rounded overflow-x-auto max-h-48">
                        {JSON.stringify(msg.functionCall.result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {msg.action && msg.action !== 'answer' && msg.action !== 'function_result' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    {msg.action === 'ask_clarification' && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        ❓ Bilgi Talebi
                      </span>
                    )}
                    {msg.action === 'create_ticket' && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                        🎫 Destek Talebi Oluşturuldu
                      </span>
                    )}
                    {msg.action === 'troubleshoot' && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                        🔍 Sorun Giderme
                      </span>
                    )}
                    {msg.action === 'schedule_appointment' && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                        📅 Randevu Talebi
                      </span>
                    )}
                    {msg.action === 'escalate' && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                        ⚠️ Acil - Yönlendirildi
                      </span>
                    )}
                  </div>

                  {msg.parameters?.next_steps && msg.parameters.next_steps.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Adımlar:</p>
                      <ol className="text-xs text-gray-700 space-y-1 ml-4 list-decimal">
                        {msg.parameters.next_steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {msg.parameters?.missing_info && msg.parameters.missing_info.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Eksik Bilgiler:</p>
                      <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                        {msg.parameters.missing_info.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.parameters?.suggested_solution && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Önerilen Çözüm:</p>
                      <p className="text-xs text-gray-700">{msg.parameters.suggested_solution}</p>
                    </div>
                  )}

                  {msg.parameters?.suggested_logs && msg.parameters.suggested_logs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Önerilen Loglar:</p>
                      <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                        {msg.parameters.suggested_logs.map((log, idx) => (
                          <li key={idx}>{log}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.parameters?.urgency && (
                    <div className="mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          msg.parameters.urgency === 'high'
                            ? 'bg-red-100 text-red-700'
                            : msg.parameters.urgency === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        Öncelik: {msg.parameters.urgency}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {msg.confidence && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${confidenceColors[msg.confidence]}`}
                  >
                    Güven: {msg.confidence}
                  </span>
                </div>
              )}

              {msg.thinking && (
                <details className="mt-3 pt-3 border-t border-gray-200">
                  <summary className="text-xs font-medium text-purple-600 cursor-pointer hover:text-purple-700">
                    🧠 Reasoning Process
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap bg-purple-50 p-2 rounded">
                    {msg.thinking}
                  </pre>
                </details>
              )}

              {msg.rawJson && (
                <details className="mt-3 pt-3 border-t border-gray-200">
                  <summary className="text-xs font-medium text-blue-600 cursor-pointer hover:text-blue-700">
                    📄 JSON Response
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap bg-blue-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(msg.rawJson, null, 2)}
                  </pre>
                </details>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Kaynaklar:</p>
                  <div className="space-y-1">
                    {msg.sources.map((s, j) => (
                      <div
                        key={j}
                        className="text-xs bg-white px-2 py-1 rounded text-gray-600"
                      >
                        {s.text?.substring(0, 100)}...
                        <span className="text-gray-400 ml-2">
                          ({(s.score * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-kerzz-100 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-kerzz-600" />
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sorunuzu yazın..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
