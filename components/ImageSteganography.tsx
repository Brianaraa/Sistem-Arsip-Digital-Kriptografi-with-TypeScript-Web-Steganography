import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { steganographyHide, steganographyReveal } from '../services/cryptoService';

const ImageSteganography: React.FC = () => {
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [stegoImage, setStegoImage] = useState<string | null>(null);
    const [imageToReveal, setImageToReveal] = useState<string | null>(null);
    
    const [message, setMessage] = useState('');
    const [revealedMessage, setRevealedMessage] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                if (setImage === setCoverImage) {
                    setStegoImage(null); // Clear previous result
                }
                 if (setImage === setImageToReveal) {
                    setRevealedMessage(null); // Clear previous result
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHideMessage = async () => {
        if (!coverImage || !message) {
            setError('Please provide a cover image and a secret message.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setRevealedMessage(null);
        try {
            const resultImage = await steganographyHide(coverImage, message);
            setStegoImage(resultImage);
        } catch (err: any) {
            setError(err.message || 'Failed to embed message.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevealMessage = async () => {
        if (!imageToReveal) {
            setError('Please provide an image to extract a message from.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const resultMessage = await steganographyReveal(imageToReveal);
            setRevealedMessage(resultMessage);
        } catch (err: any) {
            setError(err.message || 'Failed to extract message.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!stegoImage) return;
        const link = document.createElement('a');
        link.href = stegoImage;
        link.download = 'stego-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const tabStyle = (active: boolean) => active ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color';
    const [activeTab, setActiveTab] = useState('hide');

    return (
        <Card title="Steganography Protocol" description="Hide data within plain sight. Embed covert messages in standard image files using LSB steganography.">
            <div className="border-b border-border-color">
                <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('hide')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle(activeTab === 'hide')}`}>Embed Message</button>
                    <button onClick={() => setActiveTab('reveal')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabStyle(activeTab === 'reveal')}`}>Extract Message</button>
                </nav>
            </div>

            <div className="p-6">
                {error && <p className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-md">{error}</p>}
                
                {activeTab === 'hide' && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="cover-image-upload" className="block text-sm font-medium text-text-secondary mb-1">1. Upload Cover Image</label>
                            <Input id="cover-image-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, setCoverImage)} />
                        </div>
                        <div>
                            <label htmlFor="secret-message" className="block text-sm font-medium text-text-secondary mb-1">2. Enter Secret Message</label>
                            <textarea id="secret-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your secret message..." className="w-full h-24 p-2 bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent" />
                        </div>
                        <Button onClick={handleHideMessage} disabled={isLoading}>{isLoading ? 'Processing...' : '3. Embed Message'}</Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <h3 className="font-semibold text-text-secondary mb-2">Original Image</h3>
                                {coverImage ? <img src={coverImage} alt="Cover" className="rounded-md border border-border-color" /> : <div className="h-48 bg-secondary rounded-md flex items-center justify-center text-text-secondary">No image selected</div>}
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-secondary mb-2">Stego Image (with embedded message)</h3>
                                {stegoImage ? (
                                    <div>
                                        <img src={stegoImage} alt="Stego" className="rounded-md border border-border-color" />
                                        <Button onClick={handleDownload} className="mt-2 w-full md:w-auto">Download Stego Image</Button>
                                    </div>
                                ) : <div className="h-48 bg-secondary rounded-md flex items-center justify-center text-text-secondary">Result will appear here</div>}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'reveal' && (
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="stego-image-upload" className="block text-sm font-medium text-text-secondary mb-1">1. Upload Stego Image</label>
                            <Input id="stego-image-upload" type="file" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, setImageToReveal)} />
                        </div>
                        <Button onClick={handleRevealMessage} disabled={isLoading}>{isLoading ? 'Extracting...' : '2. Extract Message'}</Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                             <div>
                                <h3 className="font-semibold text-text-secondary mb-2">Image to Analyze</h3>
                                {imageToReveal ? <img src={imageToReveal} alt="To Reveal" className="rounded-md border border-border-color" /> : <div className="h-48 bg-secondary rounded-md flex items-center justify-center text-text-secondary">No image selected</div>}
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-secondary mb-2">Extracted Message</h3>
                                <div className="h-48 p-4 bg-secondary rounded-md border border-border-color text-text-primary font-mono whitespace-pre-wrap break-words overflow-y-auto">
                                    {revealedMessage ?? 'Message will appear here...'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ImageSteganography;