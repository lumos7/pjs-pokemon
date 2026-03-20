'use client'

interface SurpriseButtonProps {
  onSurprise: () => void
  disabled?: boolean
}

export function SurpriseButton({ onSurprise, disabled }: SurpriseButtonProps) {
  return (
    <button
      onClick={onSurprise}
      disabled={disabled}
      className="w-full sm:w-auto bg-gradient-to-r from-[#CC0000] to-[#FFCB05] text-white font-bold text-xl rounded-full px-8 py-4 min-h-[56px] shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Surprise Me! ✨
    </button>
  )
}
