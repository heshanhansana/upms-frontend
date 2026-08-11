import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ChevronDown, ArrowRight, User } from "lucide-react";
import usjLogo from "../../usj-logo.png";
import { BackButton } from "./ui/BackButton";

const FACULTIES = [
  {
    value: "FACULTY_OF_TECHNOLOGY",
    label: "Faculty of Technology",
    departments: [
      "Department of Information Communication Technology",
      "Department of Engineering Technology",
      "Department of Biosystem Technology",
      "Department of Science for Technology",
    ],
  },
  {
    value: "FACULTY_OF_MANAGEMENT_STUDIES_AND_COMMERCE",
    label: "Faculty of Management Studies and Commerce",
    departments: [],
  },
  {
    value: "FACULTY_OF_APPLIED_SCIENCES",
    label: "Faculty of Applied Sciences",
    departments: [
      "Department of Computer Science",
      "Department of Mathematics",
      "Department of Physics",
    ],
  },
  {
    value: "FACULTY_OF_MEDICAL_SCIENCES",
    label: "Faculty of Medical Sciences",
    departments: [],
  },
  {
    value: "FACULTY_OF_ENGINEERING",
    label: "Faculty of Engineering",
    departments: [],
  },
  {
    value: "FACULTY_OF_ALLIED_HEALTH_SCIENCES",
    label: "Faculty of Allied Health Sciences",
    departments: [],
  },
  {
    value: "FACULTY_OF_DENTAL_SCIENCES",
    label: "Faculty of Dental Sciences",
    departments: [],
  },
  {
    value: "FACULTY_OF_URBAN_AQUATIC_AND_BIORESOURCES",
    label: "Faculty of Urban Aquatic and Bioresources",
    departments: [],
  },
  {
    value: "FACULTY_OF_COMPUTING",
    label: "Faculty of Computing",
    departments: [],
  },
  {
    value: "FACULTY_OF_HUMANITIES_AND_SOCIAL_SCIENCES",
    label: "Faculty of Humanities and Social Sciences",
    departments: [],
  },
];

const ROLES = [
  //{ value: "ADMIN", label: "System Administrator" },
  { value: "HOD", label: "Head of Department" },
  { value: "BURSAR", label: "Bursar" },
  { value: "FACULTY_BURSAR", label: "Faculty Bursar" },
  { value: "FACULTY_DEAN", label: "Faculty Dean" },
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "SUPPLIER_DIVISION_CLERK", label: "Supplier Division Clerk" },
  { value: "TEC_MEMBER", label: "TEC Member" },
  { value: "TENDER_BOARD_MEMBER", label: "Tender Board Member" },
  { value: "STORE_KEEPER", label: "Storekeeper" },
  { value: "BIDDER", label: "Supplier / Bidder" },
  { value: "FINANCE_DIVISION", label: "Finance Division" },
];

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (payload: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    faculty: string;
    department: string;
  }) => Promise<void>;
  onGoLogin: () => void;
}

