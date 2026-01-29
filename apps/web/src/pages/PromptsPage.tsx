import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, RotateCcw } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function PromptsPage() {
  const [customerPrompt, setCustomerPrompt] = useState('');
  const [technicianPrompt, setTechnicianPrompt] = useState('');

  const { data: prompts, refetch } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const { data } = await api.get('/prompts');
      return data;
    },
  });

  useEffect(() => {
    if (prompts) {
      setCustomerPrompt(prompts.customer || '');
      setTechnicianPrompt(prompts.technician || '');
    }
  }, [prompts]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/prompts', {
        customer: customerPrompt,
        technician: technicianPrompt,
      });
      return data;
    },
    onSuccess: () => {
      refetch();
      alert('Promptlar kaydedildi!');
    },
  });

  const reset = () => {
    if (prompts) {
      setCustomerPrompt(prompts.customer || '');
      setTechnicianPrompt(prompts.technician || '');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">System Promptları</h2>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            disabled={saveMutation.isPending}
          >
            <RotateCcw size={18} />
            Sıfırla
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            className="px-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700 flex items-center gap-2"
            disabled={saveMutation.isPending}
          >
            <Save size={18} />
            Kaydet
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👤 Müşteri Modu System Prompt
          </label>
          <textarea
            value={customerPrompt}
            onChange={(e) => setCustomerPrompt(e.target.value)}
            className="w-full h-64 px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
            placeholder="Müşteri modu için system prompt..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {customerPrompt.length} karakter
          </p>
        </div>

        {/* Technician Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔧 Teknisyen Modu System Prompt
          </label>
          <textarea
            value={technicianPrompt}
            onChange={(e) => setTechnicianPrompt(e.target.value)}
            className="w-full h-64 px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
            placeholder="Teknisyen modu için system prompt..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {technicianPrompt.length} karakter
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 İpuçları:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Promptları değiştirdikten sonra "Kaydet" butonuna tıklayın</li>
          <li>• Değişiklikler anında tüm yeni sohbetlerde geçerli olur</li>
          <li>• JSON formatında cevap vermesi için "ZORUNLU: JSON formatında cevap ver" gibi ifadeler ekleyin</li>
          <li>• Action tipleri: ask_clarification, answer, troubleshoot, create_ticket, escalate</li>
        </ul>
      </div>
    </div>
  );
}
