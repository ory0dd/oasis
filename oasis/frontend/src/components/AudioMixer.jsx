import React, { useEffect, useRef } from 'react';

export const AudioMixer = ({ 
    analyser, 
    micGain, 
    setMicGain, 
    eqLow, setEqLow, 
    eqMid, setEqMid, 
    eqHigh, setEqHigh,
    isRecording
}) => {
    const canvasRef = useRef(null);
    const meterRef = useRef(null);

    useEffect(() => {
        if (!analyser || !isRecording) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let animationId;
        
        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#0f172a'; // slate-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            let sum = 0;
            
            for(let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                sum += barHeight;
                
                // Color gradient based on frequency
                const r = barHeight + (25 * (i/bufferLength));
                const g = 250 * (i/bufferLength);
                const b = 250;
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                
                x += barWidth + 1;
            }
            
            // Update VU meter
            if (meterRef.current) {
                const average = sum / bufferLength;
                const meterHeight = Math.min(100, (average / 128) * 100);
                meterRef.current.style.height = `${meterHeight}%`;
                meterRef.current.style.backgroundColor = meterHeight > 85 ? '#ef4444' : meterHeight > 60 ? '#fbbf24' : '#10b981';
            }
        };
        
        draw();
        
        return () => cancelAnimationFrame(animationId);
    }, [analyser, isRecording]);

    if (!isRecording) return null;

    return (
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-4 flex gap-4 w-full animate-in slide-in-from-top-4 fade-in">
            {/* EQ Section */}
            <div className="flex flex-col gap-3 pr-4 border-r border-white/10">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">EQ Eight</h4>
                <div className="flex gap-4">
                    {/* Low */}
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqLow} onChange={(e) => setEqLow(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-amber-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-zinc-400 font-mono">{eqLow > 0 ? '+' : ''}{eqLow}</span>
                        <span className="text-[9px] text-amber-500 font-bold">LOW</span>
                    </div>
                    {/* Mid */}
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqMid} onChange={(e) => setEqMid(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-emerald-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-zinc-400 font-mono">{eqMid > 0 ? '+' : ''}{eqMid}</span>
                        <span className="text-[9px] text-emerald-500 font-bold">MID</span>
                    </div>
                    {/* High */}
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqHigh} onChange={(e) => setEqHigh(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-cyan-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-zinc-400 font-mono">{eqHigh > 0 ? '+' : ''}{eqHigh}</span>
                        <span className="text-[9px] text-cyan-500 font-bold">HIGH</span>
                    </div>
                </div>
            </div>

            {/* Spectrum Analyzer */}
            <div className="flex-1 flex flex-col gap-2">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Espectro</h4>
                <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden border border-black/50 relative">
                    <canvas ref={canvasRef} className="w-full h-full" width={400} height={120} />
                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-2 opacity-20">
                        <div className="border-b border-white w-full"></div>
                        <div className="border-b border-white w-full"></div>
                        <div className="border-b border-white w-full"></div>
                    </div>
                </div>
            </div>

            {/* Master Gain & VU Meter */}
            <div className="flex gap-4 pl-4 border-l border-white/10 items-center">
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gain</h4>
                    <input type="range" min="0.1" max="5.0" step="0.1" value={micGain} onChange={(e) => setMicGain(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-rose-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                    <span className="text-[9px] text-rose-400 font-mono font-bold">x{micGain.toFixed(1)}</span>
                </div>
                
                <div className="h-24 w-4 bg-black rounded-sm border border-white/10 relative overflow-hidden flex items-end p-[1px]">
                    {/* dB Markers */}
                    <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between py-1 pointer-events-none opacity-50 z-10">
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-2 border-red-500"></div>
                    </div>
                    {/* Meter fill */}
                    <div ref={meterRef} className="w-full bg-emerald-500 transition-all duration-75" style={{ height: '0%' }}></div>
                </div>
            </div>
        </div>
    );
};
