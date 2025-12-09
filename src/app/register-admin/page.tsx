"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Building2,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function RegisterAdminPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerMutation = useMutation(api.auth.register);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });

  const validatePassword = (password: string) =>
    password.length < 8 ? "Password must be at least 8 characters" : "";

  const handlePasswordChange = (value: string) => {
    setForm({ ...form, password: value });
    setErrors({ ...errors, password: validatePassword(value) });
  };

  const handleConfirmPasswordChange = (value: string) => {
    setForm({ ...form, confirmPassword: value });
    setErrors({
      ...errors,
      confirmPassword: value !== form.password ? "Passwords do not match" : "",
    });
  };

  const handleRegister = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const passwordError = validatePassword(form.password);
    const confirmError =
      form.password !== form.confirmPassword ? "Passwords do not match" : "";

    if (passwordError || confirmError) {
      setErrors({ password: passwordError, confirmPassword: confirmError });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerMutation({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: "admin",
      });

      login(result);
      toast.success("Admin account created successfully!");
      router.push("/admin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-indigo-500 via-purple-500 to-blue-600 dark:from-black dark:via-neutral-900 dark:to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="shadow-2xl backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/50 dark:border-white/5 rounded-2xl">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center mb-4"
              >
                <Building2 className="h-14 w-14 text-white drop-shadow-lg" />
              </motion.div>
              <CardTitle className="text-4xl font-bold tracking-tight text-white drop-shadow">
                Create Admin Account
              </CardTitle>
              <CardDescription className="text-white/80 font-medium">
                Register a new administrator for Profile Hub
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label
                      htmlFor="firstName"
                      className="text-white font-medium"
                    >
                      First Name
                    </Label>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label
                      htmlFor="lastName"
                      className="text-white font-medium"
                    >
                      Last Name
                    </Label>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Admin"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email
                  </Label>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password
                  </Label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    className="pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                    value={form.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="text-xs text-rose-400 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2 relative">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-white font-medium"
                  >
                    Confirm Password
                  </Label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-400 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    className="w-full bg-white text-indigo-600 font-bold hover:bg-white/80 transition-all"
                    disabled={
                      isSubmitting ||
                      !!errors.password ||
                      !!errors.confirmPassword
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Register
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <p className="text-xs text-white/80 text-center mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="underline font-medium"
                >
                  Login here
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
