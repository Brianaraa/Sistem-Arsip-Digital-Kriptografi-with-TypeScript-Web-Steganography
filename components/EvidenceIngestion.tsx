
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { superEncrypt, railFenceEncrypt, steganographyHide, bytesToBase64, encryptForDatabase } from '../services/cryptoService';
import Button from './Button';
import Input from './Input';

interface Props {
    username: string;
    onComplete: () => void;
}

const EvidenceIngestion: React.FC<Props> = ({ username, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data Formulir
    const [title, setTitle] = useState('');
    const [classification, setClassification] = useState('KONFIDENSIAL');
    
    // Tahap 1: Teks
    const [description, setDescription] = useState('');
    const [textKey, setTextKey] = useState(''); // Untuk SuperEncrypt, nanti disembunyikan di Stego
    
    // Tahap 2: File
    const [file, setFile] = useState<File | null>(null);
    const [railKey, setRailKey] = useState(''); // Kunci numerik untuk Rail Fence
    
    // Tahap 3: Stego
    const [coverImage, setCoverImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setCoverImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!supabase) return;
        if (!coverImage) {
            setError("Gambar sampul diperlukan untuk transportasi kunci.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Enkripsi Deskripsi Teks (Super Encrypt: Atbash -> Vigenere)
            const encryptedDesc = await superEncrypt(description, textKey);

            // 2. Enkripsi File (Rail Fence)
            let encryptedFileB64: string | null = null;
            if (file && railKey) {
                const buffer = await file.arrayBuffer();
                const encryptedBytes = await railFenceEncrypt(new Uint8Array(buffer), railKey);
                encryptedFileB64 = bytesToBase64(encryptedBytes);
            }

            // 3. Sembunyikan Kunci Teks di Gambar Sampul (Steganografi LSB)
            const stegoImageB64 = await steganographyHide(coverImage, textKey);

            // 4. Unggah ke Supabase dengan ENKRIPSI DATABASE LAYER (Vigenere Global)
            // Semua field dienkripsi sekali lagi sebelum masuk database agar admin tidak bisa baca.
            
            const { error: dbError } = await supabase.from('evidence_archives').insert({
                agent_id: encryptForDatabase(username),
                case_title: encryptForDatabase(title),
                classification_level: encryptForDatabase(classification),
                encrypted_description: encryptForDatabase(encryptedDesc),
                encrypted_file_b64: encryptForDatabase(encryptedFileB64),
                file_name: encryptForDatabase(file?.name || null),
                file_rail_key_hint: encryptForDatabase(railKey ? `Offset Rail Fence: ${railKey.length}` : null),
                stego_image_b64: encryptForDatabase(stegoImageB64)
            });

            if (dbError) throw dbError;

            // 5. OTOMATIS UNDUH GAMBAR KUNCI
            const link = document.createElement('a');
            link.href = stegoImageB64;
            link.download = `PEMBAWA_KUNCI_${title.replace(/\s+/g, '_')}_AMAN.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onComplete();
        } catch (err: any) {
            setError(err.message || 'KEGAGALAN PELAPORAN');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl text-white font-bold">LAPORKAN PAKET BUKTI</h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`h-1 flex-1 ${step >= 1 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                    <div className={`h-1 flex-1 ${step >= 2 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                    <div className={`h-1 flex-1 ${step >= 3 ? 'bg-terminal-green' : 'bg-agency-border'}`}></div>
                </div>
                <p className="text-xs text-muted-text mt-2 text-right">LANGKAH {step} DARI 3</p>
            </header>

            {error && <div className="bg-red-900/20 text-alert-red border border-alert-red p-4 mb-6 text-sm font-mono">{error}</div>}

            <div className="bg-agency-gray border border-agency-border p-8 shadow-2xl relative">
                {/* Langkah 1: Info Dasar & Intel */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">INTELIJEN KASUS</h3>
                        <Input id="title" label="JUDUL OPERASI KASUS" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cth. PROYEK NUSANTARA" className="uppercase" />
                        
                        <div>
                            <label className="block text-sm font-medium text-muted-text mb-1">TINGKAT KLASIFIKASI</label>
                            <select value={classification} onChange={e => setClassification(e.target.value)} className="w-full bg-agency-black border border-agency-border text-white px-3 py-2 focus:outline-none focus:border-terminal-green">
                                <option>KONFIDENSIAL</option>
                                <option>RAHASIA</option>
                                <option>SANGAT RAHASIA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-text mb-1">LAPORAN INTEL (PLAINTEXT)</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-32 bg-agency-black border border-agency-border text-white p-2 focus:border-terminal-green font-mono text-sm"
                                placeholder="Masukkan temuan sensitif..."
                            />
                        </div>

                        <Input 
                            id="textKey" 
                            label="KUNCI ENKRIPSI LAPORAN (PASSPHRASE)" 
                            type="password" 
                            value={textKey} 
                            onChange={e => setTextKey(e.target.value)} 
                            placeholder="Kunci ini akan disembunyikan di gambar sampul nanti."
                        />

                        <div className="flex justify-end pt-4">
                            <Button onClick={() => { if(title && description && textKey) setStep(2) }} disabled={!title || !description || !textKey}>LANJUT KE UNGGAH ASET</Button>
                        </div>
                    </div>
                )}

                {/* Langkah 2: Aset File */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">LAMPIRAN ASET DIGITAL</h3>
                        
                        <div className="p-8 border-2 border-dashed border-agency-border text-center hover:border-terminal-green transition-colors cursor-pointer relative">
                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {file ? (
                                <p className="text-terminal-green font-bold">{file.name}</p>
                            ) : (
                                <p className="text-muted-text text-sm">TARUH DOKUMEN TERKLASIFIKASI DI SINI</p>
                            )}
                        </div>

                        {file && (
                            <Input 
                                id="railKey" 
                                label="OFFSET RAIL FENCE CIPHER (PIN ANGKA)" 
                                type="number" 
                                value={railKey} 
                                onChange={e => setRailKey(e.target.value)} 
                                placeholder="cth. 3, 5, 12"
                            />
                        )}
                        
                        <div className="flex justify-between pt-4">
                            <Button variant="secondary" onClick={() => setStep(1)}>KEMBALI</Button>
                            <Button onClick={() => setStep(3)}>LANJUT KE STEGANOGRAFI</Button>
                        </div>
                    </div>
                )}

                {/* Langkah 3: Steganografi & Finalisasi */}
                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg text-white font-bold border-b border-agency-border pb-2">LAPISAN TRANSPORTASI RAHASIA</h3>
                        <p className="text-xs text-muted-text">
                            Unggah "Gambar Sampul" yang terlihat biasa. Sistem akan menanamkan 
                            <span className="text-white"> Kunci Enkripsi Laporan</span> Anda di dalam piksel gambar ini. 
                        </p>
                        <div className="p-3 bg-terminal-green/10 border border-terminal-green text-xs text-terminal-green font-bold">
                            PENTING: SETELAH PENGIRIMAN, GAMBAR KUNCI AKAN OTOMATIS DIUNDUH. ANDA HARUS MENYIMPAN FILE INI UNTUK MEMBUKA KEMBALI ARSIP NANTI.
                        </div>

                        <div className="flex gap-4 items-start">
                             <div className="flex-1">
                                <label className="block text-sm font-medium text-muted-text mb-1">GAMBAR SAMPUL (PNG/JPG)</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-agency-black file:text-white hover:file:bg-gray-900"/>
                            </div>
                            {coverImage && (
                                <div className="w-24 h-24 border border-agency-border overflow-hidden bg-black">
                                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-80" />
                                </div>
                            )}
                        </div>

                        <div className="bg-agency-black p-4 border border-agency-border mt-4">
                            <h4 className="text-white text-xs font-bold mb-2">RINGKASAN OPERASI:</h4>
                            <ul className="text-xs text-muted-text space-y-1 font-mono">
                                <li>1. JUDUL KASUS: <span className="text-white">{title}</span></li>
                                <li>2. INTEL: <span className="text-terminal-green">ENKRIPSI GANDA (SUPER-CIPHER + VIGENERE DB)</span></li>
                                <li>3. FILE: {file ? <span className="text-terminal-green">ENKRIPSI GANDA (RAIL FENCE + VIGENERE DB)</span> : <span className="text-gray-600">NIHIL</span>}</li>
                                <li>4. TRANSFER KUNCI: <span className="text-terminal-green">MENANAMKAN KUNCI KE GAMBAR...</span></li>
                            </ul>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="secondary" onClick={() => setStep(2)}>KEMBALI</Button>
                            <Button onClick={handleSubmit} disabled={loading || !coverImage}>
                                {loading ? 'MENGENKRIPSI & MENGHASILKAN KUNCI...' : 'FINALISASI & UNDUH KUNCI'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvidenceIngestion;
