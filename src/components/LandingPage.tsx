import React, { useState, useEffect } from 'react';
import { Play, Star, Zap, Shield, Crown, ChevronRight, Check, Users, Award, TrendingUp, Sparkles, Eye, Heart, Brain, Menu, X } from 'lucide-react';
import WebGLOrb from './WebGLOrb';
import { paymentService, STRIPE_PRODUCTS } from '../lib/stripe';
import { useAppStore } from '../store';

interface LandingPageProps {
  onEnterApp: () => void;
  onShowAuth: () => void;
}

export default function LandingPage({ onEnterApp, onShowAuth }: LandingPageProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { showToast } = useAppStore();

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = async () => {
    try {
      setIsProcessingPayment(true);
      const { url } = await paymentService.createCheckoutSession('mystic-subscription');
      window.location.href = url;
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.message === 'User not authenticated') {
        onShowAuth();
        showToast({
          type: 'info',
          message: 'Please sign in to upgrade to premium',
          duration: 4000
        });
      } else {
        showToast({
          type: 'error',
          message: error.message || 'Failed to start checkout. Please try again.',
          duration: 5000
        });
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const features = [
    {
      icon: <Brain size={24} className="text-teal-400" />,
      title: "15 Archetypal Guides",
      description: "Channel different aspects of your psyche - from the protective Guardian to the transcendent Mystic",
      gradient: "from-teal-500/20 to-cyan-500/20"
    },
    {
      icon: <Eye size={24} className="text-purple-400" />,
      title: "Hypnotic Orb Technology", 
      description: "Advanced WebGL visualizations create deep trance states through sacred geometry and light patterns",
      gradient: "from-purple-500/20 to-indigo-500/20"
    },
    {
      icon: <Zap size={24} className="text-yellow-400" />,
      title: "AI-Powered Sessions",
      description: "Personalized hypnosis journeys that adapt to your progress, goals, and archetypal preferences",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <Heart size={24} className="text-rose-400" />,
      title: "Transformation Tracking",
      description: "Gamified progress system with levels, streaks, and insights into your consciousness evolution",
      gradient: "from-rose-500/20 to-pink-500/20"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Entrepreneur",
      text: "Libero helped me break through anxiety patterns that therapy couldn't touch. The Rebel archetype sessions gave me my confidence back.",
      rating: 5
    },
    {
      name: "Marcus L.",
      role: "Software Engineer", 
      text: "I've tried every meditation app. Nothing compares to Libero's depth. The orb visualizations actually put me in trance states.",
      rating: 5
    },
    {
      name: "Dr. Jennifer K.",
      role: "Clinical Psychologist",
      text: "As a professional, I'm impressed by Libero's sophisticated approach to archetypal psychology and hypnosis.",
      rating: 5
    },
    {
      name: "Alex R.",
      role: "Creative Director",
      text: "The Mystic sessions unlocked creativity I didn't know I had. This isn't just an app - it's consciousness technology.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Explorer",
      price: "Free",
      description: "Begin your transformation journey",
      features: [
        "1 session per day",
        "5 archetypal guides",
        "Basic orb visualizations",
        "Progress tracking"
      ],
      cta: "Start Free",
      popular: false,
      action: onEnterApp
    },
    {
      name: "Mystic",
      price: "$27",
      period: "/month",
      description: "Unlock your full potential",
      features: [
        "Unlimited sessions",
        "All 15 archetypal guides",
        "Advanced orb experiences",
        "Custom protocol builder",
        "Premium AI voices",
        "Deep analytics"
      ],
      cta: isProcessingPayment ? "Processing..." : "Upgrade Now",
      popular: true,
      action: handleUpgrade,
      disabled: isProcessingPayment
    },
    {
      name: "Visionary", 
      price: "$199",
      period: "/year",
      description: "Master consciousness transformation",
      features: [
        "Everything in Mystic",
        "Priority support",
        "Beta features access",
        "Monthly group sessions",
        "Personal transformation coach"
      ],
      cta: "Coming Soon",
      popular: false,
      action: () => {},
      comingSoon: true
    }
  ];

  const stats = [
    { number: "50K+", label: "Transformations" },
    { number: "4.9★", label: "App Store Rating" },
    { number: "89%", label: "Report Breakthroughs" },
    { number: "15", label: "Archetypal Guides" }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden overflow-y-auto" style={{ height: '100vh', overflowY: 'scroll' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-purple-400 flex items-center justify-center">
                <Sparkles size={20} className="text-black" />
              </div>
              <span className="text-2xl font-light bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Libero
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors">Reviews</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={onEnterApp}
                className="px-6 py-2 text-white hover:text-teal-400 transition-colors font-medium"
              >
                Try Free
              </button>
              <button
                onClick={onShowAuth}
                className="px-6 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-teal-400 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-white/80 hover:text-white transition-colors py-2">Features</a>
              <a href="#testimonials" className="block text-white/80 hover:text-white transition-colors py-2">Reviews</a>
              <a href="#pricing" className="block text-white/80 hover:text-white transition-colors py-2">Pricing</a>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={onEnterApp}
                  className="w-full px-6 py-3 text-white bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors"
                >
                  Try Free
                </button>
                <button
                  onClick={onShowAuth}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen md:min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
        {/* Cosmic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/30" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Orb */}
          <div className={`mb-6 md:mb-12 transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
            <WebGLOrb
              onTap={() => {}}
              size={window.innerWidth < 768 ? 200 : 280}
            />
          </div>

          {/* Hero Text */}
          <div className={`transition-all duration-1000 delay-300 mb-6 md:mb-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-4xl md:text-7xl font-light mb-3 md:mb-6 bg-gradient-to-r from-white via-teal-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Libero
            </h1>
            <p className="text-lg md:text-2xl font-light text-white/80 mb-3 md:mb-4">
              The Hypnotist That Frees Minds
            </p>
            <p className="text-base md:text-lg text-white/60 mb-6 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              Transform limiting beliefs through archetypal hypnosis. Channel ancient wisdom. Unlock your authentic power.
            </p>
          </div>

          {/* Hero CTAs - More Prominent */}
          <div className={`flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-8 md:mb-16 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button
              onClick={onEnterApp}
              className="group px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-2xl text-black font-bold text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-2xl shadow-teal-400/25 flex items-center justify-center space-x-3"
            >
              <Play size={20} className="md:w-6 md:h-6" />
              <span>Experience Free</span>
              <ChevronRight size={20} className="md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onShowAuth}
              className="px-8 md:px-10 py-3 md:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white font-bold text-base md:text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              Unlock Everything
            </button>
          </div>

          {/* Social Proof */}
          <div className={`transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="opacity-80 hover:opacity-100 transition-opacity">
                  <div className="text-xl md:text-3xl font-bold text-teal-400 mb-1 md:mb-2">{stat.number}</div>
                  <div className="text-white/60 text-xs md:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
              Consciousness Technology
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Libero combines ancient wisdom with cutting-edge technology to create the most advanced transformation platform ever built.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 rounded-3xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105`}
              >
                <div className="w-16 h-16 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-gradient-to-br from-purple-950/20 to-teal-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-20 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Transformation Stories
          </h2>

          <div className="relative h-64 overflow-hidden">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ${
                  currentTestimonial === index 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-xl text-white/90 mb-6 italic leading-relaxed">
                    "{testimonial.text}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-white/60">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentTestimonial === index ? 'bg-teal-400 scale-125' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent">
              Choose Your Path
            </h2>
            <p className="text-xl text-white/70">
              Every transformation begins with a single decision. What will yours be?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-3xl backdrop-blur-sm border transition-all duration-500 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-400/30 shadow-2xl shadow-teal-400/20'
                   : plan.comingSoon
                   ? 'bg-white/5 border-white/10 opacity-60'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-6 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full text-black font-semibold text-sm flex items-center space-x-2">
                      <Crown size={16} />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-white/60">{plan.period}</span>}
                  </div>
                  <p className="text-white/70">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check size={16} className="text-teal-400 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={plan.action}
                  disabled={plan.comingSoon || plan.disabled}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black shadow-lg shadow-teal-400/25'
                     : plan.comingSoon
                     ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  } ${plan.disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <Sparkles size={64} className="text-teal-400 mx-auto mb-8 animate-pulse" />
            <h2 className="text-5xl md:text-6xl font-light mb-8 bg-gradient-to-r from-white via-teal-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Your Mind Is Waiting
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
              Break free from limiting patterns. Unlock your authentic power. <br />
              The transformation you've been seeking is one tap away.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <button
              onClick={onEnterApp}
              className="group px-12 py-6 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-2xl text-black font-bold text-xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-teal-400/30 flex items-center justify-center space-x-3"
            >
              <Play size={24} />
              <span>Begin Your Journey</span>
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-white/50 text-sm">
            Free forever • No credit card required • Transform in minutes
          </p>
        </div>
      </section>
    </div>
  );
}