import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { ChevronDown } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";

gsap.registerPlugin(ScrollTrigger);

interface AnimationOrderItem {
  segment: HTMLElement;
  originalIndex: number;
}

const HomeHeroLandingScrollAnimation: React.FC = () => {
  const animatedIconsRef = useRef<HTMLDivElement | null>(null);
  const heroHeaderRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const iconElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const textSegmentsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const placeholdersRef = useRef<(HTMLDivElement | null)[]>([]);
  const duplicateIconsRef = useRef<HTMLElement[] | null>(null);
  const textAnimationOrderRef = useRef<AnimationOrderItem[]>([]);
  const scrollPromptRef = useRef<HTMLDivElement | null>(null);
  const keepScrollingPromptRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredKeepScrollingRef = useRef(false);
  const keepScrollingTimeoutRef = useRef<number | null>(null);

  // 5 Relevant Candidate Evaluation Images
  const serviceImages: string[] = [
    "/images/ai-candidate-selection.png",
    "/images/digital-profile-evaluation.png",
    "/images/technical-interview-analysis.jpg",
    "/images/multi-agent-debate.jpg",
    "/images/hiring-handshake.png",
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const textSegments = textSegmentsRef.current;
    const animationOrder: AnimationOrderItem[] = [];

    textSegments.forEach((segment, index) => {
      if (segment) animationOrder.push({ segment, originalIndex: index });
    });

    for (let i = animationOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [animationOrder[i], animationOrder[j]] = [animationOrder[j], animationOrder[i]];
    }

    textAnimationOrderRef.current = animationOrder;

    const isMobile = window.innerWidth < 1000;
    const headerIconSize = isMobile ? 35 : 60;
    const currentIconSize = iconElementsRef.current[0]?.getBoundingClientRect().width || 1;
    const exactScale = headerIconSize / currentIconSize;

    ScrollTrigger.create({
      trigger: heroSectionRef.current,
      start: "top top",
      end: `+=${window.innerHeight * 8}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        // Hide floating "Scroll to start" text immediately after user begins scrolling
        if (scrollPromptRef.current) {
          if (progress > 0.02) {
            gsap.to(scrollPromptRef.current, {
              opacity: 0,
              y: 15,
              duration: 0.2,
              pointerEvents: "none",
              overwrite: "auto",
            });
          } else {
            gsap.to(scrollPromptRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.2,
              pointerEvents: "auto",
              overwrite: "auto",
            });
          }
        }

        // Show floating "Keep scrolling" prompt when all text comes up, then auto-delete after 1.3s
        if (progress >= 0.90) {
          if (!hasTriggeredKeepScrollingRef.current) {
            hasTriggeredKeepScrollingRef.current = true;
            if (keepScrollingPromptRef.current) {
              gsap.to(keepScrollingPromptRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                overwrite: "auto",
              });

              if (keepScrollingTimeoutRef.current) {
                clearTimeout(keepScrollingTimeoutRef.current);
              }

              keepScrollingTimeoutRef.current = window.setTimeout(() => {
                if (keepScrollingPromptRef.current) {
                  gsap.to(keepScrollingPromptRef.current, {
                    opacity: 0,
                    y: 10,
                    duration: 0.4,
                    overwrite: "auto",
                  });
                }
              }, 1300);
            }
          }
        } else if (progress < 0.78) {
          hasTriggeredKeepScrollingRef.current = false;
          if (keepScrollingTimeoutRef.current) {
            clearTimeout(keepScrollingTimeoutRef.current);
            keepScrollingTimeoutRef.current = null;
          }
          if (keepScrollingPromptRef.current) {
            gsap.set(keepScrollingPromptRef.current, { opacity: 0, y: 0 });
          }
        }

        textSegments.forEach((segment) => {
          if (segment) gsap.set(segment, { opacity: 0 });
        });

        if (progress < 0.3) {
          const moveProgress = progress / 0.3;
          const containerMoveY = -window.innerHeight * 0.3 * moveProgress;

          if (progress < 0.15) {
            const headerProgress = progress / 0.15;
            gsap.set(heroHeaderRef.current, {
              transform: `translateY(${-50 * headerProgress}px)`,
              opacity: 1 - headerProgress,
            });
          } else {
            gsap.set(heroHeaderRef.current, { transform: "translateY(-50px)", opacity: 0 });
          }

          if (duplicateIconsRef.current) {
            duplicateIconsRef.current.forEach((d) => d.parentNode?.removeChild(d));
            duplicateIconsRef.current = null;
          }

          gsap.set(animatedIconsRef.current, { x: 0, y: containerMoveY, scale: 1, opacity: 1 });

          iconElementsRef.current.forEach((icon, index) => {
            if (icon) {
              const staggerDelay = index * 0.1;
              const iconProgress = gsap.utils.mapRange(staggerDelay, staggerDelay + 0.5, 0, 1, moveProgress);
              const clamped = Math.max(0, Math.min(1, iconProgress));
              gsap.set(icon, { x: 0, y: -containerMoveY * (1 - clamped) });
            }
          });
        } else if (progress < 0.6) {
          const scaleProgress = (progress - 0.3) / 0.3;

          gsap.set(heroHeaderRef.current, { transform: "translateY(-50px)", opacity: 0 });
          if (heroSectionRef.current) heroSectionRef.current.style.backgroundColor = "#fafafa";

          if (duplicateIconsRef.current) {
            duplicateIconsRef.current.forEach((d) => d.parentNode?.removeChild(d));
            duplicateIconsRef.current = null;
          }

          const containerRect = animatedIconsRef.current!.getBoundingClientRect();
          const deltaX = (window.innerWidth / 2 - (containerRect.left + containerRect.width / 2)) * scaleProgress;
          const deltaY = (window.innerHeight / 2 - (containerRect.top + containerRect.height / 2)) * scaleProgress;

          gsap.set(animatedIconsRef.current, {
            x: deltaX,
            y: -window.innerHeight * 0.3 + deltaY,
            scale: 1 + (exactScale - 1) * scaleProgress,
            opacity: 1,
          });

          iconElementsRef.current.forEach((icon) => {
            if (icon) gsap.set(icon, { x: 0, y: 0 });
          });
        } else if (progress < 0.75) {
          const moveProgress = (progress - 0.6) / 0.15;

          gsap.set(heroHeaderRef.current, { transform: "translateY(-50px)", opacity: 0 });
          if (heroSectionRef.current) heroSectionRef.current.style.backgroundColor = "#ffffff";

          const containerRect = animatedIconsRef.current!.getBoundingClientRect();
          const deltaX = window.innerWidth / 2 - (containerRect.left + containerRect.width / 2);
          const deltaY = window.innerHeight / 2 - (containerRect.top + containerRect.height / 2);

          gsap.set(animatedIconsRef.current, {
            x: deltaX,
            y: -window.innerHeight * 0.3 + deltaY,
            scale: exactScale,
            opacity: 0,
          });

          iconElementsRef.current.forEach((icon) => {
            if (icon) gsap.set(icon, { x: 0, y: 0 });
          });

          if (!duplicateIconsRef.current) {
            duplicateIconsRef.current = [];
            iconElementsRef.current.forEach((icon) => {
              if (icon) {
                const duplicate = icon.cloneNode(true) as HTMLElement;
                duplicate.className = "duplicate-icon";
                Object.assign(duplicate.style, {
                  position: "absolute",
                  width: headerIconSize + "px",
                  height: headerIconSize + "px",
                  zIndex: "50",
                  borderRadius: "8px",
                  overflow: "hidden",
                });
                document.body.appendChild(duplicate);
                duplicateIconsRef.current!.push(duplicate);
              }
            });
          }

          duplicateIconsRef.current?.forEach((duplicate, index) => {
            if (index < placeholdersRef.current.length && iconElementsRef.current[index] && placeholdersRef.current[index]) {
              const iconRect = iconElementsRef.current[index]!.getBoundingClientRect();
              const startPageX = iconRect.left + iconRect.width / 2 + window.pageXOffset;
              const startPageY = iconRect.top + iconRect.height / 2 + window.pageYOffset;

              const targetRect = placeholdersRef.current[index]!.getBoundingClientRect();
              const targetPageX = targetRect.left + targetRect.width / 2 + window.pageXOffset;
              const targetPageY = targetRect.top + targetRect.height / 2 + window.pageYOffset;

              const moveX = targetPageX - startPageX;
              const moveY = targetPageY - startPageY;

              let currentX = 0;
              let currentY = moveProgress < 0.5 ? moveY * (moveProgress / 0.5) : moveY;
              if (moveProgress >= 0.5) currentX = moveX * ((moveProgress - 0.5) / 0.5);

              duplicate.style.left = startPageX + currentX - headerIconSize / 2 + "px";
              duplicate.style.top = startPageY + currentY - headerIconSize / 2 + "px";
              duplicate.style.opacity = "1";
              duplicate.style.display = "flex";
            }
          });
        } else {
          gsap.set(heroHeaderRef.current, { transform: "translateY(-100px)", opacity: 0 });
          if (heroSectionRef.current) heroSectionRef.current.style.backgroundColor = "#ffffff";
          gsap.set(animatedIconsRef.current, { opacity: 0 });

          duplicateIconsRef.current?.forEach((duplicate, index) => {
            if (index < placeholdersRef.current.length && placeholdersRef.current[index]) {
              const targetRect = placeholdersRef.current[index]!.getBoundingClientRect();
              const targetPageX = targetRect.left + targetRect.width / 2 + window.pageXOffset;
              const targetPageY = targetRect.top + targetRect.height / 2 + window.pageYOffset;
              duplicate.style.left = targetPageX - headerIconSize / 2 + "px";
              duplicate.style.top = targetPageY - headerIconSize / 2 + "px";
              duplicate.style.opacity = "1";
              duplicate.style.display = "flex";
            }
          });

          textAnimationOrderRef.current.forEach((item, randomIndex) => {
            const segStart = 0.75 + randomIndex * 0.03;
            const segProgress = gsap.utils.mapRange(segStart, segStart + 0.015, 0, 1, progress);
            gsap.set(item.segment, { opacity: Math.max(0, Math.min(1, segProgress)) });
          });
        }
      },
    });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      duplicateIconsRef.current?.forEach((d) => d.parentNode?.removeChild(d));
      if (keepScrollingTimeoutRef.current) {
        clearTimeout(keepScrollingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=Inter:wght@400;500;600&display=swap');
        .premium-font { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.03em; }
        .readable-font { font-family: 'Inter', sans-serif; letter-spacing: -0.01em; }
        .hero-title { font-weight: 700; letter-spacing: -0.06em; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.05)); }
        .orange-filter { filter: invert(41%) sepia(82%) saturate(2258%) hue-rotate(359deg) brightness(96%) contrast(92%); }
        .hero-bg-swiper { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }
        .hero-bg-swiper .swiper-wrapper, .hero-bg-swiper .swiper-slide { width: 100% !important; height: 100% !important; }
        .hero-bg-swiper .swiper-slide { opacity: 0 !important; transition: opacity 1.2s ease !important; }
        .hero-bg-swiper .swiper-slide-active { opacity: 1 !important; }
      `}</style>

      <section
        ref={heroSectionRef}
        className="hero premium-font relative w-screen h-screen px-4 md:px-6 flex flex-col items-center justify-center bg-white text-[#141414] overflow-hidden"
      >
        <div
          ref={heroHeaderRef}
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{ zIndex: 0 }}
        >
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 3200, disableOnInteraction: false }}
            loop
            speed={1200}
            className="hero-bg-swiper"
          >
            {serviceImages.map((src, i) => (
              <SwiperSlide key={i} style={{ position: "relative", overflow: "hidden" }}>
                <img
                  src={src}
                  alt={`Hero Slide ${i + 1}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0.85) 100%)",
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Floating "Scroll to start" Prompt — Fades away immediately when user scrolls */}
        <div
          ref={scrollPromptRef}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 transition-all duration-300 select-none pointer-events-none"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white shadow-2xl text-xs font-semibold uppercase tracking-wider">
            <span>Scroll to start</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-white/80" />
          </div>
        </div>

        {/* Floating "Keep scrolling" Prompt — Appears when all text finishes revealing, then deletes after 1.3s */}
        <div
          ref={keepScrollingPromptRef}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 opacity-0 pointer-events-none select-none transition-all"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white shadow-2xl text-xs font-semibold uppercase tracking-wider">
            <span>Keep scrolling</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-white/80" />
          </div>
        </div>

        <div
          ref={animatedIconsRef}
          className="animated-icons fixed bottom-10 left-1/2 -translate-x-1/2 md:left-37 md:translate-x-0 flex items-center gap-1 w-[90%] md:w-[80%] will-change-transform z-2"
        >
          {serviceImages.map((src, index) => (
            <div
              key={index}
              ref={(el) => {
                iconElementsRef.current[index] = el;
              }}
              className="animated-icon flex-1 aspect-square will-change-transform rounded-sm overflow-hidden bg-gray-100"
            >
              <img src={src} alt={`Service Icon ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <h1 className="animated-text relative z-10 max-w-[90vw] md:max-w-[85vw] text-center text-[#141414] text-[clamp(1.4rem,5vw,4.5rem)] font-medium leading-[1.3] md:leading-[1.2]">
          <span
            ref={(el) => {
              textSegmentsRef.current[0] = el;
            }}
            className="text-segment opacity-0"
          >
            Four specialized AI agents analyze,
          </span>
          <div
            ref={(el) => {
              placeholdersRef.current[0] = el;
            }}
            className="placeholder-icon mx-1 md:-mt-1.5 w-8 h-8 md:w-16 md:h-16 inline-block align-middle will-change-transform invisible"
          />

          <span
            ref={(el) => {
              textSegmentsRef.current[1] = el;
            }}
            className="text-segment opacity-0"
          >
            cross-examine, and debate
          </span>
          <div
            ref={(el) => {
              placeholdersRef.current[1] = el;
            }}
            className="placeholder-icon mx-1 md:-mt-1.5 w-8 h-8 md:w-16 md:h-16 inline-block align-middle will-change-transform invisible"
          />

          <span
            ref={(el) => {
              textSegmentsRef.current[2] = el;
            }}
            className="text-segment opacity-0"
          >
            candidate transcripts.
          </span>
          <div
            ref={(el) => {
              placeholdersRef.current[2] = el;
            }}
            className="placeholder-icon mx-1 md:-mt-1.5 w-8 h-8 md:w-16 md:h-16 inline-block align-middle will-change-transform invisible"
          />

          <span
            ref={(el) => {
              textSegmentsRef.current[3] = el;
            }}
            className="text-segment opacity-0"
          >
            Get instant, evidence-backed
          </span>
          <div
            ref={(el) => {
              placeholdersRef.current[3] = el;
            }}
            className="placeholder-icon mx-1 md:-mt-1.5 w-8 h-8 md:w-16 md:h-16 inline-block align-middle will-change-transform invisible"
          />

          <span
            ref={(el) => {
              textSegmentsRef.current[4] = el;
            }}
            className="text-segment opacity-0"
          >
            hiring decisions
            <div
              ref={(el) => {
                placeholdersRef.current[4] = el;
              }}
              className="placeholder-icon mx-1 md:-mt-1.5 w-8 h-8 md:w-16 md:h-16 inline-block align-middle will-change-transform invisible"
            />
            without the guesswork.
          </span>
        </h1>
      </section>
    </div>
  );
};

export default HomeHeroLandingScrollAnimation;
