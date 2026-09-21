import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// =========================================================================
// 1. INTERACTIVE PARTICLE NETWORK CANVAS (REPULSE FORCE FIELD)
// =========================================================================
export function InteractiveParticleNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000, radius: 140 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 16000), 85);
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
      size: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        baseX: x,
        baseY: y,
        size: Math.random() * 2 + 1.2,
      });
    }

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles with repulse force
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        // Mouse repulse force
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const directionX = forceDirectionX * force * 7;
          const directionY = forceDirectionY * force * 7;
          p.x -= directionX;
          p.y -= directionY;
        } else {
          // Slowly return and wander
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx = -p.vx;
          if (p.y < 0 || p.y > height) p.vy = -p.vy;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(245, 158, 11, 0.9)";
        ctx.fill();

        // Connect lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]!;
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 110) * 0.28;
            ctx.strokeStyle = `rgba(216, 178, 130, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-65"
    />
  );
}

// =========================================================================
// 2. RGB SPLIT GLITCH HOVER
// =========================================================================
export function RgbGlitchWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isGlitching, setIsGlitching] = useState(false);

  return (
    <div
      onMouseEnter={() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 240);
      }}
      className={`relative inline-block ${className}`}
    >
      {/* Base element */}
      <div className="relative z-10">{children}</div>

      {/* Red & Blue split channel ghost layers */}
      {isGlitching && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-70 mix-blend-screen select-none"
            style={{
              transform: "translate(-3px, 1px)",
              filter: "drop-shadow(0 0 4px #ff0055)",
            }}
          >
            {children}
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-70 mix-blend-screen select-none"
            style={{
              transform: "translate(3px, -1px)",
              filter: "drop-shadow(0 0 4px #00ffff)",
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// =========================================================================
// 3. TERMINAL TYPEWRITER & DECRYPTING TEXT
// =========================================================================
const CIPHER_CHARS = "!@#$%^&*()_+~`|}{[]:;?><,./-=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function DecryptingText({
  text,
  speed = 30,
  delay = 100,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let iteration = 0;
    let interval: NodeJS.Timeout;

    const timer = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((letter, index) => {
              if (index < iteration) {
                return letter;
              }
              if (letter === " ") return " ";
              return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          setIsCompleted(true);
          clearInterval(interval);
        }

        iteration += 1 / 2;
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <span className={`font-mono inline-flex items-center ${className}`}>
      <span>{displayText || text.replace(/./g, "•")}</span>
      <span className="inline-block ml-1 animate-pulse text-amber-400 font-black">█</span>
    </span>
  );
}

// =========================================================================
// 4. CARD SPOTLIGHT V2 (REVEALS CIRCUIT BOARD PATTERN UNDER MOUSE)
// =========================================================================
export function CircuitSpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setPos((p) => ({ ...p, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[#070A12] p-6 shadow-xl ${className}`}
    >
      {/* Hidden Circuit Board Etched SVG Pattern Layer */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.opacity * 0.45,
          maskImage: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, black 30%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, black 30%, transparent 80%)`,
        }}
      >
        <svg className="h-full w-full stroke-amber-400/80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="cyberCircuitGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M10 10h40v40H10z" strokeWidth="0.75" strokeDasharray="3 3" />
            <path d="M30 10v15l10 10v15M10 30h15l10 10h15" strokeWidth="1" />
            <circle cx="30" cy="25" r="2.5" fill="#F59E0B" />
            <circle cx="25" cy="30" r="2.5" fill="#F59E0B" />
            <circle cx="50" cy="50" r="3" fill="#D97706" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#cyberCircuitGrid)" />
        </svg>
      </div>

      {/* Gold Halo Spotlight Follower */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(245,158,11,0.18), transparent 75%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
