import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

interface PageTransitionProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'scale' | 'blur';
}

const animationVariants = {
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: 0.5, ease: 'power2.out' },
  },
  slideLeft: {
    from: { opacity: 0, x: 60 },
    to: { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
  },
  slideRight: {
    from: { opacity: 0, x: -60 },
    to: { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
  },
  slideUp: {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
  },
  slideDown: {
    from: { opacity: 0, y: -40 },
    to: { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
  },
  scale: {
    from: { opacity: 0, scale: 0.92 },
    to: { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' },
  },
  blur: {
    from: { opacity: 0, filter: 'blur(12px)' },
    to: { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' },
  },
};

export default function PageTransition({ children, animationType = 'fade' }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const variant = animationVariants[animationType];
    
    // Set initial state
    gsap.set(container, variant.from);

    // Animate in
    const tl = gsap.timeline();
    tl.to(container, variant.to);

    return () => {
      tl.kill();
    };
  }, [location.pathname, animationType]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
}

