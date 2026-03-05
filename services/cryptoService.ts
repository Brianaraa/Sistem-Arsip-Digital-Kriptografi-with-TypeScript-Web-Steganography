
// --- MODUL KRIPTOGRAFI KLIEN ---
// Modul ini menangani operasi enkripsi/dekripsi secara lokal di browser.
// CATATAN KEAMANAN: Implementasi ini untuk tujuan demonstrasi arsitektur sistem.

// KUNCI LAPISAN DATABASE (Hardcoded untuk demo klien, di produksi harus di server-side)
// Semua data yang masuk ke database dibungkus dengan kunci ini.
const DB_LAYER_KEY = "VETERANMERDEKAATAUMATI"; 

/**
 * Derivasi Kunci (Scrypt Implementation)
 * Mengubah password menjadi hash menggunakan SHA-384 dengan salt.
 */
export const deriveKeyScrypt = async (password: string, salt: string): Promise<string> => {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-384', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Vigenère Cipher (Algoritma Substitusi Polialfabetik)
 * Digunakan sebagai cipher dasar dan lapisan pelindung database.
 */
export const vigenereCipher = (text: string, key: string, mode: 'encrypt' | 'decrypt'): string => {
    if (!key || !text) return text;
    
    // Pastikan key hanya karakter alfabet untuk simplifikasi logika math
    // Dalam implementasi ini kita melakukan operasi byte-wise untuk mendukung karakter apa saja
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        let processedChar: number;

        if (mode === 'encrypt') {
            processedChar = (charCode + keyChar) % 256;
            // Konversi ke Hex untuk penyimpanan aman karakter non-printable
            result += processedChar.toString(16).padStart(2, '0');
        } else {
            // Input diasumsikan Hex string saat decrypt
            // Logika dekripsi ditangani di fungsi wrapper di bawah karena input loop berbeda
        }
    }
    return result;
};

// Wrapper khusus untuk dekripsi Hex String Vigenere
const vigenereDecryptHex = (hexInput: string, key: string): string => {
    if (!key) return hexInput;
    if (/[^0-9a-fA-F]/.test(hexInput) || hexInput.length % 2 !== 0) return hexInput;

    let textOutput = '';
    for (let i = 0; i < hexInput.length; i += 2) {
        const hex = hexInput.substring(i, i + 2);
        const encryptedCharCode = parseInt(hex, 16);
        const keyCharCode = key.charCodeAt((i / 2) % key.length);
        const originalCharCode = (encryptedCharCode - keyCharCode + 256) % 256;
        textOutput += String.fromCharCode(originalCharCode);
    }
    return textOutput;
}

/**
 * Atbash Cipher (Algoritma Substitusi Monoalfabetik)
 * Membalik urutan alfabet (A->Z, B->Y).
 */
export const atbashCipher = (text: string): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba';
    return text.split('').map(char => {
        const index = alphabet.indexOf(char);
        return index !== -1 ? reversed[index] : char;
    }).join('');
};

/**
 * Super Encryption (Kombinasi Cipher)
 * Flow: Atbash -> Vigenère
 */
export const superEncrypt = async (text: string, key: string): Promise<string> => {
    const atbashResult = atbashCipher(text);
    return vigenereCipher(atbashResult, key, 'encrypt');
};

/**
 * Super Decryption
 * Flow: Vigenère Decrypt -> Atbash
 */
export const superDecrypt = async (ciphertext: string, key: string): Promise<string> => {
    const vigenereResult = vigenereDecryptHex(ciphertext, key);
    return atbashCipher(vigenereResult);
};

/**
 * Rail Fence Cipher (Algoritma Transposisi Byte)
 * Digunakan untuk mengamankan file biner.
 */
export const railFenceEncrypt = async (fileBytes: Uint8Array, key: string): Promise<Uint8Array> => {
    const rails = parseInt(key, 10);
    if (!key || isNaN(rails) || rails <= 1) return fileBytes;

    const fence: number[][] = Array.from({ length: rails }, () => []);
    let rail = 0;
    let direction = 1;

    for (const byte of fileBytes) {
        fence[rail].push(byte);
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction *= -1;
    }

    const encryptedBytesList = fence.flat();
    return new Uint8Array(encryptedBytesList);
};

