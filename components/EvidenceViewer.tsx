
import React, { useState } from 'react';
import { EvidenceRecord, AuthMethod } from '../types';
import { steganographyReveal, superDecrypt, railFenceDecrypt, base64ToBytes, deriveKeyScrypt } from '../services/cryptoService';
import { supabase } from '../services/supabaseClient';
import { BrowserProvider, ethers } from 'ethers';
import Button from './Button';
import Input from './Input';

interface Props {
    record: EvidenceRecord;
    username: string;
    authMethod: AuthMethod;
    onBack: () => void;
}

const EvidenceViewer: React.FC<Props> = ({ record, username, authMethod, onBack }) => {
    const [extractedKey, setExtractedKey] = useState<string | null>(null);
    const [decryptedDescription, setDecryptedDescription] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadError, setUploadError] = useState('');
    
    // Dekripsi File
    const [railKeyInput, setRailKeyInput] = useState('');
    const [isDecryptingFile, setIsDecryptingFile] = useState(false);

    // Fitur Penghapusan
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleKeyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError('');
        setIsExtracting(true);
        setDecryptedDescription(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
             const imageDataUrl = event.target?.result as string;
             try {
                 // 1. Ungkap Kunci dari Gambar yang Diunggah
                 const key = await steganographyReveal(imageDataUrl);
                 if (!key || key === "Tidak ada data tersembunyi.") {
                     throw new Error("GAMBAR KUNCI TIDAK VALID: Data tidak ditemukan.");
                 }
                 setExtractedKey(key);

                 // 2. Dekripsi Teks
                 const text = await superDecrypt(record.encrypted_description, key);
                 setDecryptedDescription(text);
             } catch (err: any) {
                 setUploadError("AKSES DITOLAK: Gambar tidak mengandung kunci yang benar.");
                 setExtractedKey(null);
             } finally {
                 setIsExtracting(false);
             }
        }
        reader.readAsDataURL(file);
    };

    const handleDownloadDecryptedFile = async () => {
        if (!record.encrypted_file_b64 || !railKeyInput) return;
        setIsDecryptingFile(true);
        try {
            const encryptedBytes = base64ToBytes(record.encrypted_file_b64);
            const decryptedBytes = await railFenceDecrypt(encryptedBytes, railKeyInput);
            
            const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TERDEKRIPSI_${record.file_name || 'Aset'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Dekripsi Gagal: Pin Rail Key Salah atau Data Korup");
        } finally {
            setIsDecryptingFile(false);
        }
    };

    // --- LOGIKA PENGHAPUSAN ---
    const confirmDelete = async () => {
        setDeleteError('');
        setIsDeleting(true);

        try {
            if (authMethod === 'PASSWORD') {
                if (!deleteInput) throw new Error("Kata sandi diperlukan.");
                
                // Ambil hash user dari DB
                const { data: user } = await supabase
                    .from('users')
                    .select('encrypted_hash')
                    .eq('username', username)
                    .single();
                
                const SALT = "biv-static-salt-veteran-2024"; // SALT yang diperbarui untuk BIV
                const inputHash = await deriveKeyScrypt(deleteInput, SALT);

                if (!user || user.encrypted_hash !== inputHash) {
                    throw new Error("Otentikasi Gagal: Kata sandi salah.");
                }

            } else if (authMethod === 'WALLET') {
                if (!window.ethereum) throw new Error("Wallet tidak ditemukan.");
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                
                const message = `KONFIRMASI PENGHAPUSAN\n\nID BERKAS: ${record.id}\nTIMESTAMP: ${new Date().getTime()}`;
                await signer.signMessage(message);
                // Jika tidak error, berarti sign sukses
            }

            // Lakukan penghapusan
            const { error } = await supabase.from('evidence_archives').delete().eq('id', record.id);
            if (error) throw error;

            setShowDeleteModal(false);
            onBack(); // Kembali ke dashboard
        } catch (err: any) {
            setDeleteError(err.message || "Gagal menghapus berkas.");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative">
            
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-xs text-muted-text hover:text-white flex items-center gap-1">
                    &lt; KEMBALI KE DIREKTORI
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="text-xs text-alert-red hover:bg-alert-red/10 border border-alert-red px-3 py-1 font-bold">
                    [ MUSNAHKAN BERKAS ]
                </button>
            </div>

            <div className="border border-agency-border bg-agency-gray p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase">{record.case_title}</h1>
                    <p className="text-sm text-terminal-amber mt-1">KLASIFIKASI: {record.classification_level}</p>
                    <p className="text-xs text-muted-text mt-2 font-mono">ID: {record.id} // AGEN: {record.agent_id} // TANGGAL: {new Date(record.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="w-32 h-32 border border-agency-border bg-black relative group">
                     {record.stego_image_b64 ? (
                        <>
                            <img src={record.stego_image_b64} className="w-full h-full object-cover opacity-30 grayscale" alt="Evidence" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] text-white bg-black/80 px-2 py-1 border border-white">SALINAN ARSIP</span>
                            </div>
                        </>
                     ) : (
                         <div className="flex items-center justify-center h-full text-[10px] text-gray-600">TIDAK ADA VISUAL</div>
                     )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom Kiri: Laporan Intel */}
                <div className="bg-agency-black border border-agency-border p-6 flex flex-col">
                    <h3 className="text-white font-bold border-b border-agency-border pb-2 mb-4 flex justify-between items-center">
                        <span>LAPORAN INTEL</span>
                        {!decryptedDescription ? 
                            <span className="text-[10px] text-alert-red animate-pulse">TERKUNCI</span> : 
                            <span className="text-[10px] text-terminal-green">TERBUKA</span>
                        }
                    </h3>

                    {!decryptedDescription ? (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                            <p className="font-mono text-xs break-all text-gray-700 opacity-50 blur-[2px] select-none">
                                {record.encrypted_description.substring(0, 200)}...
                            </p>
                            
                            <div className="bg-agency-gray p-4 border border-agency-border">
                                <p className="text-[10px] text-terminal-amber font-bold mb-2 uppercase tracking-wider">
                                    Protokol Keamanan: Kunci Fisik Diperlukan
                                </p>
                                <p className="text-xs text-muted-text mb-4">
                                    Unggah gambar "Pembawa Kunci" yang terkait dengan file ini untuk membuka konten terenkripsi.
                                </p>
                                
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/png"
                                        onChange={handleKeyImageUpload}
                                        disabled={isExtracting}
                                        className="block w-full text-xs text-gray-400
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-none file:border-0
                                          file:text-xs file:font-semibold
                                          file:bg-agency-black file:text-terminal-green
                                          file:border-terminal-green file:border
                                          hover:file:bg-terminal-green hover:file:text-black
                                          cursor-pointer"
                                    />
                                </div>
                                {isExtracting && <p className="text-xs text-terminal-green mt-2 animate-pulse">MENGANALISIS DATA GAMBAR...</p>}
                                {uploadError && <p className="text-xs text-alert-red mt-2 font-bold">{uploadError}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex-1">
                            <div className="bg-terminal-green/10 border-l-2 border-terminal-green p-2 mb-4">
                                <p className="text-[10px] text-terminal-green">IDENTITAS DIVERIFIKASI. KUNCI BERHASIL DIEKSTRAK.</p>
                            </div>
                            <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-sm font-mono whitespace-pre-wrap text-white">
                                    {decryptedDescription}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Kolom Kanan: Aset */}
                <div className="bg-agency-black border border-agency-border p-6">
                    <h3 className="text-white font-bold border-b border-agency-border pb-2 mb-4">ASET DIGITAL</h3>
                    {record.encrypted_file_b64 ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-agency-gray border border-agency-border">
                                <svg className="w-8 h-8 text-terminal-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <div className="overflow-hidden">
                                    <p className="text-sm text-white truncate">{record.file_name}</p>
                                    <p className="text-[10px] text-alert-red">STATUS: TERENKRIPSI (RAIL FENCE)</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-agency-border/50">
                                <Input 
                                    id="railInput" 
                                    label="MASUKKAN PIN (OFFSET RAIL)" 
                                    type="number" 
                                    value={railKeyInput} 
                                    onChange={e => setRailKeyInput(e.target.value)} 
                                    placeholder="Masukkan pin..."
                                />
                                <Button onClick={handleDownloadDecryptedFile} disabled={isDecryptingFile || !railKeyInput} className="w-full mt-2">
                                    {isDecryptingFile ? 'MEMPROSES...' : 'DEKRIPSI & UNDUH'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-xs text-muted-text border border-dashed border-agency-border">
                            TIDAK ADA LAMPIRAN ASET
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL PENGHAPUSAN */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-agency-gray border border-alert-red w-full max-w-md p-6 shadow-2xl relative">
                        <h3 className="text-alert-red font-bold text-lg mb-2">⚠ PERINGATAN PEMUSNAHAN</h3>
                        <p className="text-xs text-muted-text mb-4">
                            Tindakan ini tidak dapat dibatalkan. Verifikasi identitas Anda untuk melanjutkan penghapusan data secara permanen.
                        </p>
                        
                        {deleteError && <div className="mb-4 bg-red-900/50 text-alert-red text-xs p-2">{deleteError}</div>}

                        {authMethod === 'PASSWORD' ? (
                            <div className="mb-4">
                                <Input 
                                    id="deleteConfirm" 
                                    type="password" 
                                    label="MASUKKAN KATA SANDI ANDA" 
                                    value={deleteInput} 
                                    onChange={e => setDeleteInput(e.target.value)}
                                />
                            </div>
                        ) : (
                             <div className="mb-4 text-sm text-white bg-agency-black p-3 border border-agency-border">
                                Anda akan diminta untuk menandatangani pesan konfirmasi digital melalui dompet Anda.
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="danger" onClick={confirmDelete} disabled={isDeleting} className="w-full">
                                {isDeleting ? 'MEMUSNAHKAN...' : 'KONFIRMASI HAPUS'}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="w-full">
                                BATAL
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvidenceViewer;
