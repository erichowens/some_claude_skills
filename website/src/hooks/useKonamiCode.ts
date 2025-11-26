import { useEffect, useState } from 'react';

type EasterEgg = 'hadouken' | 'moon-tiara' | 'energize';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

export function useKonamiCode() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentEasterEgg, setCurrentEasterEgg] = useState<EasterEgg>('hadouken');
  const [triggered, setTriggered] = useState(false);

  const easterEggs: EasterEgg[] = ['hadouken', 'moon-tiara', 'energize'];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setSequence((prev) => {
        const newSequence = [...prev, event.code].slice(-10);

        // Check if the Konami code is complete
        if (newSequence.join(',') === KONAMI_CODE.join(',')) {
          setTriggered(true);

          // Cycle to next easter egg
          setCurrentEasterEgg((current) => {
            const currentIndex = easterEggs.indexOf(current);
            const nextIndex = (currentIndex + 1) % easterEggs.length;
            return easterEggs[nextIndex];
          });

          // Reset after animation
          setTimeout(() => setTriggered(false), 3000);

          return [];
        }

        return newSequence;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { triggered, easterEgg: currentEasterEgg };
}
