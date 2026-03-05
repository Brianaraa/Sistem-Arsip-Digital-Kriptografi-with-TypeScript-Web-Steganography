
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { EvidenceRecord } from '../types';
import { decryptFromDatabase } from '../services/cryptoService';

interface Props {
    username: string;
    onViewRecord: (record: EvidenceRecord) => void;
}

const EvidenceDashboard: React.FC<Props> = ({ username, onViewRecord }) => {
    const [records, setRecords] = useState<EvidenceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, [username]);

    const fetchRecords = async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('evidence_archives')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Melakukan dekripsi layer database untuk setiap field
            const decryptedData = data.map((item: any) => ({
                ...item,
                agent_id: decryptFromDatabase(item.agent_id),
                case_title: decryptFromDatabase(item.case_title),
                classification_level: decryptFromDatabase(item.classification_level),
                // Field di bawah ini memiliki enkripsi ganda (Logic + DB Layer)
                // Kita hanya membuka layer DB di sini, layer Logic dibuka di Viewer
                encrypted_description: decryptFromDatabase(item.encrypted_description),
                encrypted_file_b64: decryptFromDatabase(item.encrypted_file_b64),
                file_name: decryptFromDatabase(item.file_name),
                file_rail_key_hint: decryptFromDatabase(item.file_rail_key_hint),
                stego_image_b64: decryptFromDatabase(item.stego_image_b64)
            }));
            setRecords(decryptedData as EvidenceRecord[]);
        } else {
            console.error("Gagal mengambil bukti.", error);
        }
        setLoading(false);
    };

    const getClassificationColor = (level: string) => {
        switch(level) {
            case 'SANGAT RAHASIA': return 'text-alert-red border-alert-red';
            case 'RAHASIA': return 'text-terminal-amber border-terminal-amber';
            case 'KONFIDENSIAL': return 'text-blue-400 border-blue-400';
            default: return 'text-gray-400 border-gray-400';
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <header className="mb-8 border-b border-agency-border pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl text-white font-bold mb-1">DIREKTORI BERKAS KASUS</h2>
                    <p className="text-xs text-muted-text">MATERI TERKLASIFIKASI // HANYA PENGLIHATAN SAJA</p>
                </div>
                <button onClick={fetchRecords} className="text-xs text-terminal-green hover:underline">[SEGARKAN DATA]</button>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-terminal-green animate-pulse">
                    MENGAKSES PANGKALAN DATA...
                </div>
            ) : records.length === 0 ? (
                <div className="border border-dashed border-agency-border p-12 text-center text-muted-text">
                    TIDAK ADA KASUS AKTIF DITEMUKAN DALAM ARSIP.
                </div>
            ) : (
                <div className="grid gap-4">
                    {records.map((record) => (
                        <div 
                            key={record.id} 
                            onClick={() => onViewRecord(record)}
                            className="group bg-agency-gray border border-agency-border p-4 cursor-pointer hover:border-white transition-all hover:bg-agency-black relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className={`text-[10px] border px-2 py-1 font-bold ${getClassificationColor(record.classification_level)}`}>
                                    {record.classification_level}
                                </span>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-agency-black border border-agency-border flex items-center justify-center text-muted-text group-hover:text-white">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg group-hover:text-terminal-green transition-colors">{record.case_title}</h3>
                                    <p className="text-xs text-muted-text mt-1">DILAPORKAN OLEH: AGEN {record.agent_id} // {new Date(record.created_at).toLocaleDateString('id-ID')}</p>
                                    <div className="flex gap-4 mt-3 text-[10px] text-gray-500 font-mono">
                                        <span className="flex items-center gap-1">
                                            {record.encrypted_file_b64 ? '■ ASET LAMPIRAN' : '□ TANPA ASET'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {record.stego_image_b64 ? '■ LAPISAN STEGO' : '□ TANPA STEGO'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EvidenceDashboard;
