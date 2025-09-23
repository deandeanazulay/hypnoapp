import React, { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ModalShell from '../layout/ModalShell'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const { signIn, signUp, resetPassword } = useAuth()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFormError('')
    setIsSubmitting(false)
    setResetEmailSent(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = () => {
    if (!email.trim()) {
      setFormError('Email is required')
      return false
    }
    
    if (!email.includes('@')) {
      setFormError('Please enter a valid email')
      return false
    }

    if (mode !== 'reset' && !password.trim()) {
      setFormError('Password is required')
      return false
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters')
        return false
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setFormError('')

    try {
      let result
      
      if (mode === 'signin') {
        result = await signIn(email, password)
      } else if (mode === 'signup') {
        result = await signUp(email, password)
      } else if (mode === 'reset') {
        result = await resetPassword(email)
        if (!result.error) {
          setResetEmailSent(true)
          setIsSubmitting(false)
          return
        }
      }

      if (result?.error) {
        // Provide user-friendly error messages
        const errorMessage = result.error.message
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
          if (mode === 'signin') {
            setFormError('Invalid email or password. Please check your credentials and try again.')
          } else {
            setFormError(errorMessage)
          }
        } else if (errorMessage.includes('Email not confirmed')) {
          setFormError('Please check your email and click the confirmation link before signing in.')
        } else if (errorMessage.includes('User already registered')) {
          setFormError('An account with this email already exists. Try signing in instead.')
        } else {
          setFormError(errorMessage)
        }
      } else if (mode !== 'reset') {
        handleClose()
      }
    } catch (error) {
      setFormError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back'
      case 'signup': return 'Create Your Account'
      case 'reset': return 'Reset Password'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signin': return 'Continue your transformation journey'
      case 'signup': return 'Begin your hypnotic journey with Libero'
      case 'reset': return 'We\'ll send you a reset link'
    }
  }

  if (resetEmailSent) {
    return (
      <ModalShell isOpen={isOpen} onClose={handleClose} title="Check Your Email">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
            <Mail size={24} className="text-teal-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Reset link sent!</h3>
          <p className="text-white/70 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <button
            onClick={() => {
              setMode('signin')
              setResetEmailSent(false)
            }}
            className="glass-button bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold px-6 py-3 rounded-lg hover:scale-105 transition-transform duration-200"
          >
            Back to Sign In
          </button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell 
      isOpen={isOpen} 
      onClose={handleClose}
      title={getTitle()}
      className="max-w-md"
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-white/70 text-sm">{getSubtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-white/80 text-sm mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="glass-input pl-10 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-white/80 text-sm mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                  className="glass-input pl-10 pr-10 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          {mode === 'signup' && (
            <div>
              <label className="block text-white/80 text-sm mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="glass-input pl-10 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {formError && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-sm leading-relaxed">{formError}</p>
                </div>
              </div>
              {formError.includes('Invalid email or password') && (
                <div className="mt-3 pl-8 text-xs text-red-200/90 space-y-1">
                  <p>• Double-check your email and password for typos</p>
                  <p>• If you haven't created an account yet, try signing up</p>
                  <p>• Use "Forgot your password?" if you need to reset</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full glass-button bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold py-3 rounded-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>
                  {mode === 'signin' ? 'Signing in...' : 
                   mode === 'signup' ? 'Creating account...' : 
                   'Sending email...'}
                </span>
              </div>
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 
                 mode === 'signup' ? 'Create Account' : 
                 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center space-y-2">
          {mode === 'signin' && (
            <>
              <p className="text-white/60 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
              <button
                onClick={() => setMode('reset')}
                className="text-white/60 hover:text-white/80 text-sm transition-colors block mx-auto"
              >
                Forgot your password?
              </button>
            </>
          )}

          {mode === 'signup' && (
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => setMode('signin')}
              className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  )
}