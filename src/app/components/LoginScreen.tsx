import { useState } from "react";
import { motion } from "motion/react";
import usjLogo from "../../usj-logo.png";
import { BackButton } from "./ui/BackButton";
import { ApiError } from "../api/client";
import { User, Lock, Eye, EyeOff, Check, Loader2, CheckCircle2 } from "lucide-react";

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onMicrosoftLogin: () => Promise<void>;
  onGoRegister: () => void;
}

export function LoginScreen({ onBack, onLogin, onMicrosoftLogin, onGoRegister }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [microsoftError, setMicrosoftError] = useState("");
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) errs.username = "Username is required";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    setMicrosoftError("");
    try {
      await onMicrosoftLogin();
    } catch (err) {
      setMicrosoftError(err instanceof Error ? err.message : "Microsoft sign-in failed.");
      setIsMicrosoftLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsLoading(true);
    setSubmitError("");
    try {
      await onLogin(username, password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSubmitError(err.message || "Username or password is incorrect.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Unable to sign in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-100 font-sans">
      {/* Back button — top left */}
      <BackButton onClick={onBack} className="absolute top-6 left-6 z-20" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] rounded-2xl p-8 bg-white border border-gray-200 shadow-md shadow-gray-200/50"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-200 shadow-md p-1.5">
            <img
              src={usjLogo}
              alt="USJ Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="mb-1.5 text-gray-900 text-[1.75rem] font-bold tracking-tight">
            Sign In
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block mb-1.5 text-gray-900 text-[0.8rem] font-medium">
              Username
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <User size={15} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: undefined })); }}
                placeholder="Enter your username"
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white border outline-none text-sm transition-all ${
                  errors.username ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-gold"
                }`}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-red-500 text-xs">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-gray-900 text-[0.8rem] font-medium">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!username) { setErrors((p) => ({ ...p, username: "Enter your username first" })); return; }
                  setForgotSent(true);
                  setTimeout(() => setForgotSent(false), 4000);
                }}
                className="text-maroon font-semibold text-[0.78rem] hover:text-maroon-light transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Lock size={15} strokeWidth={1.5} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white border outline-none text-sm transition-all ${
                  errors.password ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-gold"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={1.5} />
                ) : (
                  <Eye size={15} strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          {/* Remember for 30 days */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none text-gray-500 text-[0.82rem]">
            <button
              type="button"
              onClick={() => setRemember((p) => !p)}
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all border ${
                remember ? "bg-gradient-to-br from-maroon to-maroon-dark border-none" : "border-gray-300"
              }`}
            >
              {remember && (
                <Check size={10} strokeWidth={2.5} color="#FFFFFF" />
              )}
            </button>
            <span onClick={() => setRemember((p) => !p)}>Remember for 30 days</span>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-full transition-all duration-200 flex items-center justify-center gap-2 mt-1 text-white font-bold text-[0.95rem] tracking-wide ${
              isLoading 
                ? "bg-maroon/60 cursor-not-allowed shadow-none" 
                : "bg-gradient-to-br from-maroon to-maroon-dark hover:brightness-110 active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={17} strokeWidth={2} className="animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </button>
          {submitError && (
            <p className="text-red-500 text-xs text-center">{submitError}</p>
          )}
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-[0.75rem] tracking-widest font-semibold">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Microsoft Outlook SSO */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isMicrosoftLoading}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all bg-white border border-gray-200 text-gray-900 font-medium text-[0.88rem] hover:bg-gray-50 hover:border-gray-300"
        >
          {isMicrosoftLoading ? (
            <Loader2 size={17} strokeWidth={2} className="animate-spin" />
          ) : (
            <svg width="17" height="17" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
          )}
          {isMicrosoftLoading ? "Opening Microsoft..." : "Continue with Microsoft Outlook"}
        </button>
        {microsoftError && (
          <p className="mt-2 text-red-500 text-xs text-center">{microsoftError}</p>
        )}

        {/* Register link */}
        <p className="text-center mt-6 text-gray-500 text-[0.85rem]">
          Don't have an account?{" "}
          <button
            onClick={onGoRegister}
            className="text-maroon font-semibold hover:text-maroon-light transition-colors"
          >
            Request access
          </button>
        </p>

        {/* Forgot password toast */}
        {forgotSent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-600 text-[0.8rem]"
          >
            <CheckCircle2 size={14} strokeWidth={2} />
            <span>Password reset link sent for <strong>{username}</strong></span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
