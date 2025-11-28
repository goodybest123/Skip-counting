
import React, { useState, useRef, useEffect, useMemo } from 'react';

// --- TYPES ---
type Difficulty = number;
type Particle = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
  life: number;
};

// --- CONSTANTS ---
const MAX_JUMPS = 16;
const CANVAS_HEIGHT = 450;
const FROG_SIZE = 32;

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

// Kid-friendly color palette for buttons
const getButtonColor = (index: number) => {
    const colors = [
        'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:border-red-400',
        'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 hover:border-orange-400',
        'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 hover:border-amber-400',
        'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400',
        'bg-lime-100 text-lime-700 border-lime-300 hover:bg-lime-200 hover:border-lime-400',
        'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400',
        'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400',
        'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200 hover:border-teal-400',
        'bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200 hover:border-cyan-400',
        'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 hover:border-sky-400',
        'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:border-blue-400',
        'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200 hover:border-indigo-400',
        'bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200 hover:border-violet-400',
        'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:border-purple-400',
        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-200 hover:border-fuchsia-400',
        'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200 hover:border-pink-400',
        'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200 hover:border-rose-400',
    ];
    return colors[index % colors.length];
};

const BackgroundScenery = () => (
  <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden font-sans">
    {/* Sky Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100"></div>
    
    {/* Sun */}
    <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-pulse"></div>
    <div className="absolute top-14 right-14 w-24 h-24 bg-yellow-100 rounded-full opacity-80 shadow-[0_0_40px_rgba(253,224,71,0.6)]"></div>

    {/* Rainbow Arc (CSS borders) */}
    <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[150vmax] h-[150vmax] rounded-full border-[4rem] border-t-red-400/20 border-r-transparent border-b-transparent border-l-transparent blur-sm"></div>
    <div className="absolute -top-[5%] left-1/2 -translate-x-1/2 w-[140vmax] h-[140vmax] rounded-full border-[4rem] border-t-orange-400/20 border-r-transparent border-b-transparent border-l-transparent blur-sm"></div>
    <div className="absolute top-[0%] left-1/2 -translate-x-1/2 w-[130vmax] h-[130vmax] rounded-full border-[4rem] border-t-yellow-400/20 border-r-transparent border-b-transparent border-l-transparent blur-sm"></div>
    <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[120vmax] h-[120vmax] rounded-full border-[4rem] border-t-green-400/20 border-r-transparent border-b-transparent border-l-transparent blur-sm"></div>
    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[110vmax] h-[110vmax] rounded-full border-[4rem] border-t-blue-400/20 border-r-transparent border-b-transparent border-l-transparent blur-sm"></div>

    {/* Clouds */}
    <div className="cloud cloud-slow absolute top-[10%] left-[5%] text-[8rem] opacity-80 drop-shadow-lg">☁️</div>
    <div className="cloud cloud-fast absolute top-[20%] right-[10%] text-[6rem] opacity-90 drop-shadow-md">☁️</div>
    <div className="cloud cloud-slow absolute top-[15%] left-[40%] text-[10rem] opacity-60 drop-shadow-xl">☁️</div>

    {/* Rolling Hills */}
    <div className="absolute bottom-[-10vh] -left-[10%] w-[120%] h-[50vh] bg-[#86efac] rounded-[100%] border-t-8 border-[#4ade80] shadow-lg"></div>
    <div className="absolute bottom-[-15vh] -right-[10%] w-[120%] h-[50vh] bg-[#4ade80] rounded-[100%] border-t-8 border-[#22c55e] shadow-lg"></div>
    <div className="absolute bottom-[-20vh] left-[20%] w-[150%] h-[40vh] bg-[#bef264] rounded-[100%] border-t-8 border-[#a3e635] shadow-lg"></div>
    
    {/* Decor */}
    <div className="absolute bottom-[25vh] left-[15%] text-6xl animate-bounce drop-shadow-md" style={{ animationDuration: '3s' }}>🍄</div>
    <div className="absolute bottom-[20vh] right-[20%] text-6xl animate-bounce drop-shadow-md" style={{ animationDuration: '4s' }}>🌼</div>
    <div className="absolute bottom-[15vh] left-[30%] text-5xl animate-pulse drop-shadow-sm">🌱</div>
    <div className="absolute bottom-[18vh] right-[5%] text-7xl text-green-700/20">🌲</div>
    <div className="absolute bottom-[22vh] left-[5%] text-7xl text-green-700/20">🌳</div>
  </div>
);

