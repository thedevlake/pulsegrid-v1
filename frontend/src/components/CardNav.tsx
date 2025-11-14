import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  buttonLabel = 'Get Started',
  onButtonClick
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const location = useLocation();

  // Close menu when route changes and reset state
  useEffect(() => {
    const navEl = navRef.current;
    
    // Always reset states when route changes
    setIsHamburgerOpen(false);
    setIsExpanded(false);
    
    if (navEl) {
      // Reset GSAP properties immediately to closed state
      gsap.set(navEl, { height: 60, overflow: 'hidden' });
      gsap.set(cardsRef.current, { y: 50, opacity: 0 });
      
      // Kill existing timeline
      const tl = tlRef.current;
      if (tl) {
        tl.kill();
      }
      
      // Create fresh timeline in closed state
      const newTl = createTimeline();
      if (newTl) {
        tlRef.current = newTl;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    // Reset states when component mounts or items change
    setIsHamburgerOpen(false);
    setIsExpanded(false);
    
    // Reset GSAP properties
    if (navRef.current) {
      gsap.set(navRef.current, { height: 60, overflow: 'hidden' });
      gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    }
    
    // Kill existing timeline
    if (tlRef.current) {
      tlRef.current.kill();
    }
    
    // Create new timeline
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) {
      // If timeline doesn't exist, create it
      const newTl = createTimeline();
      if (newTl) {
        tlRef.current = newTl;
        if (!isExpanded) {
          setIsHamburgerOpen(true);
          setIsExpanded(true);
          newTl.play(0);
        }
      }
      return;
    }
    
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => {
        setIsExpanded(false);
      });
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const handleLinkClick = () => {
    if (isExpanded) {
      const tl = tlRef.current;
      if (tl) {
        setIsHamburgerOpen(false);
        tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
        tl.reverse();
      }
    }
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[1.2em] md:top-[2em] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''} block h-[60px] p-0 rounded-2xl shadow-2xl relative overflow-hidden will-change-[height] transition-all duration-300`}
        style={{ 
          background: baseColor || 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(28px) saturate(200%) brightness(1.2)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%) brightness(1.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `
            0 12px 40px 0 rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset,
            0 4px 12px rgba(0, 0, 0, 0.3) inset
          `,
        }}
      >
        <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
              } group-hover:opacity-75`}
            />
            <div
              className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
                isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
              } group-hover:opacity-75`}
            />
          </div>

          <Link 
            to="/dashboard" 
            className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none"
            onClick={handleLinkClick}
          >
            <img src={logo} alt={logoAlt} className="logo h-[28px]" />
          </Link>

          {onButtonClick && (
            <button
              type="button"
              onClick={onButtonClick}
              className="card-nav-cta-button hidden md:inline-flex border-0 rounded-[calc(0.75rem-0.2rem)] px-4 items-center h-full font-medium cursor-pointer transition-colors duration-300"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              {buttonLabel}
            </button>
          )}
        </div>

        <div
          className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          } md:flex-row md:items-end md:gap-[12px]`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card select-none relative flex flex-col gap-2 p-[12px_16px] rounded-xl min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl group overflow-hidden"
              ref={setCardRef(idx)}
              style={{ 
                background: item.bgColor,
                color: item.textColor,
                backdropFilter: 'blur(24px) saturate(200%) brightness(1.2)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 32px 0 rgba(0, 0, 0, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                  0 2px 8px rgba(0, 0, 0, 0.2) inset
                `,
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }}
              />
              <div className="nav-card-label font-semibold tracking-[-0.5px] text-[18px] md:text-[22px] relative z-10 drop-shadow-lg">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[4px] relative z-10">
                {item.links?.map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    to={lnk.href}
                    onClick={handleLinkClick}
                    className="nav-card-link group/link inline-flex items-center gap-[8px] no-underline cursor-pointer transition-all duration-300 hover:opacity-100 hover:translate-x-1 text-[15px] md:text-[16px] font-semibold hover:drop-shadow-lg"
                    aria-label={lnk.ariaLabel}
                    style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
                  >
                    <ArrowUpRight className="nav-card-link-icon shrink-0 w-4 h-4 transition-all duration-300 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 group-hover/link:scale-110" aria-hidden="true" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
