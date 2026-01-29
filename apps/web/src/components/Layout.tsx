import { Outlet, NavLink } from 'react-router-dom';
import { FileText, Upload, MessageSquare, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: FileText, label: 'Dökümanlar' },
  { to: '/upload', icon: Upload, label: 'Yükle' },
  { to: '/chat', icon: MessageSquare, label: 'Chat Test' },
  { to: '/prompts', icon: Settings, label: 'Promptlar' },
];

export default function Layout() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-kerzz-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Kerzz AI</h1>
            <span className="text-kerzz-200 text-sm">Döküman & Chatbot Yönetimi</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-kerzz-600 text-kerzz-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
