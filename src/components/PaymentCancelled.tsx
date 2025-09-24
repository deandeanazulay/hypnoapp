import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../lib/stripe';
import { useAppStore } from '../store';

export default function PaymentCancelled() {
  const navigate = useNavigate();
  const { showToast } = useAppStore();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      const { url } = await paymentService.createCheckoutSession('mystic-subscription');
      window.location.href = url;
    } catch (error: any) {
      console.error('Retry payment error:', error);
      showToast({
        type: 'error',
        message: error.message || 'Failed to start checkout. Please try again.',
        duration: 5000
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReturn = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-500/10 to-slate-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-white/5 to-gray-500/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="text-center">
              {/* Cancelled Icon */}
              <div className="w-16 h-16 rounded-full bg-gray-500/20 border border-gray-500/30 flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-gray-400" />
              </div>

              {/* Title */}
              <h1 className="text-white text-2xl font-bold mb-4">
                Payment Cancelled
              </h1>

              {/* Message */}
              <p className="text-white/70 mb-8">
                No worries! Your payment was cancelled and no charges were made. You can try again anytime or continue with the free plan.
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Try Again</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReturn}
                  className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Continue with Free Plan</span>
                </button>
              </div>

              {/* Free Plan Features */}
              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-2">Free Plan Includes:</h3>
                <div className="space-y-1 text-sm text-white/70">
                  <div>• 1 session per day</div>
                  <div>• 5 archetypal guides</div>
                  <div>• Basic orb visualizations</div>
                  <div>• Progress tracking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}