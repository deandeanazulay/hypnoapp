import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../lib/stripe';
import { useGameState } from './GameStateManager';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUserState } = useGameState();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsProcessing(false);
      return;
    }

    // Update user state to reflect premium access
    const updateSubscriptionStatus = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check subscription status
        const status = await paymentService.getSubscriptionStatus();
        updateUserState({ 
          subscriptionStatus: status,
          plan: status === 'active' ? 'pro_monthly' : 'free'
        });
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Error updating subscription status:', err);
        setIsProcessing(false);
      }
    };

    updateSubscriptionStatus();
  }, [sessionId, updateUserState]);

  const handleContinue = () => {
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">❌</span>
              </div>
              <h1 className="text-white text-2xl font-bold mb-4">Payment Error</h1>
              <p className="text-white/70 mb-8">{error}</p>
              <button
                onClick={handleContinue}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
              >
                Return to App
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-teal-950/30 to-cyan-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-teal-500/30 shadow-2xl shadow-teal-500/20">
            <div className="text-center">
              {/* Success Icon */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-400/50">
                  <CheckCircle size={40} className="text-black" />
                </div>
                <div className="absolute inset-0 rounded-full bg-teal-400/30 blur-xl animate-pulse" />
              </div>

              {/* Title */}
              <div className="mb-6">
                <h1 className="text-white text-3xl font-bold mb-2 flex items-center justify-center space-x-2">
                  <Crown size={28} className="text-teal-400" />
                  <span>Welcome to Premium!</span>
                  <Sparkles size={28} className="text-cyan-400" />
                </h1>
                <p className="text-teal-400 font-semibold text-lg">
                  Your Mystic Subscription is now active
                </p>
              </div>

              {/* Processing State */}
              {isProcessing ? (
                <div className="mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-4 h-4 border-2 border-teal-400/20 border-t-teal-400 rounded-full animate-spin" />
                    <span className="text-white/80">Setting up your premium access...</span>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <p className="text-white/80 mb-6">
                    Your payment was successful! You now have access to all premium features including unlimited sessions, all 15 archetypal guides, and advanced orb experiences.
                  </p>
                  
                  {/* Premium Features List */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-3 flex items-center justify-center space-x-2">
                      <Sparkles size={16} className="text-teal-400" />
                      <span>Now Unlocked</span>
                    </h3>
                    <div className="space-y-2 text-sm text-white/80">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>Unlimited daily sessions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>All 15 archetypal guides</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>Advanced orb visualizations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>Custom protocol builder</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        <span>Premium AI voices</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={isProcessing}
                className="w-full px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-all duration-200 shadow-2xl shadow-teal-400/30 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isProcessing ? 'Setting up...' : 'Begin Your Premium Journey'}</span>
                {!isProcessing && <ArrowRight size={20} />}
              </button>

              {/* Footer */}
              <p className="text-white/50 text-sm mt-6">
                Thank you for supporting consciousness technology ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}