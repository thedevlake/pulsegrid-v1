import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../lib/api";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useThemeStore } from "../store/themeStore";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${verificationToken}`);
      setStatus("success");
      setMessage(response.data.message || "Email verified successfully!");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.response?.data?.error || 
        "Failed to verify email. The token may be invalid or expired."
      );
    }
  };

  const handleResend = async () => {
    const email = prompt("Please enter your email address:");
    if (!email) return;

    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      alert("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative flex flex-col items-center justify-center transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-r from-gray-950 via-slate-900 to-zinc-950"
            : "bg-gradient-to-r from-black via-[#002147] to-zinc-950"
        }`}
        style={{ minHeight: "100vh" }}
      >
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
            {status === "loading" && (
              <div className="text-center">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Verifying your email...
                </h2>
                <p className="text-white/70">
                  Please wait while we verify your email address.
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Email Verified!
                </h2>
                <p className="text-white/70 mb-6">{message}</p>
                <p className="text-sm text-white/50">
                  Redirecting to login page...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Verification Failed
                </h2>
                <p className="text-white/70 mb-6">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}



