import { useState, useRef, useEffect, useCallback } from 'react';

export const useTranscription = (options = {}) => {
    const {
        lang = 'es-ES',
        continuous = true,
        interimResults = true,
        onTranscriptChange = null,
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef(null);
    const baseTextRef = useRef('');
    const shouldBeRecordingRef = useRef(false);

    const onTranscriptChangeRef = useRef(onTranscriptChange);
    useEffect(() => {
        onTranscriptChangeRef.current = onTranscriptChange;
    }, [onTranscriptChange]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
        }
    }, []);

    const stopRecording = useCallback(() => {
        shouldBeRecordingRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (err) {
                console.error("Failed to stop speech recognition:", err);
            }
        }
        setIsRecording(false);
        setInterimTranscript('');
    }, []);

    const startRecording = useCallback((initialText = '') => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        setTranscript(initialText);
        setInterimTranscript('');
        baseTextRef.current = initialText;
        shouldBeRecordingRef.current = true;

        const runStart = () => {
            if (!shouldBeRecordingRef.current) return;
            const rec = new SpeechRecognition();
            rec.continuous = continuous;
            rec.interimResults = interimResults;
            rec.lang = lang;

            rec.onresult = (event) => {
                let finalSegment = '';
                let interimSegment = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalSegment += event.results[i][0].transcript;
                    } else {
                        interimSegment += event.results[i][0].transcript;
                    }
                }

                if (finalSegment) {
                    setTranscript(prev => {
                        const base = prev.trim();
                        const updated = base ? base + ' ' + finalSegment.trim() : finalSegment.trim();
                        if (onTranscriptChangeRef.current) {
                            onTranscriptChangeRef.current(updated);
                        }
                        return updated;
                    });
                    setInterimTranscript('');
                } else if (interimSegment) {
                    setInterimTranscript(interimSegment);
                }
            };

            rec.onend = () => {
                if (shouldBeRecordingRef.current && recognitionRef.current === rec) {
                    try {
                        rec.start();
                    } catch (err) {
                        console.error("Failed to restart onend:", err);
                    }
                } else {
                    if (recognitionRef.current === rec) {
                        setIsRecording(false);
                        setInterimTranscript('');
                        recognitionRef.current = null;
                    }
                }
            };

            rec.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
            };

            recognitionRef.current = rec;
            try {
                rec.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Failed to start speech recognition:", err);
                setIsRecording(false);
            }
        };

        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (err) {
                console.error("Failed to abort existing recognition:", err);
            }
            recognitionRef.current = null;
            setTimeout(runStart, 200);
        } else {
            runStart();
        }
    }, [lang, continuous, interimResults]);

    const toggleRecording = useCallback((currentText = '') => {
        if (shouldBeRecordingRef.current) {
            stopRecording();
        } else {
            startRecording(currentText);
        }
    }, [startRecording, stopRecording]);

    return {
        isRecording,
        transcript,
        interimTranscript,
        isSupported,
        startRecording,
        stopRecording,
        toggleRecording,
        setTranscript
    };
};

