import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Clock,
  Lightbulb,
} from "lucide-react";

interface Prediction {
  service_id: string;
  service_name: string;
  risk_level: string;
  confidence: number;
  predicted_issue: string;
  time_window: string;
  reason: string;
  recommended_action: string;
  predicted_at: string;
}

export default function Predictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
    // Refresh predictions every 5 minutes
    const interval = setInterval(fetchPredictions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await api.get("/predictions");
      setPredictions(response.data.predictions || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch predictions:", err);
      setError("Failed to load predictions");
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "text-red-300 bg-red-500/20 border border-red-500/30";
      case "high":
        return "text-orange-300 bg-orange-500/20 border border-orange-500/30";
      case "medium":
        return "text-amber-300 bg-amber-500/20 border border-amber-500/30";
      default:
        return "text-indigo-300 bg-indigo-500/20 border border-indigo-500/30";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-slate-300">Analyzing service patterns...</p>
      </div>
    );
  }

  return (
    <PageTransition animationType="fade">
      <div className="relative space-y-8 pb-8 min-h-screen">
        {/* Content */}
        <div className="relative z-[2]">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-semibold text-white tracking-tight">
                  AI Predictions
                </h1>
              </div>
              <p className="text-slate-300 mt-1.5 text-sm">
                AI-driven incident prediction based on historical data analysis
              </p>
            </div>
            <button
              onClick={fetchPredictions}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            ></button>
          </div>

          {error && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-xl">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-200/90">{error}</p>
                </div>
              </div>
            </div>
          )}

          {predictions.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl p-12 border border-slate-700/50 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-red-400/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-400/30">
                <Brain className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Predictions Available
              </h3>
              <p className="text-slate-300 text-sm max-w-md mx-auto">
                All services are operating normally. AI analysis indicates no
                immediate risks or anomalies detected in your infrastructure.
              </p>
              <p className="text-slate-400 text-xs mt-4">
                Predictions are generated based on historical patterns and
                trends. Check back regularly for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {predictions.map((prediction) => (
                <div
                  key={prediction.service_id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl p-8 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getRiskColor(
                          prediction.risk_level
                        )}`}
                      >
                        {getRiskIcon(prediction.risk_level)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            to={`/services/${prediction.service_id}`}
                            className="text-lg font-semibold text-white hover:text-white/80 transition-colors"
                          >
                            {prediction.service_name}
                          </Link>
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getRiskColor(
                              prediction.risk_level
                            )}`}
                          >
                            {prediction.risk_level.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {Math.round(prediction.confidence * 100)}%
                            confidence
                          </span>
                        </div>
                        <p className="text-base font-medium text-white mb-2">
                          {prediction.predicted_issue}
                        </p>
                        <p className="text-sm text-slate-300 mb-3">
                          {prediction.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-white/60 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white/60 mb-1">
                          Predicted Time Window
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {prediction.time_window}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-white/60 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-white/60 mb-1">
                          Recommended Action
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {prediction.recommended_action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
