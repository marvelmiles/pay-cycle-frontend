import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { authService } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";
import { Button, Input } from "../../components/ui";

// ==================== LOGIN ====================
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    try {
      const res = await authService.login(data);
      const { user, business, accessToken, refreshToken } = res.data.data;
      setAuth({ user, business, accessToken, refreshToken });
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">PayCycle</span>
        </div>
        <div>
          <blockquote className="text-5xl font-medium text-white">
            Payment Checkout for Nigerian Businesses
          </blockquote>

          <div className="mt-8 flex gap-8">
            {[
              ["1k+", "Transactions"],
              ["₦2M+", "Processed"],
              ["99.9%", "Uptime"],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-blue-400">{val}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          © 2025 PayCycle. Built for Nigeria.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">PayCycle</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              leftElement={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
