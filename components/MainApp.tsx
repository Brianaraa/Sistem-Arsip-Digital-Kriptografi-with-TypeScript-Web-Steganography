
import React, { useState } from 'react';
import EvidenceDashboard from './EvidenceDashboard';
import EvidenceIngestion from './EvidenceIngestion';
import EvidenceViewer from './EvidenceViewer';
import { EvidenceRecord, AuthMethod } from '../types';

interface MainAppProps {
    username: string;
    authMethod: AuthMethod;
    onLogout: () => void;
}

type ViewState = 'DASHBOARD' | 'INGEST' | 'VIEW';

const MainApp: React.FC<MainAppProps> = ({ username, authMethod, onLogout }) => {
    const [view, setView] = useState<ViewState>('DASHBOARD');
    const [selectedRecord, setSelectedRecord] = useState<EvidenceRecord | null>(null);

    const handleViewRecord = (record: EvidenceRecord) => {
        setSelectedRecord(record);
        setView('VIEW');
    };

    const handleBackToDashboard = () => {
        setSelectedRecord(null);
        setView('DASHBOARD');
    };

    return (
        <div className="min-h-screen bg-agency-black text-gray-300 font-mono flex flex-col md:flex-row">
            {/* Sidebar / Navigation */}
            <aside className="w-full md:w-64 bg-agency-gray border-b md:border-b-0 md:border-r border-agency-border flex flex-col justify-between shrink-0">
                <div>
                    <div className="p-6 border-b border-agency-border">
                        <h1 className="text-xl font-bold text-white tracking-widest">ARSIP DATA</h1>
                        <p className="text-xs text-terminal-green mt-1">KONEKSI AMAN TERHUBUNG</p>
                    </div>
                    
                    <nav className="p-4 space-y-2">
                        <button 
                            onClick={() => setView('DASHBOARD')}
                            className={`w-full text-left px-4 py-3 text-sm border-l-2 transition-colors ${view === 'DASHBOARD' ? 'border-terminal-green bg-agency-black text-white' : 'border-transparent text-muted-text hover:text-white hover:bg-agency-black/50'}`}
                        >
                            BERKAS KASUS
                        </button>
                         <button 
                            onClick={() => setView('INGEST')}
                            className={`w-full text-left px-4 py-3 text-sm border-l-2 transition-colors ${view === 'INGEST' ? 'border-terminal-green bg-agency-black text-white' : 'border-transparent text-muted-text hover:text-white hover:bg-agency-black/50'}`}
                        >
                            LAPOR BUKTI
                        </button>
                        <div className="mt-8 px-4 text-[10px] text-muted-text uppercase tracking-widest">
                            ALAT AGENSI
                        </div>
                        <div className="px-4 py-2 text-xs text-gray-500">
                             Protokol Enkripsi: <span className="text-terminal-amber">AKTIF</span>
                        </div>
                    </nav>
                </div>

                <div className="p-4 border-t border-agency-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded bg-agency-black border border-agency-border flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{username.substring(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-xs text-white">AGEN {username}</p>
                            <p className="text-[10px] text-terminal-green">TINGKAT AKSES 4</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full border border-alert-red/30 text-alert-red/80 hover:bg-alert-red/10 text-xs py-2 transition-colors uppercase">
                        PUTUS KONEKSI
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid-pattern bg-[length:40px_40px]">
                {view === 'DASHBOARD' && (
                    <EvidenceDashboard username={username} onViewRecord={handleViewRecord} />
                )}
                {view === 'INGEST' && (
                    <EvidenceIngestion username={username} onComplete={handleBackToDashboard} />
                )}
                {view === 'VIEW' && selectedRecord && (
                    <EvidenceViewer record={selectedRecord} onBack={handleBackToDashboard} authMethod={authMethod} username={username} />
                )}
            </main>
        </div>
    );
};

export default MainApp;
