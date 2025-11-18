import { useEffect, useRef, useState } from 'react';

interface TrueFocusProps {
  sentence: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

export default function TrueFocus({
  sentence,
  manualMode = false,
  blurAmount = 5,
  borderColor = "blue",
  animationDuration = 2,
  pauseBetweenAnimations = 1,
}: TrueFocusProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (manualMode) return;

    const words = sentence.split(' ');
    let index = 0;
    let timeoutId: NodeJS.Timeout;

    const animate = () => {
      setIsAnimating(true);
      setCurrentIndex(index);

      timeoutId = setTimeout(() => {
        setIsAnimating(false);
        index = (index + 1) % words.length;

        setTimeout(() => {
          animate();
        }, pauseBetweenAnimations * 1000);
      }, animationDuration * 1000);
    };

    animate();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [sentence, manualMode, animationDuration, pauseBetweenAnimations]);

  const words = sentence.split(' ');

  const getBorderColorClass = () => {
    switch (borderColor) {
      case 'red':
        return 'border-red-500';
      case 'blue':
        return 'border-blue-500';
      case 'green':
        return 'border-green-500';
      case 'purple':
        return 'border-purple-500';
      default:
        return 'border-blue-500';
    }
  };

  return (
    <div ref={containerRef} className="inline-flex flex-wrap items-center gap-2 justify-center text-white">
      {words.map((word, index) => {
        const isFocused = index === currentIndex && !manualMode;
        return (
          <span
            key={index}
            className={`relative inline-block transition-all duration-500 text-white ${
              isFocused
                ? `border-b-2 ${getBorderColorClass()} pb-1`
                : ''
            }`}
            style={{
              filter: isFocused ? 'none' : `blur(${blurAmount}px)`,
              opacity: isFocused ? 1 : 0.6,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
