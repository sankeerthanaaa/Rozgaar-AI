import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      loginWithToken(token)
        .then(() => {
          toast.success("Welcome back with Google!", { position: "top-center" });
          navigate("/dashboard", { replace: true });
        })
        .catch((err) => {
          console.error("Auth hydration error:", err);
          toast.error("Failed to authenticate user profile.", { position: "top-center" });
          navigate("/login", { replace: true });
        });
    } else {
      toast.error("Authentication failed. No token provided.", { position: "top-center" });
      navigate("/login", { replace: true });
    }
  }, [navigate, loginWithToken]);

  return (
    <div style={{
      minHeight: "calc(100vh - var(--navbar-height))",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-8)",
      background: "linear-gradient(135deg, rgba(244,243,255,0.4) 0%, rgba(255,255,255,1) 100%)",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
        borderRadius: "var(--radius-lg)",
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--color-border-surface)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
        maxWidth: 320,
        width: "100%",
        textAlign: "center"
      }}>
        {/* Loading Spinner */}
        <div style={{
          width: 48,
          height: 48,
          border: "4px solid var(--color-primary-subtle)",
          borderTop: "4px solid var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: "var(--weight-bold)",
          color: "var(--color-text-primary)",
          margin: 0
        }}>
          Securing session
        </h3>
        
        <p style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-secondary)",
          margin: 0
        }}>
          Logging you in, please wait...
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthSuccess;
