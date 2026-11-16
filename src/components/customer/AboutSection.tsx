import React from 'react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { DEFAULT_ABOUT_CONTENT } from '../../lib/defaultData';
import type { AboutSectionContent } from '../../types/database';

export const AboutSection: React.FC = () => {
  const { getSection } = useSiteData();
  const section = getSection('about');

  if (section && !section.is_enabled) return null;

  const content: AboutSectionContent = {
    ...DEFAULT_ABOUT_CONTENT,
    ...(section?.content || {}),
    pillars: Array.isArray(section?.content?.pillars)
      ? section.content.pillars
      : DEFAULT_ABOUT_CONTENT.pillars,
  };

  return (
    <section
      id="about"
      className="py-20 sm:py-28 lg:py-32 bg-ivory-light border-b border-coffee-beige/60 dark:border-b-0 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-3">
              {content.eyebrow || 'NGHỆ THUẬT THƯỞNG THỨC'}
            </p>
            <h2 className="font-serif text-[clamp(2rem,3.6vw,3.1rem)] font-normal text-coffee-dark leading-[1.15]">
              {content.headline}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <p className="text-base text-coffee-dark/90 leading-relaxed font-medium">
              {content.lead_paragraph}
            </p>
          </motion.div>
        </div>

        {/* Asymmetric Editorial Story Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Visual Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 relative"
          >
            <div className="group aspect-[16/11] overflow-hidden rounded-brand border border-coffee-beige bg-ivory shadow-editorial">
              <motion.img
                initial={{ scale: 1.06 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                src={content.main_image_url}
                alt={section?.title || 'TUNN Coffee House Story'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>

            {content.secondary_image_url && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="hidden sm:block w-48 aspect-square rounded-brand overflow-hidden border-4 border-ivory-light shadow-editorial-lg -mt-20 ml-auto mr-6 relative z-10 bg-ivory"
              >
                <img
                  src={content.secondary_image_url}
                  alt="Crafted Atmosphere"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Right Narrative Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-6 space-y-6"
          >
            <p className="text-sm sm:text-base text-coffee-muted leading-relaxed whitespace-pre-line">
              {content.story_body}
            </p>

            {content.quote && (
              <blockquote className="pl-5 border-l-2 border-coffee py-1 font-serif italic text-xl sm:text-2xl text-coffee-dark leading-snug">
                {content.quote}
              </blockquote>
            )}
          </motion.div>
        </div>

        {/* 3 Architectural Pillars */}
        {content.pillars && content.pillars.length > 0 && (
          <div className="mt-20 pt-14 border-t border-coffee-beige dark:border-t-0 grid grid-cols-1 md:grid-cols-3 gap-10">
            {content.pillars.map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group p-6 -m-2 rounded-brand border border-transparent hover:border-coffee-beige/80 hover:bg-ivory/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-3xl text-coffee/60 group-hover:text-coffee transition-colors">
                    {pillar.number || `0${index + 1}`}
                  </span>
                  <span className="h-px flex-1 bg-coffee-beige/60 group-hover:bg-coffee/50 transition-colors" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-coffee-dark mt-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-coffee-muted mt-2.5 leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
