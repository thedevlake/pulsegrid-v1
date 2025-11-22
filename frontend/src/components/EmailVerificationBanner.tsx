import { useState } from "react";
import { Mail, X, Loader2 } from "lucide-react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.email_verified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (!user?.email) return;

    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      alert("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-200 mb-1">
            Verify Your Email Address
          </h3>
          <p className="text-xs text-amber-200/80 mb-3">
            Please check your email ({user.email}) and click the verification link to activate your account.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3" />
                  Resend Email
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400/60 hover:text-amber-400 transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}



