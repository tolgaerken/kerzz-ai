import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, FileText, RefreshCw, Edit2, X } from 'lucide-react';
import { documentsApi, Document } from '@/lib/api';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editProduct, setEditProduct] = useState('');
  
  // QA edit state
  const [editQuestion, setEditQuestion] = useState('');
  const [editCustomerAnswer, setEditCustomerAnswer] = useState('');
  const [editTechnicianAnswer, setEditTechnicianAnswer] = useState('');
  const [editTags, setEditTags] = useState('');

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, text, metadata }: { id: string; text: string; metadata?: Record<string, any> }) =>
      documentsApi.update(id, text, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDoc(null);
    },
  });

  const updateQAMutation = useMutation({
    mutationFn: ({ id, question, customerAnswer, technicianAnswer, category, tags }: {
      id: string;
      question: string;
      customerAnswer: string;
      technicianAnswer: string;
      category?: string;
      tags?: string[];
    }) => documentsApi.updateQA(id, question, customerAnswer, technicianAnswer, { category, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDoc(null);
    },
  });

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    
    if (doc.metadata?.type === 'qa') {
      // QA dökümanı
      setEditQuestion(doc.metadata?.question || '');
      setEditCustomerAnswer(doc.metadata?.customerAnswer || '');
      setEditTechnicianAnswer(doc.metadata?.technicianAnswer || '');
      setEditCategory(doc.metadata?.category || '');
      setEditTags(doc.metadata?.tags?.join(', ') || '');
    } else {
      // Normal döküman
      setEditText(doc.text);
      setEditCategory(doc.metadata?.category || '');
      setEditProduct(doc.metadata?.product || '');
    }
  };

  const handleSaveEdit = () => {
    if (!editingDoc) return;
    
    if (editingDoc.metadata?.type === 'qa') {
      // QA güncellemesi
      if (!editQuestion.trim() || !editCustomerAnswer.trim() || !editTechnicianAnswer.trim()) return;
      
      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      updateQAMutation.mutate({
        id: editingDoc.id,
        question: editQuestion,
        customerAnswer: editCustomerAnswer,
        technicianAnswer: editTechnicianAnswer,
        category: editCategory || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    } else {
      // Normal döküman güncellemesi
      if (!editText.trim()) return;
      updateMutation.mutate({
        id: editingDoc.id,
        text: editText,
        metadata: {
          category: editCategory || undefined,
          product: editProduct || undefined,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="animate-spin text-kerzz-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Edit Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Döküman Düzenle</h3>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {editingDoc.metadata?.type === 'qa' ? (
                // QA Düzenleme Formu
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
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
                        Anahtar Kelimeler
                      </label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="yazıcı, bağlantı, hata"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soru
                    </label>
                    <textarea
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👤 Müşteri İçin Cevap
                    </label>
                    <textarea
                      value={editCustomerAnswer}
                      onChange={(e) => setEditCustomerAnswer(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔧 Teknisyen İçin Cevap
                    </label>
                    <textarea
                      value={editTechnicianAnswer}
                      onChange={(e) => setEditTechnicianAnswer(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                // Normal Döküman Düzenleme Formu
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İçerik
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün
                      </label>
                      <select
                        value={editProduct}
                        onChange={(e) => setEditProduct(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500 focus:border-transparent"
                      >
                        <option value="">Seçiniz</option>
                        <option value="kerzz-pos">Kerzz POS</option>
                        <option value="kerzz-cloud">Kerzz Cloud</option>
                        <option value="genel">Genel</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending || updateQAMutation.isPending}
                  className="px-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700 disabled:opacity-50"
                >
                  {(updateMutation.isPending || updateQAMutation.isPending) ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dökümanlar</h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {!documents?.length ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Henüz döküman yok</p>
          <p className="text-sm text-gray-400 mt-2">
            "Yükle" sekmesinden döküman ekleyebilirsiniz
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  İçerik
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Metadata
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {doc.metadata?.type === 'qa' ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          ❓ {doc.metadata.question}
                        </p>
                        <p className="text-xs text-gray-500">
                          👤 {doc.metadata.customerAnswer?.substring(0, 80)}...
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 line-clamp-2">{doc.text}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.metadata?.type === 'qa' && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                          Soru-Cevap
                        </span>
                      )}
                      {doc.metadata?.category && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {doc.metadata.category}
                        </span>
                      )}
                      {doc.metadata?.product && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          {doc.metadata.product}
                        </span>
                      )}
                      {doc.metadata?.tags && doc.metadata.tags.length > 0 && (
                        doc.metadata.tags.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(doc)}
                        className="text-blue-500 hover:text-blue-700 p-2"
                        title="Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(doc.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        disabled={deleteMutation.isPending}
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
