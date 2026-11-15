import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';

export const TUNN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Ultra-thin GPU-accelerated scroll reading progress bar */
export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-coffee origin-left z-[60] pointer-events-none"
    />
  );
};

/** Tactile floating Back-to-Top button appearing after scrolling past Hero */
export const BackToTopButton: React.FC = () => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setVisible(latest > 520);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.9 }}
          transition={{ duration: 0.25, ease: TUNN_EASE }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Cuộn lên đầu trang"
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-coffee text-ivory-light border border-coffee-beige/40 shadow-editorial-lg flex items-center justify-center hover:bg-coffee-dark transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
