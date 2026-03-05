import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { railFenceEncrypt, railFenceDecrypt } from '../services/cryptoService';

const FileEncryption: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [key, setKey] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFeedback(`File selected: ${e.target.files[0].name}`);
        }
    };

    const processFile = async (operation: 'encrypt' | 'decrypt') => {
        if (!file) {
            setFeedback('Please select a file first.');
            return;
        }
        if (!key) {
            setFeedback('Please provide an encryption key (must be a number for Rail Fence).');
            return;
        }
        
        setIsProcessing(true);
        setFeedback(`Processing file... This may take a moment for large files.`);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    throw new Error('Could not read file content.');
                }
                
                const contentBytes = new Uint8Array(arrayBuffer);
                const isEncrypt = operation === 'encrypt';

                const resultBytes = isEncrypt 
                    ? await railFenceEncrypt(contentBytes, key) 
                    : await railFenceDecrypt(contentBytes, key);

                const blob = new Blob([resultBytes], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                const originalName = file.name;
                let downloadName = '';

                if (isEncrypt) {
                    downloadName = `${originalName}.rfc`;
                } else {
                    if (originalName.toLowerCase().endsWith('.rfc')) {
                        downloadName = originalName.slice(0, -'.rfc'.length);
                    } else {
                         downloadName = `decrypted_${originalName}`;
                    }
                }
                
                // Fallback for empty filename
                if (!downloadName) {
                    downloadName = 'decrypted_file';
                }

                a.download = downloadName;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setFeedback(`File successfully ${operation}ed and downloaded as ${downloadName}.`);

            } catch (error: any) {
                setFeedback(`Error: ${error.message || 'An unknown error occurred during the operation.'}`);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setFeedback('Failed to read file.');
            setIsProcessing(false);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Card title="File Obfuscation" description="Disguise and secure any file using the Rail Fence cipher. The key must be a number representing the number of 'rails'.">
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-text-secondary mb-2">Select a Document</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-border-color">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div> 
                </div>

                <Input
                    id="elgamal-key"
                    label="Encryption Key (Number of Rails)"
                    type="number"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g., 3"
                    required
                />

                {feedback && <p className="text-sm text-accent break-words">{feedback}</p>}

                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => processFile('encrypt')} disabled={!file || isProcessing}>{isProcessing ? 'Encrypting...' : 'Encrypt Document'}</Button>
                    <Button onClick={() => processFile('decrypt')} disabled={!file || isProcessing} variant="secondary">{isProcessing ? 'Decrypting...' : 'Decrypt Document'}</Button>
                </div>
            </div>
        </Card>
    );
};

export default FileEncryption;