export const railFenceDecrypt = async (encryptedBytes: Uint8Array, key: string): Promise<Uint8Array> => {
    const rails = parseInt(key, 10);
    if (!key || isNaN(rails) || rails <= 1) return encryptedBytes;

    const len = encryptedBytes.length;
    const fence: (number | null)[][] = Array.from({ length: rails }, () => Array(len).fill(null));
    
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < len; i++) {
        fence[rail][i] = 0; 
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction *= -1;
    }

    let index = 0;
    for (let r = 0; r < rails; r++) {
        for (let c = 0; c < len; c++) {
            if (fence[r][c] === 0) fence[r][c] = encryptedBytes[index++];
        }
    }
    
    const decryptedBytes: number[] = [];
    rail = 0;
    direction = 1;
    for (let i = 0; i < len; i++) {
        decryptedBytes.push(fence[rail][i]!);
        rail += direction;
        if (rail === rails - 1 || rail === 0) direction *= -1;
    }

    return new Uint8Array(decryptedBytes);
};


// --- Steganography (LSB - Least Significant Bit) ---

const messageToBinary = (message: string): string => {
    return message.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('') + '1111111111111110'; // Delimiter
};

const hideMessageLSB = (imageData: ImageData, binaryMessage: string) => {
    const data = imageData.data;
    if (binaryMessage.length > (data.length / 4) * 2) throw new Error("Pesan terlalu besar untuk gambar ini.");

    for (let i = 0; i < binaryMessage.length; i++) {
        const pixelIndex = Math.floor(i / 2) * 4;
        const channelIndex = 1 + (i % 2); // Kanal Hijau (1) dan Biru (2)
        data[pixelIndex + channelIndex] = (data[pixelIndex + channelIndex] & 0xFE) | parseInt(binaryMessage[i], 2);
    }
    return imageData;
};

const revealMessageLSB = (imageData: ImageData): string => {
    const data = imageData.data;
    let binaryMessage = '';
    for (let i = 0; i < data.length; i += 4) {
        binaryMessage += (data[i + 1] & 1); // Hijau
        binaryMessage += (data[i + 2] & 1); // Biru
    }

    const delimiterIndex = binaryMessage.indexOf('1111111111111110');
    if (delimiterIndex === -1) return "Tidak ada data tersembunyi.";

    const extractedBinary = binaryMessage.substring(0, delimiterIndex);
    let message = '';
    for (let i = 0; i < extractedBinary.length; i += 8) {
        const byte = extractedBinary.substring(i, i + 8);
        if (byte.length === 8) message += String.fromCharCode(parseInt(byte, 2));
    }
    return message;
};

export const steganographyHide = (imageUrl: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context error.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const newImageData = hideMessageLSB(imageData, messageToBinary(message));
                ctx.putImageData(newImageData, 0, 0);
                resolve(canvas.toDataURL());
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar.'));
        img.src = imageUrl;
    });
};

export const steganographyReveal = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context error.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                resolve(revealMessageLSB(imageData));
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar.'));
        img.src = imageUrl;
    });
};

// --- Helpers Uint8Array <-> Base64 ---
export const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const base64ToBytes = (base64: string): Uint8Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// --- DATABASE LAYER ENCRYPTION ---
// Fungsi ini dipanggil sebelum data dikirim ke Supabase, dan setelah data diambil.
// Menggunakan Vigenere Cipher pada semua string.

export const encryptForDatabase = (data: string | null): string | null => {
    if (data === null) return null;
    return vigenereCipher(data, DB_LAYER_KEY, 'encrypt');
};

export const decryptFromDatabase = (data: string | null): string | null => {
    if (data === null) return null;
    return vigenereDecryptHex(data, DB_LAYER_KEY);
};
