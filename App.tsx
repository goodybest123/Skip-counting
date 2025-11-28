
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// --- TYPES ---
type Difficulty = number;
type Particle = {
  id: number;
  x: number;
  y: number;
  emoji: string;
};

// --- CONSTANTS ---
const MAX_JUMPS = 16;

// Generate skip options: 1-20, then major intervals up to 100
const generateSkipOptions = () => {
  const options: number[] = [];
  // 1 to 20
  for (let i = 1; i <= 20; i++) options.push(i);
  // Major steps
  [25, 30, 40, 50, 60, 70, 75, 80, 90, 100].forEach(n => options.push(n));
  return Array.from(new Set(options)).sort((a, b) => a - b);
};

const SKIP_VALUES = generateSkipOptions();

// Helper to get color for a number (repeating pattern)
const getColorClass = (val: number, type: 'text' | 'bg' | 'border' | 'active') => {
  const colors = [
    { base: 'blue', text: 'text-blue-600', border: 'border-blue-500', bg: 'bg-blue-500', active: 'bg-blue-600' },
    { base: 'green', text: 'text-green-600', border: 'border-green-500', bg: 'bg-green-500', active: 'bg-green-600' },
    { base: 'purple', text: 'text-purple-600', border: 'border-purple-500', bg: 'bg-purple-500', active: 'bg-purple-600' },
    { base: 'orange', text: 'text-orange-600', border: 'border-orange-500', bg: 'bg-orange-500', active: 'bg-orange-600' },
    { base: 'pink', text: 'text-pink-600', border: 'border-pink-500', bg: 'bg-pink-500', active: 'bg-pink-600' },
    { base: 'teal', text: 'text-teal-600', border: 'border-teal-500', bg: 'bg-teal-500', active: 'bg-teal-600' },
    { base: 'red', text: 'text-red-600', border: 'border-red-500', bg: 'bg-red-500', active: 'bg-red-600' },
    { base: 'indigo', text: 'text-indigo-600', border: 'border-indigo-500', bg: 'bg-indigo-500', active: 'bg-indigo-600' },
  ];
  const color = colors[(val - 1) % colors.length];
  
  if (type === 'text') return color.text;
  if (type === 'border') return color.border;
  if (type === 'bg') return color.bg;
  if (type === 'active') return color.active;
  return '';
};

const CANVAS_HEIGHT = 400; // Increased height
const FROG_SIZE = 24;

