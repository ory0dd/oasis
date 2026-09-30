import React, { useEffect, useRef, useState } from 'react';

export const AudioMixer = ({ 
    analyser, 
    micGain, setMicGain, 
    eqLow, setEqLow, 
    eqMid, setEqMid, 
    eqHigh, setEqHigh,
    freqLow, setFreqLow,
    freqMid, setFreqMid,
    freqHigh, setFreqHigh
}) => {
    const canvasRef = useRef(null);
    const meterRef = useRef(null);
    const [draggingNode, setDraggingNode] = useState(null); // 'low', 'mid', 'high'

    const fMin = 20;
    const fMax = 20000;
    
    // Convert logic
    const eqToY = (eqVal, h) => h/2 - (eqVal/12) * (h/2 * 0.8);
    const yToEq = (y, h) => {
        let val = (h/2 - y) / (h/2 * 0.8) * 12;
        return Math.max(-12, Math.min(12, val));
    };
    
    const freqToX = (freq, w) => Math.max(0, Math.log10(freq / fMin) / Math.log10(fMax / fMin) * w);
    const xToFreq = (x, w) => {
        const ratio = x / w;
        let freq = fMin * Math.pow(10, ratio * Math.log10(fMax / fMin));
        return Math.max(fMin, Math.min(fMax, freq));
    };

    useEffect(() => {
        if (!analyser) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const lowColor = '#fbbf24'; 
        const midColor = '#34d399'; 
        const highColor = '#22d3ee'; 
        const curveColor = '#fbbf24'; 
        
        let animationId;
        
        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            
            ctx.strokeStyle = '#ffffff10';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
            ctx.moveTo(0, h * 0.50); ctx.lineTo(w, h * 0.50); 
            ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
            [100, 1000, 10000].forEach(freq => {
                const x = freqToX(freq, w);
                ctx.moveTo(x, 0); ctx.lineTo(x, h);
            });
            ctx.stroke();
            
            ctx.fillStyle = '#38bdf860';
            ctx.beginPath();
            ctx.moveTo(0, h);
            
            let sum = 0;
            const nyquist = 22050;
            
            for(let i = 1; i < bufferLength; i++) {
                const val = dataArray[i];
                sum += val;
                
                const freq = i * nyquist / bufferLength;
                if (freq < fMin) continue;
                if (freq > fMax) break;
                
                const x = freqToX(freq, w);
                const percent = val / 255;
                const y = h - (percent * h * 0.8);
                
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.fill();
            
            const xLow = freqToX(freqLow, w);
            const yLow = eqToY(eqLow, h);
            const xMid = freqToX(freqMid, w);
            const yMid = eqToY(eqMid, h);
            const xHigh = freqToX(freqHigh, w);
            const yHigh = eqToY(eqHigh, h);
            
            ctx.strokeStyle = curveColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, yLow);
            ctx.lineTo(xLow - 20, yLow);
            ctx.bezierCurveTo(xLow + (xMid - xLow)/2, yLow, xMid - (xMid - xLow)/2, yMid, xMid, yMid);
            ctx.bezierCurveTo(xMid + (xHigh - xMid)/2, yMid, xHigh - (xHigh - xMid)/2, yHigh, xHigh, yHigh);
            ctx.lineTo(w, yHigh);
            ctx.stroke();
            
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
            
            if (meterRef.current) {
                const average = sum / bufferLength;
                const meterHeight = Math.min(100, (average / 15) * 100);
                meterRef.current.style.height = `${meterHeight}%`;
                meterRef.current.style.backgroundColor = meterHeight > 85 ? '#ef4444' : meterHeight > 60 ? '#fbbf24' : '#10b981';
            }
        };
        
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [analyser, eqLow, eqMid, eqHigh, freqLow, freqMid, freqHigh]);

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const w = canvas.width;
        const h = canvas.height;
        
        const nodes = [
            { id: 'low', x: freqToX(freqLow, w), y: eqToY(eqLow, h) },
            { id: 'mid', x: freqToX(freqMid, w), y: eqToY(eqMid, h) },
            { id: 'high', x: freqToX(freqHigh, w), y: eqToY(eqHigh, h) }
        ];
        
        // Find closest node within 20px radius
        let closest = null;
        let minDist = 30; // hit radius
        for (let n of nodes) {
            const dist = Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2));
            if (dist < minDist) {
                minDist = dist;
                closest = n.id;
            }
        }
        
        if (closest) {
            setDraggingNode(closest);
        }
    };

    const handleMouseMove = (e) => {
        if (!draggingNode) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const w = canvas.width;
        const h = canvas.height;
        
        const newFreq = xToFreq(x, w);
        const newGain = yToEq(y, h);
        
        if (draggingNode === 'low') {
            setFreqLow(newFreq);
            setEqLow(newGain);
        } else if (draggingNode === 'mid') {
            setFreqMid(newFreq);
            setEqMid(newGain);
        } else if (draggingNode === 'high') {
            setFreqHigh(newFreq);
            setEqHigh(newGain);
        }
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const formatHz = (hz) => {
        if (hz >= 1000) return (hz/1000).toFixed(1) + 'k';
        return Math.round(hz);
    };

    return (
        <div 
            className="bg-[#18181b] border border-white/10 rounded-2xl p-4 flex gap-4 w-full animate-in slide-in-from-top-4 fade-in"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="flex flex-col gap-3 pr-4 border-r border-white/10">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">EQ Eight</h4>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqLow} onChange={(e) => setEqLow(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-amber-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-amber-500 font-bold">{formatHz(freqLow)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqMid} onChange={(e) => setEqMid(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-emerald-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-emerald-500 font-bold">{formatHz(freqMid)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <input type="range" min="-12" max="12" step="0.5" value={eqHigh} onChange={(e) => setEqHigh(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-cyan-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                        <span className="text-[9px] text-cyan-500 font-bold">{formatHz(freqHigh)}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 relative">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest cursor-default">Espectro y Curva EQ (Arrastra los nodos)</h4>
                <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden border border-black/50 relative">
                    <canvas 
                        ref={canvasRef} 
                        className={`w-full h-full ${draggingNode ? 'cursor-grabbing' : 'cursor-grab'}`}
                        width={600} 
                        height={160}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                    />
                </div>
            </div>

            <div className="flex gap-4 pl-4 border-l border-white/10 items-center">
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gain</h4>
                    <input type="range" min="0.1" max="5.0" step="0.1" value={micGain} onChange={(e) => setMicGain(parseFloat(e.target.value))} className="h-24 w-1.5 appearance-none bg-zinc-800 rounded-full accent-rose-500" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                    <span className="text-[9px] text-rose-400 font-mono font-bold">x{micGain.toFixed(1)}</span>
                </div>
                
                <div className="h-24 w-4 bg-black rounded-sm border border-white/10 relative overflow-hidden flex items-end p-[1px]">
                    <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between py-1 pointer-events-none opacity-50 z-10">
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-1"></div>
                        <div className="border-b border-white w-2 border-red-500"></div>
                    </div>
                    <div ref={meterRef} className="w-full bg-emerald-500 transition-all duration-75" style={{ height: '0%' }}></div>
                </div>
            </div>
        </div>
    );
};
