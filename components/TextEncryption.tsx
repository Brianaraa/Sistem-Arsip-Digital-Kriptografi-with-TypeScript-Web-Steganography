import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { superEncrypt, superDecrypt } from '../services/cryptoService';

const TextEncryption: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [key, setKey] = useState('');
    const [outputText, setOutputText] = useState('');
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

    const handleProcess = async () => {
        if (!inputText || !key) {
            setOutputText('Please provide both text and an encryption key.');
            return;
        }
        if (mode === 'encrypt') {
            setOutputText(await superEncrypt(inputText, key));
        } else {
            setOutputText(await superDecrypt(inputText, key));
        }
    };
    
    const handleSwap = () => {
        setInputText(outputText);
        setOutputText(inputText);
    }

    return (
        <Card title="Encrypted Channel" description="Encrypt sensitive messages for point-to-point secure communication. Uses a combination of Atbash and a simulated Serpent cipher.">
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="input-text" className="block text-sm font-medium text-text-secondary mb-1">Input Text</label>
                        <textarea
                            id="input-text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text to process"
                            className="w-full h-32 p-2 bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent"
                        />
                    </div>
                    <div>
                        <label htmlFor="output-text" className="block text-sm font-medium text-text-secondary mb-1">Output Text</label>
                        <textarea
                            id="output-text"
                            value={outputText}
                            readOnly
                            placeholder="Result will appear here"
                            className="w-full h-32 p-2 bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-secondary"
                        />
                    </div>
                </div>

                <Input
                    id="serpent-key"
                    label="Encryption Key"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your secret key"
                />

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <input type="radio" id="encrypt" name="mode" value="encrypt" checked={mode === 'encrypt'} onChange={() => setMode('encrypt')} className="form-radio h-4 w-4 text-accent bg-secondary border-border-color focus:ring-accent"/>
                        <label htmlFor="encrypt">Encrypt</label>
                    </div>
                    <div className="flex items-center space-x-2">
                         <input type="radio" id="decrypt" name="mode" value="decrypt" checked={mode === 'decrypt'} onChange={() => setMode('decrypt')} className="form-radio h-4 w-4 text-accent bg-secondary border-border-color focus:ring-accent"/>
                        <label htmlFor="decrypt">Decrypt</label>
                    </div>
                    <div className="flex-grow flex justify-end gap-2">
                        <Button onClick={handleSwap} variant="secondary">Swap</Button>
                        <Button onClick={handleProcess}>Process Text</Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TextEncryption;
