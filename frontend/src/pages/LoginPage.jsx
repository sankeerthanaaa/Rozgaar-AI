import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { parseError } from "../utils/parseError";
import toast from "react-hot-toast";
import { useState } from "react";

const schema = yup.object({
  email:    yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Min 6 characters").required("Password is required"),
});

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  async function onSubmit(data) {
    try {
      await login(data);
      toast.success("Welcome back!", { position: "top-center" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(parseError(err), { position: "top-center" });
    }
  }

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--navbar-height))", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-8)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", marginBottom: "var(--space-2)" }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
          Log in to your ResumeAI account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
              Email
            </label>
            <input className="input" type="email" placeholder="you@email.com" {...register("email")} />
            {errors.email && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>{errors.email.message}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                style={{ width: "100%", paddingRight: "2.75rem", boxSizing: "border-box" }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: "100%", marginTop: "var(--space-2)" }}
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBlock: "var(--space-2)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-3)",
              cursor: "pointer",
              background: "white",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-primary)",
              padding: "var(--space-3)",
              fontWeight: "var(--weight-medium)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: "var(--weight-medium)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}