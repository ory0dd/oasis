import { useState, useRef, useEffect, useCallback } from 'react';

export const useTranscription = (options = {}) => {
    const {
        lang = 'es-ES',
        continuous = true,
        interimResults = true,
        onTranscriptChange = null,
        onError = null,
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const isActiveRef = useRef(false);
    
    // Almacena el texto base (histórico) que ya fue consolidado en sesiones anteriores
    const baseTextRef = useRef('');
    // Almacena el texto final de la sesión actual de dictado
    const sessionFinalRef = useRef('');

    const onTranscriptChangeRef = useRef(onTranscriptChange);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onTranscriptChangeRef.current = onTranscriptChange;
        onErrorRef.current = onError;
    }, [onTranscriptChange, onError]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
        }
    }, []);

    const stopRecording = useCallback(() => {
        isActiveRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                // Ignore
            }
            recognitionRef.current = null;
        }
        setIsRecording(false);
        setInterimTranscript('');
    }, []);

    const startRecording = useCallback((initialText = '') => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const err = new Error("Speech Recognition not supported");
            setError(err);
            if (onErrorRef.current) onErrorRef.current(err);
            return;
        }

        setTranscript(initialText);
        setInterimTranscript('');
        setError(null);
        
        isActiveRef.current = true;
        baseTextRef.current = initialText;
        sessionFinalRef.current = '';

        const runStart = () => {
            if (!isActiveRef.current) return;
            
            const rec = new SpeechRecognition();
            rec.continuous = continuous;
            rec.interimResults = interimResults;
            rec.lang = lang;

            rec.onresult = (event) => {
                let currentSessionFinal = '';
                let currentSessionInterim = '';

                // SIEMPRE iteramos desde 0 para evitar el glitch de duplicación en Android/Chrome
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentSessionFinal += event.results[i][0].transcript;
                    } else {
                        currentSessionInterim += event.results[i][0].transcript;
                    }
                }

                sessionFinalRef.current = currentSessionFinal.trim();
                
                const base = baseTextRef.current;
                const newFullText = (base ? base + (sessionFinalRef.current ? ' ' : '') : '') + sessionFinalRef.current;
                
                setTranscript(newFullText);
                if (onTranscriptChangeRef.current) {
                    onTranscriptChangeRef.current(newFullText);
                }
                
                setInterimTranscript(currentSessionInterim);
            };

            rec.onend = () => {
                if (sessionFinalRef.current) {
                    const base = baseTextRef.current;
                    baseTextRef.current = (base ? base + ' ' : '') + sessionFinalRef.current;
                    sessionFinalRef.current = '';
                }

                if (isActiveRef.current) {
                    setTimeout(() => {
                        if (isActiveRef.current) {
                            try { rec.start(); } catch (e) { setIsRecording(false); }
                        }
                    }, 250);
                } else {
                    setIsRecording(false);
                }
            };

            rec.onerror = (event) => {
                const err = new Error(event.error);
                setError(err);
                if (onErrorRef.current) onErrorRef.current(err);
                
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    stopRecording();
                }
            };

            recognitionRef.current = rec;
            try {
                rec.start();
                setIsRecording(true);
            } catch (err) {
                setError(err);
                setIsRecording(false);
            }
        };

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setTimeout(runStart, 100);
        } else {
            runStart();
        }
    }, [lang, continuous, interimResults, stopRecording]);

    const toggleRecording = useCallback((currentText = '') => {
        if (isActiveRef.current) {
            stopRecording();
        } else {
            startRecording(currentText);
        }
    }, [startRecording, stopRecording]);

    // Permite actualizaciones manuales desde el exterior (ej. usuario editando el textarea)
    const handleSetTranscript = useCallback((newText) => {
        setTranscript(newText);
        baseTextRef.current = newText;
        sessionFinalRef.current = ''; // Reseteamos para no concatenar texto viejo
        if (isActiveRef.current && recognitionRef.current) {
            recognitionRef.current.stop(); // Reinicia el motor para limpiar su buffer interno
        }
    }, []);

    return {
        isRecording,
        transcript,
        interimTranscript,
        isSupported,
        error,
        startRecording,
        stopRecording,
        toggleRecording,
        setTranscript: handleSetTranscript
    };
};
