import React, { useState, useEffect } from 'react';
import { Mic, Loader2, X } from 'lucide-react';

interface VoiceInputProps {
    onResult: (text: string) => void;
    isProcessing?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.lang = 'it-IT';
            recognitionInstance.interimResults = false;

            recognitionInstance.onstart = () => setIsListening(true);
            recognitionInstance.onend = () => setIsListening(false);
            recognitionInstance.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setError("Errore microfono");
                setIsListening(false);
            };
            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            setRecognition(recognitionInstance);
        } else {
            setError("Browser non supportato");
        }
    }, [onResult]);

    const toggleListening = () => {
        if (isListening) {
            recognition?.stop();
        } else {
            setError(null);
            recognition?.start();
        }
    };

    if (error) {
        return <span className="text-xs text-rose-400">{error}</span>;
    }

    return (
        <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing}
            className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center ${isListening
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse ring-2 ring-rose-500/50'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Parla per aggiungere"
        >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className={`w-5 h-5 ${isListening ? 'scale-110' : ''}`} />}
        </button>
    );
};

export default VoiceInput;
