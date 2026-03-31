"use client";

import { useRef } from "react";
import {
  useScroll,
  useTransform,
  motion,
  useMotionTemplate,
  MotionValue,
} from "framer-motion";

export interface ScrollRevealCardsProps {
  prizePool?: string;
  location?: string;
  teamSize?: string;
}

export function ScrollRevealCards({
  prizePool,
  location,
  teamSize,
}: ScrollRevealCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.25], [1, 0.8]);

  const titleOpacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.15, 0.25], [20, 0]);
  const gap = 0;

  const outerBorderRadiusRound = useTransform(
    scrollYProgress,
    [0, 0.25],
    [0, 24],
  );
  const innerBorderRadiusRound = 0;

  const leftRadius = useMotionTemplate`${outerBorderRadiusRound}px ${innerBorderRadiusRound}px ${innerBorderRadiusRound}px ${outerBorderRadiusRound}px`;
  const centerRadius = useMotionTemplate`${innerBorderRadiusRound}px ${innerBorderRadiusRound}px ${innerBorderRadiusRound}px ${innerBorderRadiusRound}px`;
  const rightRadius = useMotionTemplate`${innerBorderRadiusRound}px ${outerBorderRadiusRound}px ${outerBorderRadiusRound}px ${innerBorderRadiusRound}px`;

  const rotateYCommon = useTransform(scrollYProgress, [0.7, 0.9], [0, 180]);
  const rotateYLeft = rotateYCommon;
  const rotateYCenter = rotateYCommon;
  const rotateYRight = rotateYCommon;

  const rotateZLeft = useTransform(scrollYProgress, [0.7, 0.9], [0, -8]);
  const rotateZCenter = useTransform(scrollYProgress, [0.7, 0.9], [0, 0]);
  const rotateZRight = useTransform(scrollYProgress, [0.7, 0.9], [0, 8]);

  const yLeft = useTransform(scrollYProgress, [0.7, 0.9], [0, 20]);
  const yCenter = useTransform(scrollYProgress, [0.7, 0.9], [0, -10]);
  const yRight = useTransform(scrollYProgress, [0.7, 0.9], [0, 20]);

  const ASTR_IMG =
    "https://res.cloudinary.com/dpod2sj9t/image/upload/v1774362735/astronaut_21_9_ibyn0c.png";

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.h2
          style={{ opacity: titleOpacity, y: titleY }}
          className="text-white text-3xl md:text-5xl font-serif mb-12 tracking-wide z-10"
        >
          What stage <span className="italic text-gray-400">is</span> your
          mission in?
        </motion.h2>

        <motion.div
          style={{ scale, gap }}
          className="flex w-full max-w-[1200px] h-[60vh] px-4 md:px-0 z-20 perspective-[1000px]"
        >
          <FlipCard
            rotateY={rotateYLeft}
            rotateZ={rotateZLeft}
            y={yLeft}
            borderRadius={leftRadius}
            bgPosition="0% 50%"
            bgImage={ASTR_IMG}
            backColor="#939393"
            textColor="#000000"
            title="Location"
            value={location || ""}
          />

          <FlipCard
            rotateY={rotateYCenter}
            rotateZ={rotateZCenter}
            y={yCenter}
            borderRadius={centerRadius}
            bgPosition="50% 50%"
            bgImage={ASTR_IMG}
            backColor="#740f0d"
            textColor="#ffffff"
            title="Prize Pool"
            value={prizePool || ""}
          />

          <FlipCard
            rotateY={rotateYRight}
            rotateZ={rotateZRight}
            y={yRight}
            borderRadius={rightRadius}
            bgPosition="100% 50%"
            bgImage={ASTR_IMG}
            backColor="#151515"
            textColor="#ffffff"
            title="Team Size"
            value={teamSize || ""}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface FlipCardProps {
  rotateY: MotionValue<number>;
  rotateZ: MotionValue<number>;
  y: MotionValue<number>;
  borderRadius: MotionValue<string>;
  bgPosition: string;
  bgImage: string;
  backColor: string;
  textColor: string;
  title: string;
  value: string;
}

function FlipCard({
  rotateY,
  rotateZ,
  y,
  borderRadius,
  bgPosition,
  bgImage,
  backColor,
  textColor,
  title,
  value,
}: FlipCardProps) {
  return (
    <motion.div
      style={{
        rotateY,
        rotate: rotateZ,
        y,
        rotateX: 0,
        transformStyle: "preserve-3d",
      }}
      className="relative flex-1 h-full cursor-pointer -mr-px last:mr-0"
    >
      <motion.div
        style={{
          borderRadius,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          transform: "translateZ(1px)",
        }}
        className="absolute inset-0 w-full h-full bg-cover bg-no-repeat z-20"
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundSize: "300% 100%",
            backgroundPosition: bgPosition,
            borderRadius: "inherit",
          }}
        />
      </motion.div>

      <motion.div
        style={{
          borderRadius: "24px",
          backgroundColor: backColor,
          color: textColor,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg) translateZ(1px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-0 w-full h-full overflow-hidden shadow-2xl flex flex-col justify-between p-10 z-10"
      >
        <div className="absolute bg-[url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774362639/nnnoise_zgex87.svg')] opacity-[1] mix-blend-overlay pointer-events-none z-0"></div>

        <div className="flex flex-col h-full relative z-10">
          <div className="mt-auto">
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] mb-3 opacity-60">
              {title}
            </h3>
            <p className="text-4xl lg:text-4xl font-semibold  tracking-tight leading-none wrap-break-word">
              {value}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
