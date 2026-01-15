import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export type ParticleType = "hearts" | "snow" | "stars" | "bubbles" | "confetti";
export type ParticleDirection = "down" | "up" | "left" | "right" | "random";

export interface ParticleConfig {
  type: ParticleType;
  amount: number; // 1-100 (percentage of max particles)
  speed: number; // 0.1-3.0 (multiplier)
  direction: ParticleDirection;
  colors: string[];
  size: {
    min: number;
    max: number;
  };
  opacity: {
    min: number;
    max: number;
  };
  enabled: boolean;
}

export interface ParticleBackgroundProps {
  config: ParticleConfig;
  class?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  rotation?: number;
  rotationSpeed?: number;
}

export const ParticleBackground = component$<ParticleBackgroundProps>(
  ({ config, class: className = "" }) => {
    const canvasRef = useSignal<HTMLCanvasElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => config);
      
      const canvas = canvasRef.value;
      if (!canvas || !config.enabled) return;

      let particles: Particle[] = [];
      let animationId: number;
      let lastParticleTime = 0;
      const maxParticles = Math.floor((config.amount / 100) * 150); // Max 150 particles
      const particleInterval = Math.max(50, 500 - (config.amount * 4)); // More particles = faster spawn

      const createParticle = (id: number, width: number, height: number): Particle => {
        const baseSpeedX = (Math.random() - 0.5) * config.speed;
        const baseSpeedY = Math.random() * config.speed + 0.1;
        
        let speedX = baseSpeedX;
        let speedY = baseSpeedY;
        let startX = Math.random() * width;
        let startY = -20;

        // Adjust based on direction
        switch (config.direction) {
          case "up":
            speedY = -Math.abs(baseSpeedY);
            startY = height + 20;
            break;
          case "left":
            speedX = -Math.abs(baseSpeedX) - config.speed;
            speedY = (Math.random() - 0.5) * config.speed * 0.5;
            startX = width + 20;
            startY = Math.random() * height;
            break;
          case "right":
            speedX = Math.abs(baseSpeedX) + config.speed;
            speedY = (Math.random() - 0.5) * config.speed * 0.5;
            startX = -20;
            startY = Math.random() * height;
            break;
          case "random":
            speedX = (Math.random() - 0.5) * config.speed * 2;
            speedY = (Math.random() - 0.5) * config.speed * 2;
            startX = Math.random() * width;
            startY = Math.random() * height;
            break;
          case "down":
          default:
            // Keep default values
            break;
        }

        return {
          id,
          x: startX,
          y: startY,
          size: Math.random() * (config.size.max - config.size.min) + config.size.min,
          speedX,
          speedY,
          opacity: Math.random() * (config.opacity.max - config.opacity.min) + config.opacity.min,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          rotation: config.type === "confetti" ? Math.random() * 360 : 0,
          rotationSpeed: config.type === "confetti" ? (Math.random() - 0.5) * 5 : 0,
        };
      };

      const drawParticle = (
        ctx: CanvasRenderingContext2D,
        particle: Particle,
      ) => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        
        switch (config.type) {
          case "hearts":
            drawHeart(ctx, particle.x, particle.y, particle.size);
            break;
          case "snow":
            drawSnowflake(ctx, particle.x, particle.y, particle.size);
            break;
          case "stars":
            drawStar(ctx, particle.x, particle.y, particle.size);
            break;
          case "bubbles":
            drawBubble(ctx, particle.x, particle.y, particle.size);
            break;
          case "confetti":
            drawConfetti(ctx, particle.x, particle.y, particle.size, particle.rotation || 0);
            break;
        }
        
        ctx.restore();
      };

      const drawHeart = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
      ) => {
        const scale = size / 10;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-8, 4, -8, -2, -4, -2);
        ctx.bezierCurveTo(-2, -4, 0, -2, 0, 0);
        ctx.bezierCurveTo(0, -2, 2, -4, 4, -2);
        ctx.bezierCurveTo(8, -2, 8, 4, 0, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      };

      const drawSnowflake = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
      ) => {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Add simple snowflake lines
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = size / 8;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -size / 2);
          ctx.moveTo(0, -size / 4);
          ctx.lineTo(-size / 8, -size / 3);
          ctx.moveTo(0, -size / 4);
          ctx.lineTo(size / 8, -size / 3);
        }
        ctx.stroke();

        ctx.restore();
      };

      const drawStar = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
      ) => {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            Math.cos(((18 + i * 72) / 180) * Math.PI) * size,
            -Math.sin(((18 + i * 72) / 180) * Math.PI) * size
          );
          ctx.lineTo(
            Math.cos(((54 + i * 72) / 180) * Math.PI) * (size / 2),
            -Math.sin(((54 + i * 72) / 180) * Math.PI) * (size / 2)
          );
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      };

      const drawBubble = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
      ) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Main bubble
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Bubble highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-size / 6, -size / 6, size / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      const drawConfetti = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        rotation: number,
      ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        
        ctx.fillRect(-size / 4, -size / 2, size / 2, size);
        
        ctx.restore();
      };

      const animate = (currentTime: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles = particles.filter((particle) => {
          // Update position
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          
          if (particle.rotationSpeed) {
            particle.rotation = (particle.rotation || 0) + particle.rotationSpeed;
          }

          // Fade out effect for some particle types
          if (config.type === "bubbles" || config.type === "confetti") {
            particle.opacity *= 0.999;
          } else {
            particle.opacity *= 0.9995;
          }

          // Remove particles that are off screen or too faded
          const isOffScreen = 
            particle.x < -50 || particle.x > canvas.width + 50 ||
            particle.y < -50 || particle.y > canvas.height + 50;
          
          if (isOffScreen || particle.opacity < 0.01) {
            return false;
          }

          drawParticle(ctx, particle);
          return true;
        });

        // Add new particles
        if (
          currentTime - lastParticleTime > particleInterval &&
          particles.length < maxParticles
        ) {
          particles.push(createParticle(Date.now(), canvas.width, canvas.height));
          lastParticleTime = currentTime;
        }

        animationId = requestAnimationFrame(animate);
      };

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      const handleResize = () => resizeCanvas();
      window.addEventListener("resize", handleResize);
      
      animate(performance.now());

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    });

    if (!config.enabled) {
      return null;
    }

    return (
      <canvas
        ref={canvasRef}
        class={`pointer-events-none fixed inset-0 z-0 ${className}`}
        style={{
          filter: "blur(0.5px)",
          opacity: "0.7",
        }}
      />
    );
  },
);

