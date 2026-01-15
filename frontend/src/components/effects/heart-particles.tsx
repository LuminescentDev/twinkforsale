import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

export const HeartParticles = component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  const heartColors = [
    "rgba(236, 72, 153, 1)",
    "rgba(219, 39, 119, 1)",
    "rgba(190, 24, 93, 1)",
    "rgba(147, 51, 234, 1)",
    "rgba(126, 34, 206, 1)",
    "rgba(168, 85, 247, 1)",
  ];
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    let particles: Particle[] = [];
    let animationId: number;
    let lastParticleTime = 0;
    const particleInterval = 300; // Spawn a particle every 300ms

    const createParticle = (id: number, width: number): Particle => ({
      id,
      x: Math.random() * width,
      y: -20, // start slightly above the screen
      size: Math.random() * 10 + 4, // 4-14px
      speedX: (Math.random() - 0.5) * 0.5, // gentle horizontal drift
      speedY: Math.random() * 0.8 + 0.3, // downward movement
      opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
    });

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
      // Start at the bottom point of the heart
      ctx.moveTo(0, 8);

      // Left side of heart
      ctx.bezierCurveTo(-8, 4, -8, -2, -4, -2);
      ctx.bezierCurveTo(-2, -4, 0, -2, 0, 0);

      // Right side of heart
      ctx.bezierCurveTo(0, -2, 2, -4, 4, -2);
      ctx.bezierCurveTo(8, -2, 8, 4, 0, 8);

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const animate = (currentTime: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles = particles.filter((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Slight fade out as they fall
        particle.opacity *= 0.9995;

        // Remove particles that are off screen or too faded
        if (particle.y > canvas.height + 50 || particle.opacity < 0.01) {
          return false;
        }

        // Draw heart
        ctx.fillStyle = particle.color.replace(
          /[\d.]+\)$/,
          `${particle.opacity})`,
        );
        drawHeart(ctx, particle.x, particle.y, particle.size);

        return true;
      });

      // Add new particles at consistent intervals
      if (
        currentTime - lastParticleTime > particleInterval &&
        particles.length < 100
      ) {
        particles.push(createParticle(Date.now(), canvas.width));
        lastParticleTime = currentTime;
      }

      animationId = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial setup
    resizeCanvas();

    // Add resize listener
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize); // Start animation
    animate(performance.now());

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });

  return (
    <canvas
      ref={canvasRef}
      class="pointer-events-none fixed inset-0 z-0"
      style={{
        filter: "blur(1px)",
        opacity: "0.6",
      }}
    />
  );
});
