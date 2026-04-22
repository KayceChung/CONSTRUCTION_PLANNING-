import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="rounded-full bg-slate-200 p-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 py-2 px-2 text-center text-xs font-semibold text-white flex items-center justify-center min-w-fit"
      >
        {value}%
      </motion.div>
    </div>
  )
}