// Default particle configurations
export const defaultParticleConfigs: Record<ParticleType, ParticleConfig> = {
  hearts: {
    type: "hearts",
    amount: 20,
    speed: 0.8,
    direction: "down",
    colors: [
      "rgba(236, 72, 153, 1)",
      "rgba(219, 39, 119, 1)",
      "rgba(190, 24, 93, 1)",
      "rgba(147, 51, 234, 1)",
      "rgba(126, 34, 206, 1)",
      "rgba(168, 85, 247, 1)",
    ],
    size: { min: 4, max: 14 },
    opacity: { min: 0.2, max: 1.0 },
    enabled: true,
  },
  snow: {
    type: "snow",
    amount: 30,
    speed: 0.5,
    direction: "down",
    colors: [
      "rgba(255, 255, 255, 0.9)",
      "rgba(224, 242, 254, 0.8)",
      "rgba(186, 230, 253, 0.7)",
    ],
    size: { min: 2, max: 8 },
    opacity: { min: 0.3, max: 0.9 },
    enabled: true,
  },
  stars: {
    type: "stars",
    amount: 15,
    speed: 0.3,
    direction: "random",
    colors: [
      "rgba(250, 204, 21, 1)",
      "rgba(251, 191, 36, 1)",
      "rgba(245, 158, 11, 1)",
      "rgba(255, 255, 255, 0.9)",
    ],
    size: { min: 3, max: 8 },
    opacity: { min: 0.4, max: 1.0 },
    enabled: true,
  },
  bubbles: {
    type: "bubbles",
    amount: 25,
    speed: 0.6,
    direction: "up",
    colors: [
      "rgba(59, 130, 246, 0.6)",
      "rgba(16, 185, 129, 0.6)",
      "rgba(139, 92, 246, 0.6)",
      "rgba(236, 72, 153, 0.6)",
    ],
    size: { min: 5, max: 20 },
    opacity: { min: 0.2, max: 0.7 },
    enabled: true,
  },
  confetti: {
    type: "confetti",
    amount: 40,
    speed: 1.2,
    direction: "down",
    colors: [
      "rgba(239, 68, 68, 1)",
      "rgba(245, 158, 11, 1)",
      "rgba(34, 197, 94, 1)",
      "rgba(59, 130, 246, 1)",
      "rgba(147, 51, 234, 1)",
      "rgba(236, 72, 153, 1)",
    ],
    size: { min: 3, max: 8 },
    opacity: { min: 0.6, max: 1.0 },
    enabled: true,
  },
};
