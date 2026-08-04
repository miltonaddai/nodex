import { motion } from 'framer-motion'

export function SectionDivider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto max-w-6xl px-6 md:px-8"
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-nodex-teal/35 to-transparent" />
    </motion.div>
  )
}
