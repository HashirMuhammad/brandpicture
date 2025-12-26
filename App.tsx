
import React from 'react';
import AdGenerator from './components/AdGenerator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-lg">
              <i className="fas fa-bolt text-white"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Meta Ad Creator <span className="text-orange-600 font-black">PRO</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Active
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <AdGenerator />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6 text-center">
        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
          &copy; 2024 Meta Ad Creator Pro • Powered by Gemini 2.5 Flash
        </p>
      </footer>
    </div>
  );
};

export default App;