// --- MAIN APP COMPONENT ---
export default function App() {
  const [currentSkip, setCurrentSkip] = useState<Difficulty>(2);
  const [customSkip, setCustomSkip] = useState<string>("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);
  const [jumpHistory, setJumpHistory] = useState<number[]>([0]);
  const [feedback, setFeedback] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameId = useRef<number>();

  // --- CALCULATIONS ---
  const maxTotalValue = currentSkip * MAX_JUMPS;
  
  // Dynamic Canvas Width Calculation
  // We want to prioritize showing every integer (1, 2, 3...) so we need sufficient px per unit.
  // Using 35px per unit ensures readable text.
  // Chrome/Firefox max canvas width is usually ~65535, so we cap at 64000 for safety.
  const MAX_CANVAS_WIDTH = 64000;
  const DESIRED_PX_PER_UNIT = 35; 
  
  const totalPixelsNeeded = maxTotalValue * DESIRED_PX_PER_UNIT + 200; // + padding
  const computedCanvasWidth = Math.min(MAX_CANVAS_WIDTH, Math.max(1000, totalPixelsNeeded));
  
  const progressPercentage = (jumpCount / MAX_JUMPS) * 100;

  // --- AUDIO & VISUAL EFFECTS ---
  const playSound = useCallback((type: 'jump' | 'celebrate' | 'win') => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const now = audioContextRef.current.currentTime;
    
    if (type === 'jump') {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(500, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } else if (type === 'celebrate' || type === 'win') {
        const notes = type === 'win' ? [523, 659, 784, 1047, 1318] : [659, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                if (!audioContextRef.current) return;
                const osc = audioContextRef.current.createOscillator();
                const gain = audioContextRef.current.createGain();
                osc.connect(gain);
                gain.connect(audioContextRef.current.destination);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
                osc.start(audioContextRef.current.currentTime);
                osc.stop(audioContextRef.current.currentTime + 0.5);
            }, i * 100);
        });
    }
  }, []);

  const createCelebration = useCallback((x: number, y: number) => {
    const particleEmojis = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🐸', '🎈'];
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: Math.random(),
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 300,
      emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  }, []);

  // --- CANVAS DRAWING LOGIC ---
  const drawScene = useCallback((position: number, history: number[], jumpPhase = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, computedCanvasWidth, CANVAS_HEIGHT);
    
    const lineY = CANVAS_HEIGHT / 2 + 40;
    const startX = 50;
    const drawWidth = computedCanvasWidth - 100;
    
    // Calculate precise spacing
    const spacing = drawWidth / maxTotalValue;

    // 1. Draw The "Real" Number Line Ruler
    ctx.beginPath();
    ctx.moveTo(startX, lineY);
    ctx.lineTo(startX + drawWidth, lineY);
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = '12px Balsamiq Sans';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';

    // Determine Tick Interval for Ruler
    // We try to force textStep to 1 unless it's physically impossible (e.g. text overlap)
    let textStep = 1;
    
    // Fallback: Only if spacing is extremely tight (< 20px), we switch to showing every 5th number.
    // Since we increased max canvas width, this should rarely trigger for inputs <= 100.
    if (spacing < 20) textStep = 5;
    if (spacing < 8) textStep = 10;

    // Draw Ruler Ticks
    for (let v = 0; v <= maxTotalValue; v++) {
        const tx = startX + v * spacing;
        
        // Draw tick for EVERY integer if spacing allows ( > 4px), otherwise stick to textSteps
        const shouldDrawTick = spacing > 4 || v % textStep === 0;

        if (shouldDrawTick) {
            const isLabelStep = v % textStep === 0;
            const tickHeight = isLabelStep ? 15 : 8;
            
            ctx.beginPath();
            ctx.moveTo(tx, lineY);
            ctx.lineTo(tx, lineY + tickHeight);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = isLabelStep ? 2 : 1;
            ctx.stroke();

            // Label
            if (isLabelStep) {
                ctx.fillText(v.toString(), tx, lineY + 30);
            }
        }
    }

    // 2. Draw History (Jump Arcs & Dots)
    history.forEach((pos, index) => {
        const hX = startX + (pos * spacing);
        
        // Draw Dot
        ctx.beginPath();
        ctx.fillStyle = index === 0 ? '#64748b' : '#fbbf24'; // Start gray, others amber
        ctx.arc(hX, lineY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Label the landing spot explicitly with larger text
        if (pos !== 0) {
            ctx.font = 'bold 18px Balsamiq Sans';
            ctx.fillStyle = '#d97706'; // amber-600
            ctx.fillText(pos.toString(), hX, lineY - 20);
        }

        // Draw Arc to next if exists
        if (index < history.length - 1) {
            const nextPos = history[index + 1];
            const nextX = startX + (nextPos * spacing);
            const midX = (hX + nextX) / 2;
            const dist = nextX - hX;
            // Higher arcs for bigger jumps
            const arcHeight = Math.min(180, dist * 0.6);
            
            ctx.beginPath();
            ctx.moveTo(hX, lineY);
            ctx.quadraticCurveTo(midX, lineY - arcHeight, nextX, lineY);
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    // 3. Draw Frog
    const frogX = startX + (position * spacing);
    const jumpHeight = Math.sin(jumpPhase * Math.PI) * 160; // Higher animation jump
    const bodyY = lineY - 10 - jumpHeight;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    const shadowSize = FROG_SIZE * (1 - jumpPhase * 0.5);
    ctx.ellipse(frogX, lineY + 5, shadowSize, shadowSize * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Frog Body
    const gradient = ctx.createRadialGradient(frogX, bodyY, 5, frogX, bodyY, FROG_SIZE);
    gradient.addColorStop(0, '#86efac');
    gradient.addColorStop(1, '#22c55e');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(frogX, bodyY, FROG_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(frogX - 10, bodyY - 12, 8, 0, Math.PI * 2);
    ctx.arc(frogX + 10, bodyY - 12, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(frogX - 10, bodyY - 12, 4, 0, Math.PI * 2);
    ctx.arc(frogX + 10, bodyY - 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(frogX, bodyY + 5, 10, 0, Math.PI, false);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current Number Label above frog
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 24px Balsamiq Sans';
    ctx.fillText(Math.round(position).toString(), frogX, bodyY - 45);

  }, [computedCanvasWidth, maxTotalValue]);

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (canvasWrapperRef.current) {
        const wrapper = canvasWrapperRef.current;
        const spacing = (computedCanvasWidth - 100) / maxTotalValue;
        const frogX = 50 + currentPosition * spacing;
        
        // Target scroll position: Center the frog
        const targetScroll = frogX - wrapper.clientWidth / 2;
        
        wrapper.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    }
  }, [currentPosition, computedCanvasWidth, maxTotalValue]);


  // --- GAME ACTIONS ---
  const handleJump = useCallback(() => {
    if (isAnimating) return;

    if (jumpCount >= MAX_JUMPS) {
        setFeedback(`Completed! Reset to try another number.`);
        return;
    }

    const newPosition = currentPosition + currentSkip;

    setIsAnimating(true);
    playSound('jump');

    const startPosition = currentPosition;
    const duration = 600;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease Out Quart
        const ease = 1 - Math.pow(1 - progress, 4);

        const animatedPosition = startPosition + (newPosition - startPosition) * ease;
        
        drawScene(animatedPosition, jumpHistory, progress);

        if (progress < 1) {
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            setCurrentPosition(newPosition);
            setJumpCount(prev => prev + 1);
            setJumpHistory(prev => [...prev, newPosition]);
            setIsAnimating(false);
            
            if (newPosition === maxTotalValue) { 
                setFeedback(`🎉 AMAZING! You counted by ${currentSkip}s to ${newPosition}! 🎉`);
                playSound('win');
                createCelebration(0, 0);
            } else {
                setFeedback(`Great jump! ${jumpCount + 1} × ${currentSkip} = ${newPosition}`);
                playSound('celebrate');
            }
        }
    };

    animationFrameId.current = requestAnimationFrame(animate);

  }, [isAnimating, currentPosition, currentSkip, jumpCount, maxTotalValue, playSound, createCelebration, drawScene, jumpHistory]);

  const handleReset = useCallback(() => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    setCurrentPosition(0);
    setJumpCount(0);
    setJumpHistory([0]);
    setFeedback("");
    setIsAnimating(false);
  }, []);

  // Redraw when idle (handles resize or reset)
  useEffect(() => {
    if (!isAnimating) {
        drawScene(currentPosition, jumpHistory);
    }
  }, [currentPosition, jumpHistory, drawScene, isAnimating]);

  const handleDifficultyChange = useCallback((skip: Difficulty) => {
    setCurrentSkip(skip);
    setCustomSkip(""); // Clear custom if picking preset
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    setCurrentPosition(0);
    setJumpCount(0);
    setJumpHistory([0]);
    setFeedback("");
    setIsAnimating(false);
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseInt(customSkip);
      if (val > 0 && val <= 100) { // Limit custom input to 100 as well
          handleDifficultyChange(val);
      }
  };

  // --- RENDER ---
  return (
    <div className="bg-white min-h-screen w-full font-sans text-gray-900">
      
      {/* Celebration Particles only for winning feedback */}
      {particles.map(p => (
        <div key={p.id} className="particle-animation fixed text-4xl z-50" style={{ left: `${p.x}px`, top: `${p.y}px` }}>
          {p.emoji}
        </div>
      ))}

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-2">
             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md inline-block transform -skew-x-6">
                <h1 className="text-2xl font-bold skew-x-6">Skip Jump Adventure!</h1>
             </div>
             <p className="text-gray-500 font-medium ml-1">Master multiplication and patterns!</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-sm font-bold text-blue-800 uppercase">Current Skip:</span>
              <span className="text-3xl font-bold text-blue-600">{currentSkip}</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left: Controls & Number Grid */}
            <div className="lg:w-1/3 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-gray-700">Select Number</span>
                         <form onSubmit={handleCustomSubmit} className="flex gap-2">
                             <input 
                                type="number" 
                                placeholder="#" 
                                value={customSkip}
                                onChange={(e) => setCustomSkip(e.target.value)}
                                className="w-16 px-2 py-1 rounded border border-gray-300 text-sm"
                             />
                             <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-blue-600">GO</button>
                         </form>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {SKIP_VALUES.map(val => (
                                <button 
                                    key={val} 
                                    onClick={() => handleDifficultyChange(val)}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                                        currentSkip === val 
                                            ? getColorClass(val, 'active') + ' text-white shadow-md transform scale-105'
                                            : getColorClass(val, 'text') + ' bg-white border ' + getColorClass(val, 'border') + ' hover:bg-gray-50'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col gap-2">
                    <div className="flex justify-between text-sm font-bold text-indigo-800">
                        <span>Progress</span>
                        <span>{jumpCount} / {MAX_JUMPS} Jumps</span>
                    </div>
                    <div className="w-full bg-indigo-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Right: Game Area */}
            <div className="lg:w-2/3 flex flex-col gap-4">
                
                {/* Math Board */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                        <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Addition</div>
                        <div className="text-2xl md:text-3xl font-mono font-bold text-orange-600">
                             {jumpCount === 0 ? "Start!" : `${currentPosition - currentSkip} + ${currentSkip} = ${currentPosition}`}
                        </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Multiplication</div>
                        <div className="text-2xl md:text-3xl font-mono font-bold text-blue-600">
                            {jumpCount} × {currentSkip} = {currentPosition}
                        </div>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="relative border-4 border-gray-200 rounded-2xl bg-white shadow-inner overflow-hidden flex-1 min-h-[400px] flex flex-col">
                     <div className="absolute top-2 left-4 text-xs font-bold text-gray-400 z-10">NUMBER LINE (1 - {maxTotalValue})</div>
                     
                     <div 
                        ref={canvasWrapperRef}
                        className="overflow-x-auto flex-1 w-full custom-scrollbar relative"
                        style={{ scrollBehavior: 'smooth' }}
                     >
                        <canvas 
                            ref={canvasRef} 
                            width={computedCanvasWidth} 
                            height={CANVAS_HEIGHT}
                            className="block"
                        />
                     </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-auto">
                    <button 
                        onClick={handleJump} 
                        disabled={isAnimating || jumpCount >= MAX_JUMPS}
                        className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none"
                    >
                        JUMP (+{currentSkip})
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="px-8 py-4 bg-gray-200 text-gray-600 rounded-xl font-bold text-xl hover:bg-gray-300 transition-colors"
                    >
                        RESET
                    </button>
                </div>

                <div className="text-center font-bold text-indigo-500 min-h-[24px]">
                    {feedback}
                </div>
            </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
