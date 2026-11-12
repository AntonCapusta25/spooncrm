import confetti from 'canvas-confetti';

export const fireCelebration = () => {
  const duration = 2500;
  const animationEnd = Date.now() + duration;

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 45 * (timeLeft / duration);

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2,
      },
      colors: ['#FF5A1F', '#FF8A50', '#22C55E', '#3B82F6', '#EAB308'],
      zIndex: 99999,
    });
  }, 220);
};

export const fireQuickConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF5A1F', '#22C55E', '#3B82F6', '#EAB308'],
    zIndex: 99999,
  });
};

