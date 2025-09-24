// Centralized Actions Configuration
import { Target, Zap, Shield, Brain, Moon } from 'lucide-react';

export interface Action {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

export const QUICK_ACTIONS: Action[] = [
  {
    id: 'stress-relief',
    name: 'Stress Relief',
    icon: Shield,
    color: 'from-teal-500/20 to-cyan-500/20',
    description: 'Release tension and find calm'
  },
  {
    id: 'focus-boost', 
    name: 'Focus Boost',
    icon: Target,
    color: 'from-purple-500/20 to-blue-500/20',
    description: 'Sharpen concentration'
  },
  {
    id: 'energy-up',
    name: 'Energy Up', 
    icon: Zap,
    color: 'from-orange-500/20 to-amber-500/20',
    description: 'Boost motivation and energy'
  },
  {
    id: 'confidence',
    name: 'Confidence',
    icon: Brain,
    color: 'from-yellow-500/20 to-amber-500/20', 
    description: 'Build self-assurance'
  },
  {
    id: 'sleep-prep',
    name: 'Sleep Prep',
    icon: Moon,
    color: 'from-indigo-500/20 to-purple-500/20',
    description: 'Prepare for rest'
  }
];