export default function App() {
  const [currentSkip, setCurrentSkip] = useState<Difficulty>(2);
  const [customSkip, setCustomSkip] = useState<string>("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [history, setHistory] = useState<number[]>([0]);
  const [isJumping, setIsJumping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // --- DERIVED VALUES ---
  const maxNumber = currentSkip * MAX_JUMPS;
  
  // Calculate canvas dimensions
  const PADDING_X = 50;
  const desiredPixelsPerUnit = 40; 
  const safeMaxCanvasWidth = 32000;
  
  const canvasWidth = useMemo(() => {
    let width = maxNumber * desiredPixelsPerUnit + (PADDING_X * 2);
    if (width > safeMaxCanvasWidth) {
      width = safeMaxCanvasWidth;
    }
    // Ensure it's at least screen width
    if (typeof window !== 'undefined') {
       width = Math.max(width, window.innerWidth - 48);
    }
    return width;
  }, [maxNumber]);

  const pixelsPerUnit = (canvasWidth - PADDING_X * 2) / maxNumber;

  // --- AUDIO (Simple Beep) ---
  const playSound = (type: 'jump' | 'win') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'jump') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        // Win sound
        const now = ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = freq;
          gain2.gain.setValueAtTime(0.1, now + i * 0.1);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          osc2.start(now + i * 0.1);
          osc2.stop(now + i * 0.1 + 0.3);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- GAME LOGIC ---
  const resetGame = (newSkip?: number) => {
    const skip = newSkip || currentSkip;
    setCurrentSkip(skip);
    setCurrentPosition(0);
    setJumpCount(0);
    setHistory([0]);
    setShowWin(false);
    setParticles([]);
    setIsJumping(false);
    
    // Scroll to start
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  const handleSkipSelection = (n: number) => {
    resetGame(n);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customSkip);
    if (!isNaN(val) && val > 0 && val <= 260) {
      resetGame(val);
      setCustomSkip("");
    }
  };

  const handleJump = () => {
    if (showWin || isJumping) return;

    if (jumpCount < MAX_JUMPS) {
      setIsJumping(true);
      playSound('jump');
    }
  };

  // --- ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation constants
    const JUMP_DURATION = 600; // ms
    let startTime: number | null = null;
    
    // Re-calculate visual positions based on state
    const targetPos = currentPosition + currentSkip;
    const startPixelX = PADDING_X + currentPosition * pixelsPerUnit;
    const targetPixelX = PADDING_X + targetPos * pixelsPerUnit;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let currentFrogX = startPixelX;
      let currentFrogY = CANVAS_HEIGHT / 2;

      // Update Jump Physics
      if (isJumping) {
        const progress = Math.min(elapsed / JUMP_DURATION, 1);
        
        // Parabolic arc: y = 4 * h * x * (1 - x)
        // Jump height relative to distance, but capped for visibility
        const jumpHeight = Math.min(250, (targetPixelX - startPixelX) * 0.8);
        const yOffset = 4 * jumpHeight * progress * (1 - progress);
        
        currentFrogX = startPixelX + (targetPixelX - startPixelX) * progress;
        currentFrogY = (CANVAS_HEIGHT / 2) - yOffset;

        // Auto Scroll to keep frog centered
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const centerScreen = container.clientWidth / 2;
          const targetScroll = currentFrogX - centerScreen;
          // Direct DOM manipulation for performance
          container.scrollLeft = targetScroll;
        }

        if (progress >= 1) {
          // Landed
          setIsJumping(false);
          setCurrentPosition(prev => prev + currentSkip);
          setJumpCount(prev => prev + 1);
          setHistory(prev => [...prev, targetPos]);
          startTime = null; // Reset

          // Check Win
          if (jumpCount + 1 >= MAX_JUMPS) {
            setShowWin(true);
            playSound('win');
            // Spawn particles
            const newParticles: Particle[] = [];
            for (let i = 0; i < 50; i++) {
              newParticles.push({
                id: i,
                x: window.innerWidth / 2, // Spurt from center screen visually
                y: window.innerHeight / 2,
                emoji: ['⭐', '🌟', '✨', '🐸', '🎉', '🎈', '🌈', '🍭'][Math.floor(Math.random() * 8)],
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0
              });
            }
            setParticles(newParticles);
          }
          // Don't continue animation loop for jump if done, but we need one last draw
          currentFrogX = targetPixelX;
          currentFrogY = CANVAS_HEIGHT / 2;
        }
      } else {
        // Static position
        currentFrogX = startPixelX;
        currentFrogY = CANVAS_HEIGHT / 2;
      }

      // Draw Scene
      drawScene(ctx, canvasWidth, CANVAS_HEIGHT, currentFrogX, currentFrogY);
      
      if (isJumping) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Draw once and stop loop
        animationRef.current = requestAnimationFrame(() => drawScene(ctx, canvasWidth, CANVAS_HEIGHT, currentFrogX, currentFrogY));
      }
    };

    const drawScene = (ctx: CanvasRenderingContext2D, w: number, h: number, frogX: number, frogY: number) => {
      ctx.clearRect(0, 0, w, h);
      
      const baselineY = h / 2 + 20;

      // Draw Main Line
      ctx.beginPath();
      ctx.moveTo(PADDING_X, baselineY);
      ctx.lineTo(w - PADDING_X, baselineY);
      ctx.strokeStyle = '#64748b'; // slate-500
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw Ticks & Numbers
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 14px "Balsamiq Sans"';
      ctx.fillStyle = '#64748b'; // slate-500

      // Decide step size for labels based on density
      let textStep = 1;
      if (pixelsPerUnit < 15) textStep = 5;
      if (pixelsPerUnit < 5) textStep = 10;
      if (pixelsPerUnit < 2) textStep = 50;
      
      for (let i = 0; i <= maxNumber; i++) {
        const x = PADDING_X + i * pixelsPerUnit;
        const isMajor = i % currentSkip === 0;
        
        // Tick mark
        ctx.beginPath();
        ctx.moveTo(x, baselineY - (isMajor ? 12 : 6));
        ctx.lineTo(x, baselineY + (isMajor ? 12 : 6));
        ctx.strokeStyle = isMajor ? '#334155' : '#94a3b8';
        ctx.lineWidth = isMajor ? 3 : 2;
        ctx.stroke();

        // Label
        if (i % textStep === 0 || i === maxNumber || i === 0) {
            // Highlighting logic
            const isLanded = history.includes(i);
            const isTarget = i === currentPosition + currentSkip;
            
            ctx.save();
            if (isLanded) {
                ctx.fillStyle = '#16a34a'; // green-600
                ctx.font = 'bold 18px "Balsamiq Sans"';
            } else if (isTarget && isJumping) {
                ctx.fillStyle = '#ea580c'; // orange-600
            }
            
            ctx.fillText(i.toString(), x, baselineY + 18);
            ctx.restore();
        }
      }

      // Draw Jump History Curves
      if (history.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)'; // Purple-600 semi-transparent for fun trail
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]);

        for (let i = 0; i < history.length - 1; i++) {
            const startX = PADDING_X + history[i] * pixelsPerUnit;
            const endX = PADDING_X + history[i+1] * pixelsPerUnit;
            const dist = endX - startX;
            const arcHeight = Math.min(250, dist * 0.8);
            const midX = (startX + endX) / 2;
            const controlY = baselineY - (arcHeight * 2); // Quadratic control point needs to be 2x height

            ctx.moveTo(startX, baselineY);
            ctx.quadraticCurveTo(midX, controlY, endX, baselineY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw History Breadcrumbs (Dots)
      history.forEach((pos, idx) => {
        // Don't draw dot under frog if current pos
        if (pos === currentPosition && !isJumping) return;
        
        const x = PADDING_X + pos * pixelsPerUnit;
        ctx.beginPath();
        ctx.arc(x, baselineY, 7, 0, Math.PI * 2);
        // Rainbow dots for history!
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Frog (Custom Dark Green Character)
      drawFrog(ctx, frogX, frogY);
    };

    const drawFrog = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save();
        
        // Shadow
        ctx.beginPath();
        ctx.ellipse(x, y + FROG_SIZE/1.5, FROG_SIZE/2, FROG_SIZE/6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(x, y, FROG_SIZE / 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#166534'; // Dark Green (green-800)
        ctx.fill();
        ctx.strokeStyle = '#14532d'; // Darker border
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes (Whites)
        const eyeOffsetX = FROG_SIZE / 2.5;
        const eyeOffsetY = FROG_SIZE / 2.5;
        const eyeSize = FROG_SIZE / 3;
        
        ctx.beginPath();
        ctx.arc(x - eyeOffsetX, y - eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX, y - eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // Pupils
        const pupilSize = eyeSize / 2;
        ctx.beginPath();
        ctx.arc(x - eyeOffsetX, y - eyeOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX, y - eyeOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(x, y + 5, FROG_SIZE / 2.5, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Cheeks
        ctx.beginPath();
        ctx.arc(x - FROG_SIZE/2, y + 5, 4, 0, Math.PI * 2);
        ctx.arc(x + FROG_SIZE/2, y + 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 150, 150, 0.6)';
        ctx.fill();

        ctx.restore();
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [currentSkip, currentPosition, jumpCount, isJumping, history, maxNumber, pixelsPerUnit, canvasWidth]);


  // --- PARTICLE EFFECT UPDATE ---
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
        setParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // gravity
            life: p.life - 0.02
        })).filter(p => p.life > 0));
    }, 16);
    return () => clearInterval(interval);
  }, [particles]);

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col font-sans text-slate-800">
      
      {/* Background World */}
      <BackgroundScenery />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-start">
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-8 py-3 rounded-r-full rounded-tl-full shadow-lg transform -skew-x-6 border-b-4 border-indigo-700">
                    <h1 className="text-3xl font-extrabold skew-x-6 tracking-wide drop-shadow-md">Skip Jump Adventure!</h1>
                </div>
                <p className="mt-2 text-purple-700 font-black ml-2 bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm">Master multiplication and patterns!</p>
            </div>
            
            <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md text-blue-700 px-5 py-2 rounded-xl border-2 border-blue-200 shadow-sm flex items-center gap-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-blue-500">Current Skip:</span>
                    <span className="text-3xl font-black text-blue-600">{currentSkip}</span>
            </div>
            </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 pb-8 flex flex-col gap-6">
            
            {/* Controls & Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Keypad */}
                <div className="lg:col-span-5 bg-white/90 backdrop-blur-lg rounded-3xl p-6 border-2 border-white/50 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-300 rounded-bl-full opacity-20 -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="font-bold text-slate-700 text-lg">Pick a Number!</h3>
                        <form onSubmit={handleCustomSubmit} className="flex gap-2">
                            <input 
                                type="number" 
                                className="w-20 px-3 py-1 rounded-lg border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-bold text-slate-700 bg-white"
                                placeholder="#"
                                min="1"
                                max="260"
                                value={customSkip}
                                onChange={(e) => setCustomSkip(e.target.value)}
                            />
                            <button type="submit" className="bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-600 transition border-b-2 border-purple-700">
                                GO
                            </button>
                        </form>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 relative z-10">
                        {SKIP_VALUES.map((val, idx) => (
                            <button
                                key={val}
                                onClick={() => handleSkipSelection(val)}
                                className={`
                                    h-10 rounded-lg font-bold text-sm transition-all transform hover:scale-110 active:scale-95 border-b-2
                                    ${currentSkip === val 
                                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300 border-purple-800 scale-105' 
                                        : getButtonColor(idx)}
                                `}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Math Visualization */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Addition Card */}
                    <div className="bg-white/90 backdrop-blur-lg rounded-3xl border-2 border-white/50 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                        <span className="text-orange-400 text-xs font-black uppercase tracking-widest mb-1">Addition</span>
                        <div className="text-3xl font-bold text-orange-600 bg-orange-50/80 px-6 py-2 rounded-xl border border-orange-100 flex items-center justify-center min-w-[200px]">
                            {jumpCount === 0 ? (
                                <span className="text-orange-400 animate-pulse text-xl">Ready to Jump!</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-orange-400">{currentPosition - currentSkip}</span>
                                    <span className="text-orange-300">+</span>
                                    <span>{currentSkip}</span>
                                    <span className="text-orange-300">=</span>
                                    <span className="text-orange-700 scale-110 transform font-black">{currentPosition}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Multiplication Card */}
                    <div className="bg-white/90 backdrop-blur-lg rounded-3xl border-2 border-white/50 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400"></div>
                        <span className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-1">Multiplication</span>
                        <div className="text-3xl font-bold text-cyan-700 bg-cyan-50/80 px-6 py-2 rounded-xl border border-cyan-100 flex items-center justify-center gap-2 min-w-[200px]">
                            <span className="text-cyan-500">{jumpCount}</span>
                            <span className="text-cyan-300">×</span>
                            <span>{currentSkip}</span>
                            <span className="text-cyan-300">=</span>
                            <span className="text-cyan-800 font-black">{currentPosition}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="relative w-full bg-white/80 backdrop-blur-md rounded-3xl border-4 border-white/40 shadow-xl overflow-hidden flex flex-col group">
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-400 uppercase tracking-wider z-10 border border-slate-200">
                    Number Line (0 - {maxNumber})
                </div>
                
                {/* Scrollable Container */}
                <div 
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto overflow-y-hidden relative no-scrollbar"
                    style={{ scrollBehavior: 'auto' }} // Handle smooth scroll in JS
                >
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={CANVAS_HEIGHT}
                        className="block cursor-grab active:cursor-grabbing"
                        style={{ minWidth: '100%' }}
                    />
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-white/50 shadow-2xl">
                <div className="flex-1 w-full">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                        <span>Progress</span>
                        <span>{jumpCount} / {MAX_JUMPS} Jumps</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden border border-slate-200">
                        <div 
                            className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 transition-all duration-500 ease-out"
                            style={{ width: `${(jumpCount / MAX_JUMPS) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={handleJump}
                        disabled={showWin || jumpCount >= MAX_JUMPS}
                        className={`
                            flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xl shadow-[0_4px_0_0] transform transition-all active:translate-y-1 active:shadow-none
                            ${showWin 
                                ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' 
                                : 'bg-green-500 hover:bg-green-400 text-white shadow-green-700 border-2 border-green-600'}
                        `}
                    >
                        {showWin ? '🎉 Completed!' : `JUMP (+${currentSkip})`}
                    </button>
                    
                    <button
                        onClick={() => resetGame()}
                        className="px-6 py-4 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-400 shadow-[0_4px_0_0] shadow-rose-700 border-2 border-rose-600 transition-all active:translate-y-1 active:shadow-none"
                    >
                        RESET
                    </button>
                </div>
            </div>

        </main>
      </div>

      {/* Floating Particles */}
      {particles.map(p => (
        <div
            key={p.id}
            className="fixed pointer-events-none text-4xl z-50 drop-shadow-lg"
            style={{
                left: p.x,
                top: p.y,
                opacity: p.life,
                transform: `scale(${p.life}) rotate(${p.life * 360}deg)`
            }}
        >
            {p.emoji}
        </div>
      ))}
      
      {/* Win Modal Overlay */}
      {showWin && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center transform scale-100 animate-in zoom-in-95 duration-300 border-8 border-yellow-300 relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-7xl animate-bounce filter drop-shadow-lg">🌟</div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2 mt-8">Awesome!</h2>
                <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
                    You counted by <strong className="text-pink-600 text-xl">{currentSkip}s</strong> all the way to <strong className="text-purple-600 text-2xl">{maxNumber}</strong>!
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => resetGame()}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-[0_4px_0_0] shadow-purple-800 active:shadow-none active:translate-y-1 border-2 border-purple-700"
                    >
                        Play Again
                    </button>
                    <button 
                        onClick={() => resetGame(currentSkip + 1)}
                        className="bg-cyan-100 text-cyan-700 px-6 py-3 rounded-xl font-bold hover:bg-cyan-200 transition border-2 border-cyan-300"
                    >
                        Try {currentSkip + 1}s
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
