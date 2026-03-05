
import React, { useState } from 'react';
import { BrowserProvider, ethers, Eip1193Provider } from 'ethers';
import { deriveKeyScrypt } from '../services/cryptoService';
import { supabase } from '../services/supabaseClient';
import { AuthMethod } from '../types';

declare global {
    interface Window {
        ethereum?: Eip1193Provider;
    }
}

interface LoginPageProps {
    onLoginSuccess: (username: string, method: AuthMethod) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const SALT = "biv-static-salt-veteran-2024";

    // --- Login Web3 (Dompet Digital) ---
    const handleWeb3Login = async () => {
        setError('');
        setIsLoading(true);

        if (typeof window.ethereum === 'undefined') {
            setError('AKSES DITOLAK: Dompet identitas digital tidak terdeteksi.');
            setIsLoading(false);
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const nonce = new Date().getTime();
            const messageToSign = `PERMINTAAN AKSES AGENSI BIV\n\nVERIFIKASI IDENTITAS DIPERLUKAN.\n\nTIMESTAMP: ${nonce}`;
            const signature = await signer.signMessage(messageToSign);
            const recoveredAddress = ethers.verifyMessage(messageToSign, signature);

            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                const shortAddress = `VETERAN-${address.substring(0, 6)}`;
                onLoginSuccess(shortAddress, 'WALLET');
            } else {
                setError('VERIFIKASI GAGAL: Tanda tangan biometrik tidak valid.');
            }
        } catch (err: any) {
            setError(err.code === 4001 ? 'AKSES DITOLAK: Pengguna membatalkan tanda tangan.' : 'KESALAHAN SISTEM: Koneksi terputus.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Login/Registrasi Password ---
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!supabase) {
            setError('KESALAHAN KONEKSI: Database pusat tidak dapat dihubungi.');
            setIsLoading(false);
            return;
        }

        if (!username || !password) {
            setError('KESALAHAN INPUT: Kredensial tidak lengkap.');
            setIsLoading(false);
            return;
        }

        try {
            if (mode === 'register') {
                const { data: existingUser, error: selectError } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') throw selectError;
                if (existingUser) throw new Error('KONFLIK IDENTITAS: Nomer Veteran sudah aktif.');

                const scryptHash = await deriveKeyScrypt(password, SALT);
                
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{ username, encrypted_hash: scryptHash }]);
                
                if (insertError) throw insertError;

                setSuccessMessage('IZIN DIBERIKAN: Identitas Veteran terdaftar. Silakan masuk.');
                setMode('login');
                setPassword('');

            } else { 
                const { data: user, error: selectError } = await supabase
                    .from('users')
                    .select('encrypted_hash')
                    .eq('username', username)
                    .single();

                if (selectError || !user) throw new Error('AKSES DITOLAK: Identitas Veteran tidak ditemukan.');
                
                const storedHash = user.encrypted_hash;
                const scryptHashToCompare = await deriveKeyScrypt(password, SALT);

                if (storedHash !== scryptHashToCompare) throw new Error('AKSES DITOLAK: Kredensial tidak valid.');
                
                onLoginSuccess(username, 'PASSWORD');
            }
        } catch (err: any) {
            setError(err.message || 'KESALAHAN SISTEM: Pengecualian tidak diketahui.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-agency-black bg-grid-pattern bg-[length:40px_40px]">
            <div className="w-full max-w-md bg-agency-gray border border-agency-border shadow-[0_0_15px_rgba(0,0,0,0.7)] relative overflow-hidden">
                {/* Decorative bar */}
                <div className="h-1 bg-terminal-green w-full animate-pulse"></div>
                
                <div className="p-8">
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-6 relative">
                            <div className="absolute inset-0 bg-terminal-amber/20 blur-xl rounded-full transform scale-75"></div>
                            <img 
                                src="https://img.inews.co.id/media/600/files/inews_new/2020/05/27/bin_logo_ist.jpg" 
                                alt="Lambang BIV" 
                                className="w-32 h-32 object-contain relative z-10 rounded-full border-2 border-agency-border/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] grayscale-[0.2] contrast-125" 
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-widest mb-1">B.I.V.</h1>
                        <p className="text-xs text-muted-text uppercase tracking-[0.2em]">BADAN INTELEJEN VETERAN</p>
                        <p className="text-[10px] text-terminal-amber mt-2">TERMINAL VETERAN // HANYA PERSONEL BERWENANG</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border-l-4 border-alert-red text-red-400 text-xs font-mono">
                            <span className="font-bold">GALAT:</span> {error}
                        </div>
                    )}
                     {successMessage && (
                        <div className="mb-6 p-3 bg-green-900/20 border-l-4 border-terminal-green text-terminal-green text-xs font-mono">
                            <span className="font-bold">SUKSES:</span> {successMessage}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                        <div className="relative group">
                            <label className="text-[10px] uppercase text-muted-text absolute -top-2 left-2 bg-agency-gray px-1 group-focus-within:text-terminal-green transition-colors">ID Veteran</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-agency-black border border-agency-border text-white px-4 py-3 focus:outline-none focus:border-terminal-green transition-colors font-mono placeholder-gray-700"
                                placeholder="MASUKKAN ID"
                            />
                        </div>
                        <div className="relative group">
                            <label className="text-[10px] uppercase text-muted-text absolute -top-2 left-2 bg-agency-gray px-1 group-focus-within:text-terminal-green transition-colors">Kode Sandi</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-agency-black border border-agency-border text-white px-4 py-3 focus:outline-none focus:border-terminal-green transition-colors font-mono placeholder-gray-700"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                             <button type="button" onClick={() => handlePasswordSubmit({ preventDefault: () => {} } as any)} className="flex-1 bg-white text-black font-bold py-2 hover:bg-gray-200 transition-colors uppercase text-sm tracking-wider">
                                {mode === 'login' ? 'Otentikasi' : 'Daftar ID Baru'}
                            </button>
                            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="px-3 border border-agency-border text-muted-text hover:text-white hover:border-white transition-colors text-xs uppercase">
                                {mode === 'login' ? 'Veteran Baru?' : 'Batal'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-agency-border text-center">
                        <p className="text-xs text-muted-text mb-3">- ATAU AKSES ALTERNATIF -</p>
                        <button onClick={handleWeb3Login} disabled={isLoading} className="w-full border border-terminal-amber/50 text-terminal-amber py-2 hover:bg-terminal-amber/10 transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                            Akses Biometrik / Wallet
                        </button>
                    </div>
                </div>
                
                {/* Footer status bar */}
                <div className="bg-agency-black px-4 py-2 flex justify-between text-[9px] text-muted-text font-mono border-t border-agency-border">
                    <span>STATUS_SIS: ONLINE</span>
                    <span>ENKRIPSI: VIGENERE-LAYERED</span>
                    <span>V.3.1.2-BIV</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
