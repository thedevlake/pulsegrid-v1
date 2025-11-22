import { FC, useState, useEffect, CSSProperties } from 'react';

interface FuzzyTextProps {
  children: string;
  baseIntensity?: number;
  hoverIntensity?: number;
  enableHover?: boolean;
  className?: string;
}

interface CustomCSSProperties extends CSSProperties {
  '--blur-intensity': string;
  '--text-shadow': string;
}

const FuzzyText: FC<FuzzyTextProps> = ({
  children,
  baseIntensity = 0.2,
  hoverIntensity = 0.5,
  enableHover = true,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [time, setTime] = useState(0);
  const characters = children.split('').map((char, index) => ({
    char: char === ' ' ? '\u00A0' : char,
    id: index
  }));
  
  const currentIntensity = enableHover && isHovered ? hoverIntensity : baseIntensity;
  
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTime(elapsed);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const generateTextShadow = (intensity: number) => {
    const shadows: string[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * intensity;
      const y = Math.sin(angle) * intensity;
      shadows.push(`${x}px ${y}px 0 currentColor`);
    }
    return shadows.join(', ');
  };

  const inlineStyles: CustomCSSProperties = {
    '--blur-intensity': `${currentIntensity * 0.5}px`,
    '--text-shadow': generateTextShadow(currentIntensity)
  };

  const baseClasses = 'inline-block transition-all duration-300';
  const combinedClasses = `${baseClasses} ${className}`;

  const hasGradient = className.includes('bg-gradient') && className.includes('bg-clip-text');
  
  return (
    <span
      style={{
        ...inlineStyles,
        ...(hasGradient ? {
          background: 'linear-gradient(to right, rgb(96, 165, 250), rgb(129, 140, 248), rgb(59, 130, 246))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : {}),
      }}
      className={combinedClasses}
      onMouseEnter={() => enableHover && setIsHovered(true)}
      onMouseLeave={() => enableHover && setIsHovered(false)}
    >
      {characters.map(({ char, id }) => {
        // Use a seeded random for consistent but varying positions
        const seed = (id * 137.508) % 1;
        const offsetX = Math.sin(seed * Math.PI * 2 + time) * currentIntensity;
        const offsetY = Math.cos(seed * Math.PI * 2 + time * 1.3) * currentIntensity;
        
        // Calculate gradient color based on character position
        const totalChars = characters.length;
        const position = id / Math.max(totalChars - 1, 1);
        let gradientColor = '';
        if (hasGradient) {
          if (position < 0.5) {
            // Blue to Indigo (first half)
            const t = position * 2;
            const r = Math.round(96 + (129 - 96) * t);
            const g = Math.round(165 + (140 - 165) * t);
            const b = Math.round(250 + (248 - 250) * t);
            gradientColor = `rgb(${r}, ${g}, ${b})`;
          } else {
            // Indigo to Blue (second half)
            const t = (position - 0.5) * 2;
            const r = Math.round(129 + (59 - 129) * t);
            const g = Math.round(140 + (130 - 140) * t);
            const b = Math.round(248 + (246 - 248) * t);
            gradientColor = `rgb(${r}, ${g}, ${b})`;
          }
        }
        
        return (
          <span
            key={id}
            className="inline-block"
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px)`,
              filter: `blur(${Math.max(currentIntensity * 0.15, 0.05)}px)`,
              transition: 'filter 0.3s ease, transform 0.15s ease',
              color: hasGradient ? gradientColor : undefined,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export default FuzzyText;
