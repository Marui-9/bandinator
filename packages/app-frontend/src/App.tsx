import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import {
  FileText,
  Database,
  GitBranch,
  BarChart3,
  FileDown,
  Search,
  MessageSquare,
  Server,
} from 'lucide-react';
import DocumentsPage from './pages/DocumentsPage';
import TendersPage from './pages/TendersPage';
import RulesPage from './pages/RulesPage';
import AnalysisPage from './pages/AnalysisPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import KBSearchPage from './pages/KBSearchPage';
import FileServersPage from './pages/FileServersPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-2xl font-bold text-blue-600">Team-Wiki</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavLink to="/" icon={<Database size={20} />}>
                    Home
                  </NavLink>
                  <NavLink to="/documents" icon={<FileText size={20} />}>
                    Documents
                  </NavLink>
                  <NavLink to="/file-servers" icon={<Server size={20} />}>
                    File Servers
                  </NavLink>
                  <NavLink to="/tenders" icon={<FileDown size={20} />}>
                    Tenders
                  </NavLink>
                  <NavLink to="/rules" icon={<GitBranch size={20} />}>
                    Rules
                  </NavLink>
                  <NavLink to="/analysis" icon={<BarChart3 size={20} />}>
                    Analysis
                  </NavLink>
                  <NavLink to="/kb-search" icon={<Search size={20} />}>
                    Search
                  </NavLink>
                  <NavLink to="/chat" icon={<MessageSquare size={20} />}>
                    Chat
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/file-servers" element={<FileServersPage />} />
            <Route path="/tenders" element={<TendersPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/kb-search" element={<KBSearchPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}

export default App;
