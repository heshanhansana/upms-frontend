import { motion } from "motion/react";
import usjLogo from "../../usj-logo.png";
import {
  ArrowRight,
  FileText,
  ShoppingCart,
  Package,
  PenLine,
  Check,
} from "lucide-react";
import backgroundImg from '../../imports/university-of-sjp-new-main-entrance.jpg';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function WelcomeScreen({
  onLogin,
  onSignUp,
}: WelcomeScreenProps) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(250, 250, 249, 0.96) 0%, rgba(245,245,244,0.55) 100%), url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-10 pt-7 pb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-stone-200 shadow-md p-1">
            <img
              src={usjLogo}
              alt="USJ Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <div className="text-maroon font-bold text-[0.95rem]">
              UPMS
            </div>
            <div className="text-[10px] tracking-[0.15em] uppercase text-stone-500">
              University of Sri Jayewardenepura
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs tracking-widest uppercase bg-gold/10 border border-gold/30 text-gold-dark font-medium">
          UPMS v2.0
        </div>
      </motion.header>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center"
        >
          <div className="text-xs tracking-[0.2em] uppercase mb-5 text-gold-dark font-semibold">
            Streamlined University Procurement Process
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: "easeOut",
          }}
          className="text-center text-maroon-dark text-[clamp(1.8rem,3.8vw,3.2rem)] font-bold tracking-tight leading-tight max-w-full"
        >
          <span className="block whitespace-nowrap">Procurement Management System</span>
          <span className="block text-gold-dark whitespace-nowrap">University of Sri Jayewardenepura</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-center mt-6 max-w-xl text-stone-600 text-[1.05rem] font-light leading-relaxed"
        >
          A unified digital platform for managing university
          procurement from requisition to delivery, with
          approvals across every level.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-9"
        >
        <button
          onClick={onSignUp}
          className="group relative overflow-hidden px-7 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-br from-maroon to-maroon-dark text-white font-bold text-[0.95rem] tracking-wide min-w-[170px] hover:brightness-110 active:scale-[0.98]"
        >
          Create Account
          <ArrowRight
            size={16}
            strokeWidth={2.4}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
        <button
          onClick={onLogin}
          className="px-7 py-3 rounded-lg transition-all duration-200 bg-white border border-stone-300 text-maroon font-medium text-[0.95rem] tracking-wide min-w-[170px] hover:border-maroon hover:bg-stone-50 active:scale-[0.98]"
        >
          Sign In
        </button>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="relative w-full max-w-5xl mt-16"
        >
          {/* Grid background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-70"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="welcome-grid"
                width="56"
                height="56"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 56 0 L 0 0 0 56"
                  fill="none"
                  stroke="#78716c"
                  strokeWidth="0.9"
                  strokeDasharray="3 3"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#welcome-grid)"
            />
          </svg>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 py-10 px-4 sm:px-8">
            {/* Step 1: Requisition cards stack */}
            <div className="relative flex-1 flex justify-center">
              <div className="relative w-[180px] h-[210px]">
                {[
                  {
                    label: "Stationery",
                    icon: <FileText size={14} />,
                    color: "#000000",
                    offset: 0,
                    rot: -8,
                  },
                  {
                    label: "Lab Equipment",
                    icon: <Package size={14} />,
                    color: "#10B981",
                    offset: 18,
                    rot: -2,
                  },
                  {
                    label: "IT Hardware",
                    icon: <ShoppingCart size={14} />,
                    color: "#F59E0B",
                    offset: 36,
                    rot: 6,
                  },
                ].map((c, i) => (
                  <div
                    key={c.label}
                    className="absolute bg-white rounded-xl p-3 shadow-md border border-stone-200 w-[130px] h-[175px]"
                    style={{
                      left: `${c.offset}px`,
                      top: `${i * 6}px`,
                      transform: `rotate(${c.rot}deg)`,
                      zIndex: i + 1,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-[0.7rem] font-semibold text-maroon leading-[1.15]">
                        Requisition
                        <br />
                        {c.label}
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{
                          background: `${c.color}1a`,
                          color: c.color,
                        }}
                      >
                        {c.icon}
                      </div>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      <div className="h-1.5 rounded-full bg-stone-200 w-[90%]" />
                      <div className="h-1.5 rounded-full bg-stone-200 w-[70%]" />
                      <div className="h-1.5 rounded-full bg-stone-200 w-[80%]" />
                      <div className="h-1.5 rounded-full bg-stone-200 w-[55%]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex-shrink-0 rotate-90 md:rotate-0">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white border border-stone-200 shadow-sm">
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  className="text-stone-400"
                />
              </div>
            </div>

            {/* Step 2: Approval / signature */}
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center w-[230px] h-[230px] border border-stone-200">
                <div className="relative w-full h-[110px] flex items-center justify-center">
                  <div className="absolute inset-x-4 top-4 bottom-4 rounded-md border-[1.5px] border-dashed border-gold" />
                  <svg
                    width="160"
                    height="70"
                    viewBox="0 0 160 70"
                    fill="none"
                  >
                    <path
                      d="M10 50 Q 20 20, 35 35 T 60 40 Q 75 20, 90 45 T 120 35 Q 135 20, 150 40"
                      stroke="currentColor"
                      className="text-maroon"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M40 55 L 90 55"
                      stroke="currentColor"
                      className="text-maroon"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="w-full border-t border-stone-200 mt-2 pt-3 text-center">
                  <div className="text-maroon font-semibold text-[0.85rem]">
                    Dr. R. Perera
                  </div>
                  <div className="text-gold-dark text-[0.7rem] font-medium">
                    Head of Department
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex-shrink-0 rotate-90 md:rotate-0">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-white border border-stone-200 shadow-sm">
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  className="text-stone-400"
                />
              </div>
            </div>

            {/* Step 3: Purchase Order */}
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded-xl shadow-md p-5 w-[230px] h-[230px] border border-stone-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gold/10 text-gold-dark">
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                  <PenLine
                    size={14}
                    className="text-stone-400"
                  />
                </div>
                <div className="text-stone-500 text-[0.7rem] tracking-widest uppercase">
                  PO-2026-0042
                </div>
                <div className="text-maroon text-[1.4rem] font-bold tracking-tight mt-0.5">
                  LKR 284,342
                </div>
                <div className="text-stone-500 text-[0.7rem] mt-0.5">
                  Due in 15 days
                </div>
                <div className="mt-4 space-y-2">
                  {["Vendor", "Dept", "Approver"].map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-2"
                    >
                      <div className="text-stone-400 text-[0.65rem] w-11">
                        {k}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-6 text-xs text-stone-400"
        >
          Authorized personnel only · University of Sri Jayewardenepura
        </motion.p>
      </div>

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  );
}