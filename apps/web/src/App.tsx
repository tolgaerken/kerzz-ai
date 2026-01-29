import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DocumentsPage from './pages/DocumentsPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import PromptsPage from './pages/PromptsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DocumentsPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="prompts" element={<PromptsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
