import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Plus, X, Check } from 'lucide-react';
import { documentsApi } from '@/lib/api';

export default function UploadPage() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [manualText, setManualText] = useState('');
  const [category, setCategory] = useState('');
  const [product, setProduct] = useState('kerzz-pos');
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  
  // QA state
  const [question, setQuestion] = useState('');
  const [customerAnswer, setCustomerAnswer] = useState('');
  const [technicianAnswer, setTechnicianAnswer] = useState('');
  const [qaCategory, setQaCategory] = useState('');
  const [qaTags, setQaTags] = useState('');

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: (data) => {
      setUploadResults((prev) => [...prev, { success: true, ...data }]);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      setUploadResults((prev) => [...prev, { success: false, error: err.message }]);
    },
  });

  const addManualMutation = useMutation({
    mutationFn: (data: { text: string; category?: string; product?: string }) =>
      documentsApi.add(data.text, { category: data.category, product: data.product }),
    onSuccess: () => {
      setManualText('');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const addQAMutation = useMutation({
    mutationFn: (data: { question: string; customerAnswer: string; technicianAnswer: string; category?: string; tags?: string[] }) =>
      documentsApi.addQA(data.question, data.customerAnswer, data.technicianAnswer, { 
        category: data.category,
        tags: data.tags 
      }),
    onSuccess: () => {
      setQuestion('');
      setCustomerAnswer('');
      setTechnicianAnswer('');
      setQaCategory('');
      setQaTags('');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === 'text/plain' ||
        f.type === 'text/markdown' ||
        f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    setUploadResults([]);
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }
    setFiles([]);
  };

  const handleManualAdd = () => {
    if (!manualText.trim()) return;
    addManualMutation.mutate({ text: manualText, category, product });
  };

  const handleQAAdd = () => {
    if (!question.trim() || !customerAnswer.trim() || !technicianAnswer.trim()) return;
    const tags = qaTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    addQAMutation.mutate({ 
      question, 
      customerAnswer,
      technicianAnswer,
      category: qaCategory || undefined,
      tags: tags.length > 0 ? tags : undefined 
    });
  };

  return (
    <div className="space-y-8">
      {/* File Upload Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Dosya Yükle</h2>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-kerzz-500 transition-colors"
        >
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-2">
            Dosyaları sürükleyip bırakın veya seçin
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Desteklenen formatlar: .txt, .md, .pdf
          </p>
          <input
            type="file"
            id="file-input"
            multiple
            accept=".txt,.md,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-kerzz-600 text-white rounded-lg cursor-pointer hover:bg-kerzz-700"
          >
            <Plus size={18} />
            Dosya Seç
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full mt-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700 disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Yükleniyor...' : `${files.length} Dosya Yükle`}
            </button>
          </div>
        )}

        {uploadResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadResults.map((result, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {result.success ? <Check size={18} /> : <X size={18} />}
                <span className="text-sm">
                  {result.success
                    ? `${result.filename}: ${result.chunks} parça eklendi`
                    : `Hata: ${result.error}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual Add Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Manuel Ekle</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="örn: yazıcı, menü, raporlar"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ürün
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
              >
                <option value="kerzz-pos">Kerzz POS</option>
                <option value="kerzz-cloud">Kerzz Cloud</option>
                <option value="genel">Genel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Döküman İçeriği
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={6}
              placeholder="SSS veya yardım metnini buraya yapıştırın..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleManualAdd}
            disabled={!manualText.trim() || addManualMutation.isPending}
            className="w-full py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700 disabled:opacity-50"
          >
            {addManualMutation.isPending ? 'Ekleniyor...' : 'Döküman Ekle'}
          </button>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Soru-Cevap Ekle</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                value={qaCategory}
                onChange={(e) => setQaCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                <option value="yazarkasa">Yazarkasa</option>
                <option value="pos-cihazı">POS Cihazı</option>
                <option value="yazıcı">Yazıcı</option>
                <option value="el-terminali">El Terminali</option>
                <option value="kerzz-cloud">Kerzz Cloud</option>
                <option value="kerzz-boss">Kerzz Boss</option>
                <option value="entegrasyon">Entegrasyon</option>
                <option value="lisans">Lisans</option>
                <option value="genel">Genel</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anahtar Kelimeler (opsiyonel)
              </label>
              <input
                type="text"
                value={qaTags}
                onChange={(e) => setQaTags(e.target.value)}
                placeholder="yazıcı, bağlantı, hata"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Virgül ile ayırın
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soru
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="Müşterinin sorabileceği soruyu yazın..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 Müşteri İçin Cevap
            </label>
            <textarea
              value={customerAnswer}
              onChange={(e) => setCustomerAnswer(e.target.value)}
              rows={4}
              placeholder="Basit ve anlaşılır cevap yazın..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔧 Teknisyen İçin Cevap
            </label>
            <textarea
              value={technicianAnswer}
              onChange={(e) => setTechnicianAnswer(e.target.value)}
              rows={4}
              placeholder="Teknik detaylar ve adımlar..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleQAAdd}
            disabled={!question.trim() || !customerAnswer.trim() || !technicianAnswer.trim() || addQAMutation.isPending}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {addQAMutation.isPending ? 'Ekleniyor...' : 'Soru-Cevap Ekle'}
          </button>

          {addQAMutation.isSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded">
              <Check size={18} />
              <span className="text-sm">Soru-cevap başarıyla eklendi!</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
