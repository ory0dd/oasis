import React, { useEffect, useRef } from 'react';

export const AudioMixer = ({ 
    analyser, 
    micGain, 
    setMicGain, 
    eqLow, setEqLow, 
    eqMid, setEqMid, 
    eqHigh, setEqHigh
}) => {
    const canvasRef = useRef(null);
    const meterRef = useRef(null);

    useEffect(() => {
        if (!analyser) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Ableton EQ colors
        const lowColor = '#fbbf24'; // amber-400
        const midColor = '#34d399'; // emerald-400
        const highColor = '#22d3ee'; // cyan-400
        const curveColor = '#fbbf24'; // yellow/amber curve
        const spectrumColor = '#3b82f680'; // blue-ish translucent
        
        let animationId;
        
        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#0f172a'; // slate-900 background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            // Draw grid
            ctx.strokeStyle = '#ffffff10';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Horizontal lines (dB)
            ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
            ctx.moveTo(0, h * 0.50); ctx.lineTo(w, h * 0.50); // 0 dB line
            ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
            // Vertical lines (log frequencies approx)
            [100, 1000, 10000].forEach(freq => {
                const fMin = 20;
                const fMax = 20000;
                const x = Math.max(0, Math.log10(freq / fMin) / Math.log10(fMax / fMin) * w);
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
            });
            ctx.stroke();
            
            // Draw Logarithmic Spectrum
            ctx.fillStyle = '#38bdf860'; // light blue filling like Ableton
            ctx.beginPath();
            ctx.moveTo(0, h);
            
            let sum = 0;
            const fMin = 20;
            const fMax = 20000;
            const nyquist = 22050; // approx
            
            for(let i = 1; i < bufferLength; i++) {
                const val = dataArray[i];
                sum += val;
                
                const freq = i * nyquist / bufferLength;
                if (freq < fMin) continue;
                if (freq > fMax) break;
                
                const x = Math.log10(freq / fMin) / Math.log10(fMax / fMin) * w;
                const percent = val / 255;
                const y = h - (percent * h * 0.8); // 80% max height for spectrum
                
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.fill();
            
            // Draw EQ Curve
            const eqToY = (eqVal) => h/2 - (eqVal/12) * (h/2 * 0.8);
            const freqToX = (freq) => Math.max(0, Math.log10(freq / fMin) / Math.log10(fMax / fMin) * w);
            
            const xLow = freqToX(150);
            const yLow = eqToY(eqLow);
            const xMid = freqToX(1000);
            const yMid = eqToY(eqMid);
            const xHigh = freqToX(3000);
            const yHigh = eqToY(eqHigh);
            
            ctx.strokeStyle = curveColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Curve start (low shelf effect)
            ctx.moveTo(0, yLow);
            ctx.lineTo(xLow - 20, yLow);
            
            // Bezier to mid
            ctx.bezierCurveTo(xLow + (xMid - xLow)/2, yLow, xMid - (xMid - xLow)/2, yMid, xMid, yMid);
            
            // Bezier to high
            ctx.bezierCurveTo(xMid + (xHigh - xMid)/2, yMid, xHigh - (xHigh - xMid)/2, yHigh, xHigh, yHigh);
            
            // Curve end (high shelf effect)
            ctx.lineTo(w, yHigh);
            ctx.stroke();
            
            // Draw EQ points
            const drawPoint = (x, y, label, color) => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2*Math.PI);
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
                ctx.stroke();
                
                ctx.fillStyle = color;
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y);
            };
            
            drawPoint(xLow, yLow, '1', lowColor);
            drawPoint(xMid, yMid, '2', midColor);
            drawPoint(xHigh, yHigh, '3', highColor);
            
            // Update VU meter
            if (meterRef.current) {
                const average = sum / bufferLength;
                const meterHeight = Math.min(100, (average / 15) * 100);
                meterRef.current.style.height = `${meterHeight}%`;
                meterRef.current.style.backgroundColor = meterHeight > 85 ? '#ef4444' : meterHeight > 60 ? '#fbbf24' : '#10b981';
            }
        };
        
        draw();
        
        return () => cancelAnimationFrame(animationId);
    }, [analyser, eqLow, eqMid, eqHigh]);

    // Always show mixer

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
                        <span className="text-[9px] text-amber-500 font-bold">150 Hz</span>
                    </div>
                    {/* Mid */}
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqMid} onChange={(e) => setEqMid(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-emerald-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-zinc-400 font-mono">{eqMid > 0 ? '+' : ''}{eqMid}</span>
                        <span className="text-[9px] text-emerald-500 font-bold">1 kHz</span>
                    </div>
                    {/* High */}
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqHigh} onChange={(e) => setEqHigh(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-cyan-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-zinc-400 font-mono">{eqHigh > 0 ? '+' : ''}{eqHigh}</span>
                        <span className="text-[9px] text-cyan-500 font-bold">3 kHz</span>
                    </div>
                </div>
            </div>

            {/* Spectrum Analyzer */}
            <div className="flex-1 flex flex-col gap-2">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Espectro y Curva EQ</h4>
                <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden border border-black/50 relative">
                    <canvas ref={canvasRef} className="w-full h-full" width={600} height={160} />
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
