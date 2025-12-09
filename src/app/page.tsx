// Fully Enhanced Login Page (Glassmorphism, Dark Mode, Vibrant Gradients, Animations, Mobile-first)
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation(api.auth.login);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") router.push("/admin");
      else router.push("/member");
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await loginMutation({
        email: loginForm.email,
        password: loginForm.password,
      });
      login(result);
      toast.success("Login successful");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-16 sm:pt-4 bg-linear-to-br from-indigo-500 via-purple-500 to-blue-600 dark:from-black dark:via-neutral-900 dark:to-black">
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
                Profile Hub
              </CardTitle>
              <CardDescription className="text-white/80 font-medium">
                Paperless management system for companies and members
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <motion.div whileFocus="focused" className="space-y-2">
                  <Label
                    htmlFor="login-email"
                    className="text-white font-medium"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </motion.div>

                <motion.div whileFocus="focused" className="space-y-2">
                  <Label
                    htmlFor="login-password"
                    className="text-white font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder-white/60"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
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
                  </div>
                </motion.div>

                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    className="w-full bg-white text-indigo-600 font-bold hover:bg-white/80 transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </motion.div>
              </form>

              <p className="text-xs text-white/80 text-center mt-4">
                Contact your administrator for login credentials
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