export function RegisterScreen({ onBack, onRegister, onGoLogin }: RegisterScreenProps) {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    faculty: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitError, setSubmitError] = useState("");

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const nextValue = e.target.value;
      setForm((p) => {
        const nextState = { ...p, [field]: nextValue };
        if (field === "role") {
          nextState.faculty = "";
          nextState.department = "";
        }
        return nextState;
      });
      setErrors((p) => ({ ...p, [field]: undefined }));
    };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "At least 8 characters";
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = "Must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(form.password)) {
      errs.password = "Must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(form.password)) {
      errs.password = "Must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]]/.test(form.password)) {
      errs.password = "Must contain at least one special character";
    }
    if (!form.role) errs.role = "Please select your role";
    if (form.role === "HOD") {
      if (!form.faculty) errs.faculty = "Please select your faculty";
      if (!form.department) errs.department = "Please select your department";
    }
    if (form.role === "FACULTY_BURSAR" || form.role === "FACULTY_DEAN") {
      if (!form.faculty) errs.faculty = "Please select your faculty";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    setSubmitError("");
    try {
      await onRegister(form);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit registration");
    } finally {
      setIsLoading(false);
    }
  };
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return 1;
    if (score === 2) return 2;
    if (score === 3) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="relative min-h-screen w-full flex p-4 sm:p-6 bg-gradient-to-b from-stone-50 to-stone-100 font-sans">
      {/* Top accent */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Left testimonial / branding card */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="hidden lg:flex flex-col w-[420px] shrink-0 rounded-3xl overflow-hidden relative bg-gradient-to-b from-maroon to-maroon-dark border border-maroon-dark text-white"
      >
        {/* Back button */}
        <BackButton onClick={onBack} className="absolute top-6 left-6 z-10" />

        {/* Request Access content */}
        <div className="flex-1 flex flex-col justify-center px-10 pt-20 pb-8">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 bg-gold/20 border border-gold/30">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-gold text-[0.72rem] font-semibold tracking-wider uppercase">
                REQUEST ACCESS
              </span>
            </div>
            <h2 className="text-white text-[1.55rem] font-bold tracking-tight leading-tight">
              Register your details<br />to request access.
            </h2>
            <p className="mt-3 text-white/70 text-sm leading-relaxed">
              Your application will be reviewed by the system administrator.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col">
            {[
              { num: "01", label: "Fill in your details" },
              { num: "02", label: "Submit registration" },
              { num: "03", label: "Await admin approval" },
              { num: "04", label: "Access granted via email" },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex items-start gap-4">
                {/* Step indicator column */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[0.72rem] tracking-wider ${
                      i === 0
                        ? "bg-gradient-to-br from-gold to-gold-dark text-maroon font-bold"
                        : "bg-white/10 border border-white/10 text-white/50"
                    }`}
                  >
                    {step.num}
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={`w-px flex-1 my-1 min-h-[28px] ${
                        i === 0
                          ? "bg-gradient-to-b from-gold-dark to-white/10"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
                {/* Label */}
                <div className="pt-1.5 pb-6">
                  <span
                    className={`text-[0.9rem] leading-normal ${
                      i === 0 ? "text-white font-bold" : "text-white/60 font-medium"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-between py-8 px-4 sm:px-12 relative">
        {/* Mobile back */}
        <BackButton onClick={onBack} className="lg:hidden self-start mb-6" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[400px] flex-1 flex flex-col justify-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-white border border-stone-200 shadow-md p-1.5">
              <img
                src={usjLogo}
                alt="USJ Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-center text-maroon text-[1.7rem] font-bold tracking-tight">
            Create an Account
          </h1>
          <p className="text-center mt-1.5 mb-6 text-stone-500 text-[0.88rem]">
            Sign up to get started
          </p>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Kasun"
                  className={`w-full px-3 py-2.5 rounded-lg outline-none border text-maroon text-sm ${
                    errors.firstName ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-red-500 text-[0.72rem]">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Perera"
                  className={`w-full px-3 py-2.5 rounded-lg outline-none border text-maroon text-sm ${
                    errors.lastName ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-red-500 text-[0.72rem]">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username field */}
            <div>
              <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                Username
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  value={form.username}
                  onChange={set("username")}
                  placeholder="Choose a username"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg outline-none border text-maroon text-sm ${
                    errors.username ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-red-500 text-[0.72rem]">
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="name@sjp.ac.lk"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg outline-none border text-maroon text-sm ${
                    errors.email ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-red-500 text-[0.72rem]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                Password
              </label>

              {/* Password input */}
              <div className="relative">
                <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg outline-none border text-maroon text-sm ${
                        errors.password
                            ? "border-red-500 focus:border-red-500 bg-white"
                            : "border-stone-200 focus:border-gold bg-white"
                    }`}
                />

                {/* Show / Hide Password */}
                <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Error */}
              {errors.password && (
                  <p className="mt-1 text-red-500 text-[0.72rem]">
                    {errors.password}
                  </p>
              )}

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                  <div className="mt-2">

                    {/* Strength Bars */}
                    <div className="flex gap-1.5">
                      {(() => {
                        const requirements = [
                          form.password.length >= 8,
                          /[A-Z]/.test(form.password),
                          /[a-z]/.test(form.password),
                          /[0-9]/.test(form.password),
                          /[^A-Za-z0-9]/.test(form.password),
                        ];

                        const strength = requirements.filter(Boolean).length;

                        return [1, 2, 3, 4, 5].map((i) => {
                          let barColor = "bg-stone-200";

                          if (strength >= i) {
                            if (strength <= 2) {
                              barColor = "bg-red-500";
                            } else if (strength <= 4) {
                              barColor = "bg-orange-400";
                            } else {
                              barColor = "bg-emerald-500";
                            }
                          }

                          return (
                              <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${barColor}`}
                              />
                          );
                        });
                      })()}
                    </div>

                    {/* Password Strength Message */}
                    {(() => {
                      const missingRequirements: string[] = [];

                      // Minimum 8 characters
                      if (form.password.length < 8) {
                        const remaining = 8 - form.password.length;

                        if (form.password.length === 0) {
                          missingRequirements.push("8 characters");
                        } else {
                          missingRequirements.push(
                              `${remaining} more character${remaining > 1 ? "s" : ""}`
                          );
                        }
                      }

                      // Uppercase
                      if (!/[A-Z]/.test(form.password)) {
                        missingRequirements.push("an uppercase letter");
                      }

                      // Lowercase
                      if (!/[a-z]/.test(form.password)) {
                        missingRequirements.push("a lowercase letter");
                      }

                      // Number
                      if (!/[0-9]/.test(form.password)) {
                        missingRequirements.push("a number");
                      }

                      // Special character
                      if (!/[^A-Za-z0-9]/.test(form.password)) {
                        missingRequirements.push("a special character");
                      }
                        // All requirements satisfied (removed)
                        if (missingRequirements.length === 0) {
                            return (
                                <p className="mt-1.5 text-emerald-600 text-[0.72rem]">
                                </p>
                            );
                        }


                      // Create dynamic message
                      let message = "Add ";

                      if (missingRequirements.length === 1) {
                        message += missingRequirements[0];
                      } else if (missingRequirements.length === 2) {
                        message += `${missingRequirements[0]} and ${missingRequirements[1]}`;
                      } else {
                        message +=
                            missingRequirements.slice(0, -1).join(", ") +
                            ", and " +
                            missingRequirements[missingRequirements.length - 1];
                      }

                      return (
                          <p className="mt-1.5 flex items-center gap-1.5 text-red-500 text-[0.72rem] leading-tight">
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 rounded-full bg-red-500 text-white text-[9px] font-bold">
        !
      </span>

                            <span>{message}.</span>
                          </p>
                      );
                    })()}
                  </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                Applied Role
              </label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={set("role")}
                  className={`w-full px-3 py-2.5 rounded-lg outline-none border text-sm appearance-none cursor-pointer ${
                    errors.role ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                  } ${form.role ? "text-maroon" : "text-stone-400"}`}
                >
                  <option value="" disabled>
                    Select your role…
                  </option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400"
                />
              </div>
              {errors.role && (
                <p className="mt-1 text-red-500 text-[0.72rem]">
                  {errors.role}
                </p>
              )}
            </div>

            {(form.role === "HOD" || form.role === "FACULTY_BURSAR" || form.role === "FACULTY_DEAN") && (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                    {form.role === "HOD" ? "Faculty" : "Faculty"}
                  </label>
                  <div className="relative">
                    <select
                      value={form.faculty}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, faculty: e.target.value, department: "" }));
                        setErrors((p) => ({ ...p, faculty: undefined, department: undefined }));
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg outline-none border text-sm appearance-none cursor-pointer ${
                        errors.faculty ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                      } ${form.faculty ? "text-maroon" : "text-stone-400"}`}
                    >
                      <option value="" disabled>
                        Select your faculty…
                      </option>
                      {FACULTIES.map((faculty) => (
                        <option key={faculty.value} value={faculty.value}>
                          {faculty.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400"
                    />
                  </div>
                  {errors.faculty && (
                    <p className="mt-1 text-red-500 text-[0.72rem]">
                      {errors.faculty}
                    </p>
                  )}
                </div>

                {form.role === "HOD" && (
                  <div>
                    <label className="block mb-1 text-maroon text-[0.78rem] font-semibold">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        value={form.department}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, department: e.target.value }));
                          setErrors((p) => ({ ...p, department: undefined }));
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg outline-none border text-sm appearance-none cursor-pointer ${
                          errors.department ? "border-red-500 focus:border-red-500 bg-white" : "border-stone-200 focus:border-gold bg-white"
                        } ${form.department ? "text-maroon" : "text-stone-400"}`}
                      >
                        <option value="" disabled>
                          Select your department…
                        </option>
                        {FACULTIES.find((faculty) => faculty.value === form.faculty)?.departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        )) ?? []}
                      </select>
                      <ChevronDown
                        size={15}
                        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400"
                      />
                    </div>
                    {errors.department && (
                      <p className="mt-1 text-red-500 text-[0.72rem]">
                        {errors.department}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 mt-1 transition-all bg-gradient-to-br from-maroon to-maroon-dark text-white font-bold text-[0.92rem] hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? "Submitting…" : (
                <>
                  Submit Your Request 
                  <ArrowRight size={15} strokeWidth={2.4} />
                </>
              )}
            </button>
            {submitError && (
              <p className="text-red-500 text-xs text-center">{submitError}</p>
            )}
          </form>

          <p className="text-center mt-5 text-stone-500 text-sm">
            Already have an account?{" "}
            <button
              onClick={onGoLogin}
              className="text-maroon font-semibold hover:text-maroon-light transition-colors"
            >
              Sign in
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <div className="flex items-center gap-6 mt-6 text-stone-400 text-[0.78rem]">
          <button className="hover:text-stone-700 transition-colors">Privacy</button>
          <button className="hover:text-stone-700 transition-colors">Terms</button>
          <button className="hover:text-stone-700 transition-colors">Cookies</button>
        </div>
      </div>
    </div>
  );
}
