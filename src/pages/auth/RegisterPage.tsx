import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react";
import { authService } from "../../services/api";
import { useAuthStore } from "../../stores/auth.store";
import { Button, Input } from "../../components/ui";

// ==================== REGISTER ====================
const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name required"),
    lastName: z.string().min(2, "Last name required"),
    email: z.string().email("Invalid email"),
    businessName: z.string().min(2, "Business name required"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
  
type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    const { confirmPassword, ...payload } = data;
    try {
      const res = await authService.register(payload);
      const { user, business, accessToken, refreshToken } = res.data.data;
      setAuth({ user, business, accessToken, refreshToken });
      navigate("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PayCycle</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Start accepting payments in minutes
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Ada"
              leftElement={<User className="h-4 w-4" />}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              placeholder="Okonkwo"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            leftElement={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Business name"
            placeholder="Acme Ltd"
            leftElement={<Building2 className="h-4 w-4" />}
            error={errors.businessName?.message}
            {...register("businessName")}
          />
          <Input
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="Min 8 characters"
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
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
