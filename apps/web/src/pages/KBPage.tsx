import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  RefreshCw, 
  Plus, 
  Search, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  BookMarked,
  GitCommit,
  X,
  Upload
} from 'lucide-react';
import { kbApi, KBDocument } from '@/lib/api';

const DOC_TYPE_ICONS = {
  troubleshooting: AlertCircle,
  faq: HelpCircle,
  howto: BookMarked,
  'release-note': GitCommit,
  'known-issue': AlertCircle,
};

const DOC_TYPE_COLORS = {
  troubleshooting: 'bg-red-100 text-red-700',
  faq: 'bg-blue-100 text-blue-700',
  howto: 'bg-green-100 text-green-700',
  'release-note': 'bg-purple-100 text-purple-700',
  'known-issue': 'bg-orange-100 text-orange-700',
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
};

export default function KBPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterModule, setFilterModule] = useState('');
  const [filterDocType, setFilterDocType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDoc, setViewDoc] = useState<KBDocument | null>(null);

  // Create form state
  const [formType, setFormType] = useState('troubleshooting');
  const [formTitle, setFormTitle] = useState('');
  const [formModule, setFormModule] = useState('');
  const [formIntent, setFormIntent] = useState('');
  const [formRole, setFormRole] = useState('technician');
  const [formPriority, setFormPriority] = useState('medium');
  const [formTags, setFormTags] = useState('');
  const [formContent, setFormContent] = useState('');

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['kb-documents'],
    queryFn: () => kbApi.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ['kb-stats'],
    queryFn: () => kbApi.stats(),
  });

  const syncMutation = useMutation({
    mutationFn: kbApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-documents'] });
      queryClient.invalidateQueries({ queryKey: ['kb-stats'] });
    },
  });

  const reloadMutation = useMutation({
    mutationFn: kbApi.reload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-documents'] });
      queryClient.invalidateQueries({ queryKey: ['kb-stats'] });
    },
  });

  const filteredDocs = documents?.filter(doc => {
    if (filterModule && doc.metadata.module !== filterModule) return false;
    if (filterDocType && doc.metadata.docType !== filterDocType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.metadata.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query) ||
        doc.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleCreateDocument = () => {
    // Bu fonksiyon dökümanı backend'de değil, filesystem'de oluşturmalı
    // Şimdilik create-doc.js scriptine yönlendir
    alert('Yeni döküman oluşturmak için:\n\nTerminalde şu komutu çalıştırın:\ncd kb/scripts && ./create-doc.js\n\nVeya kb/templates/ altındaki şablonları kullanarak manuel oluşturun.');
    setShowCreateModal(false);
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
      {/* View Modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{viewDoc.metadata.title}</h3>
              <button
                onClick={() => setViewDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Metadata */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span> <code className="text-xs ml-2">{viewDoc.metadata.id}</code>
                  </div>
                  <div>
                    <span className="text-gray-500">Module:</span> <span className="ml-2">{viewDoc.metadata.module}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span> <span className="ml-2">{viewDoc.metadata.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[viewDoc.metadata.priority as keyof typeof PRIORITY_COLORS]}`}>
                      {viewDoc.metadata.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Intent:</span> <span className="ml-2">{viewDoc.metadata.intent}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span> <span className="ml-2">{viewDoc.metadata.updated_at}</span>
                  </div>
                </div>
                {viewDoc.metadata.tags && viewDoc.metadata.tags.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-500 text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewDoc.metadata.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap bg-white border rounded p-4 text-sm">
                  {viewDoc.content}
                </pre>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <p className="text-xs text-gray-500">
                📄 Dosya: <code>{viewDoc.filePath}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Yeni KB Dökümanı</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  ℹ️ <strong>Not:</strong> KB dökümanları dosya sistemi üzerinden yönetilir. 
                  Yeni döküman oluşturmak için:
                </p>
                <div className="mt-3 bg-white rounded p-3">
                  <code className="text-xs block">cd kb/scripts</code>
                  <code className="text-xs block">./create-doc.js</code>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Veya <code className="text-xs">kb/templates/</code> altındaki şablonları kullanın.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Döküman Tipi
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                  >
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="faq">FAQ</option>
                    <option value="howto">How-to</option>
                    <option value="release-note">Release Note</option>
                    <option value="known-issue">Known Issue</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modül
                    </label>
                    <input
                      type="text"
                      value={formModule}
                      onChange={(e) => setFormModule(e.target.value)}
                      placeholder="printing, payment, sync..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intent
                    </label>
                    <input
                      type="text"
                      value={formIntent}
                      onChange={(e) => setFormIntent(e.target.value)}
                      placeholder="printer_not_printing"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                    >
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Öncelik
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="yazıcı, ethernet, bağlantı"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateDocument}
                  className="px-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-kerzz-600" />
            Knowledge Base
          </h2>
          {stats && (
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} döküman • {Object.keys(stats.byModule).length} modül
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-kerzz-600 text-white rounded-lg hover:bg-kerzz-700"
          >
            <Plus size={18} />
            Yeni Döküman
          </button>
          <button
            onClick={() => reloadMutation.mutate()}
            disabled={reloadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <RefreshCw size={18} className={reloadMutation.isPending ? 'animate-spin' : ''} />
            Yenile
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <Upload size={18} />
            {syncMutation.isPending ? 'Sync ediliyor...' : 'Vector Sync'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Toplam</p>
            <p className="text-2xl font-bold text-kerzz-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Modüller</p>
            <p className="text-2xl font-bold">{Object.keys(stats.byModule).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.byPriority.high || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Troubleshooting</p>
            <p className="text-2xl font-bold text-orange-600">{stats.byType.troubleshooting || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search size={16} className="inline mr-1" />
              Ara
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık, içerik veya tag ara..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modül</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
            >
              <option value="">Tümü</option>
              {stats && Object.keys(stats.byModule).map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kerzz-500"
            >
              <option value="">Tümü</option>
              {stats && Object.keys(stats.byType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {!filteredDocs?.length ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Henüz KB dökümanı yok</p>
          <p className="text-sm text-gray-400 mt-2">
            "Yeni Döküman" ile başlayabilirsiniz
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => {
            const Icon = DOC_TYPE_ICONS[doc.metadata.docType as keyof typeof DOC_TYPE_ICONS] || FileText;
            const typeColor = DOC_TYPE_COLORS[doc.metadata.docType as keyof typeof DOC_TYPE_COLORS] || 'bg-gray-100 text-gray-700';
            const priorityColor = PRIORITY_COLORS[doc.metadata.priority as keyof typeof PRIORITY_COLORS];

            return (
              <div
                key={doc.metadata.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer"
                onClick={() => setViewDoc(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={20} className="text-gray-400" />
                      <h3 className="font-semibold text-lg">{doc.metadata.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.content.substring(0, 150)}...
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${typeColor}`}>
                        {doc.metadata.docType}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${priorityColor}`}>
                        {doc.metadata.priority}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {doc.metadata.module}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {doc.metadata.role}
                      </span>
                      {doc.metadata.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
