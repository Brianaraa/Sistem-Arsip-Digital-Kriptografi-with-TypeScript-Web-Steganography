import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { supabase } from '../services/supabaseClient';
import { superEncrypt, superDecrypt } from '../services/cryptoService';

interface VaultItem {
    id: number;
    title: string;
    encrypted_content: string;
}

interface DataVaultProps {
    username: string;
}

const DataVault: React.FC<DataVaultProps> = ({ username }) => {
    const [items, setItems] = useState<VaultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for new item form
    const [title, setTitle] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [textContent, setTextContent] = useState('');
    
    // State for decryption
    const [decryptionKey, setDecryptionKey] = useState('');
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
    const [showModal, setShowModal] = useState(false);


    const fetchItems = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('vault_items')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setItems(data as VaultItem[]);
        }
        setIsLoading(false);
    }, [username]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    const clearMessages = () => {
        setError('');
        setSuccess('');
    }

    const handleSave = async () => {
        clearMessages();
        if (!title || !secretKey || !textContent) {
            setError('Please fill all fields: Drop Title, Encryption Key, and Message.');
            return;
        }
        if (!supabase) {
            setError('Supabase is not configured.');
            return;
        }
        
        setIsLoading(true);

        try {
            const encrypted_content = await superEncrypt(textContent, secretKey);

            const { error: insertError } = await supabase.from('vault_items').insert({
                username,
                title,
                data_type: 'text', // Keep for DB compatibility, though unused in UI
                encrypted_content,
            });

            if (insertError) throw insertError;

            // Reset form and refetch
            setTitle('');
            setSecretKey('');
            setTextContent('');
            setSuccess('Message was successfully encrypted and left in the drop!');
            fetchItems();
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBurnMessage = async (itemId: number) => {
        clearMessages();
        if (!supabase || !window.confirm('Are you sure you want to permanently burn this message? This action is irreversible.')) return;
    
        setIsLoading(true);
        const { count, error: deleteError } = await supabase
            .from('vault_items')
            .delete({ count: 'exact' })
            .eq('id', itemId)
            .eq('username', username);
    
        if (deleteError) {
            setError(`Failed to burn message: ${deleteError.message}`);
        } else if (count === 0) {
            setError('Could not burn message. It may have been already burned or you do not have permission.');
        } else {
            setSuccess(`Message burned successfully.`);
            fetchItems();
        }
        setIsLoading(false);
    };

    const handleDecrypt = async () => {
        clearMessages();
        if (!selectedItem || !decryptionKey) {
            setError('Please provide the encryption key to decrypt.');
            return;
        }
        try {
            const decrypted = await superDecrypt(selectedItem.encrypted_content, decryptionKey);
             // A simple check to see if decryption likely failed
            if (decrypted === selectedItem.encrypted_content) {
                throw new Error("Decryption failed. The key is likely incorrect.");
            }
            setDecryptedContent(decrypted);
            setShowModal(true);
        } catch (err: any) {
             setError(err.message || "Decryption failed. The key may be incorrect or the data is corrupt.");
        }
    }

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setDecryptionKey('');
        setDecryptedContent(null);
    }
    
    return (
        <Card title="Dead Drop" description="A secure, asynchronous message drop. Messages are encrypted client-side before storage and can be 'burned' on command.">
             <div className="p-6 space-y-6">
                {/* --- Add New Item Form --- */}
                <div className="p-4 border border-border-color rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-white">Leave a New Drop</h3>
                     <div className="space-y-4">
                        <Input id="vault-title" label="Drop Title" placeholder="e.g., Operation Nightingale" value={title} onChange={e => setTitle(e.target.value)} />
                        <Input id="vault-key" label="Encryption Key" type="password" placeholder="This key is NOT stored" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                        
                        <textarea value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Enter your secret message here" className="w-full h-24 p-2 bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent" />
                       
                        <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Dropping...' : 'Encrypt & Drop Message'}</Button>
                     </div>
                </div>

                {/* --- Messages --- */}
                {error && <p className="text-red-400 text-sm bg-red-800/20 p-3 rounded-md">{error}</p>}
                {success && <p className="text-green-400 text-sm bg-green-800/20 p-3 rounded-md">{success}</p>}

                {/* --- Vault Items List --- */}
                <div>
                     <h3 className="font-semibold text-lg mb-3 text-white">Active Drops</h3>
                     {isLoading && !items.length && <p className="text-text-secondary">Scanning for drops...</p>}
                     {!isLoading && !items.length && <p className="text-text-secondary">No active drops found. Leave a new drop above to get started.</p>}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-primary p-4 rounded-lg border border-border-color space-y-3 flex flex-col justify-between">
                               <div>
                                   <div className="flex items-start justify-between">
                                       <h4 className="font-bold text-text-primary break-all">{item.title}</h4>
                                       <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full capitalize">Text</span>
                                   </div>
                               </div>

                                {selectedItem?.id === item.id ? (
                                    <div className="space-y-2">
                                        <Input id={`decrypt-key-${item.id}`} type="password" placeholder="Enter Encryption Key" value={decryptionKey} onChange={e => setDecryptionKey(e.target.value)} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleDecrypt} className="w-full">Decrypt</Button>
                                            <Button onClick={() => setSelectedItem(null)} variant="secondary" className="w-full">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button onClick={() => setSelectedItem(item)} className="w-full">Decrypt</Button>
                                        <Button onClick={() => handleBurnMessage(item.id)} variant="danger" className="w-full">Burn Message</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

                {/* --- Decryption Modal --- */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={closeModal}>
                        <div className="bg-secondary rounded-lg border border-border-color shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-border-color flex justify-between items-center">
                               <h3 className="font-bold text-lg text-white">{selectedItem?.title}</h3>
                               <button onClick={closeModal} className="text-text-secondary hover:text-white text-2xl font-bold">&times;</button>
                            </div>
                            <div className="p-4">
                                {decryptedContent && (
                                    <p className="whitespace-pre-wrap break-words text-text-primary font-mono">{decryptedContent}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default DataVault;