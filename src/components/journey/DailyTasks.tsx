import React from 'react';
import { Calendar, Clock, Star, Play, CheckCircle, Target, Zap, Trophy } from 'lucide-react';
import { useGameState } from '../GameStateManager';

interface DailyTask {
  id: string;
  name: string;
  description: string;
  duration: number;
  xpReward: number;
  completed: boolean;
  protocol: any;
  type: 'primary' | 'bonus';
}

interface DailyTasksProps {
  onTaskComplete: (task: DailyTask) => void;
  userLevel: number;
  userGoals: any;
}

export default function DailyTasks({ onTaskComplete, userLevel, userGoals }: DailyTasksProps) {
  const { user } = useGameState();
  
  // Get today's date for task generation
  const today = new Date().toDateString();
  const lastSessionDate = user?.last_session_date;
  const hasCompletedToday = lastSessionDate === today;

  // Generate daily tasks based on user level and goals
  const generateDailyTasks = (): DailyTask[] => {
    const baseTasks: DailyTask[] = [];

    // Primary daily task - always present
    const primaryGoal = userGoals?.mainGoal || 'stress relief';
    baseTasks.push({
      id: 'daily-primary',
      name: `Daily ${primaryGoal}`,
      description: 'Your main transformation session for today',
      duration: 15,
      xpReward: 25,
      completed: hasCompletedToday,
      type: 'primary',
      protocol: {
        id: 'daily-primary',
        name: `Daily ${primaryGoal}`,
        category: 'daily',
        goals: [primaryGoal]
      }
    });

    // Bonus tasks based on level
    if (userLevel >= 3) {
      baseTasks.push({
        id: 'breathing-bonus',
        name: 'Breathing Mastery',
        description: 'Quick 5-minute breathing session',
        duration: 5,
        xpReward: 10,
        completed: false,
        type: 'bonus',
        protocol: {
          id: 'breathing-mastery',
          name: 'Breathing Mastery',
          category: 'breathing',
          goals: ['breath control']
        }
      });
    }

    if (userLevel >= 5) {
      baseTasks.push({
        id: 'ego-exploration',
        name: 'Ego State Practice',
        description: 'Explore a different archetypal energy',
        duration: 10,
        xpReward: 15,
        completed: false,
        type: 'bonus',
        protocol: {
          id: 'ego-exploration',
          name: 'Ego State Practice',
          category: 'ego-states',
          goals: ['archetypal exploration']
        }
      });
    }

    return baseTasks;
  };

  const dailyTasks = generateDailyTasks();
  const completedTasks = dailyTasks.filter(task => task.completed).length;
  const totalXP = dailyTasks.reduce((sum, task) => sum + (task.completed ? task.xpReward : 0), 0);

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-xl flex items-center space-x-2">
          <Calendar size={20} className="text-teal-400" />
          <span>Today's Practice</span>
        </h2>
        <div className="text-white/60 text-sm">{completedTasks}/{dailyTasks.length} completed</div>
      </div>

      {/* Daily Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-sm">Daily Progress</span>
          <span className="text-orange-400 font-medium text-sm">+{totalXP} XP today</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-700"
            style={{ width: `${(completedTasks / dailyTasks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {dailyTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onTaskComplete(task)}
            disabled={task.completed}
            className={`w-full bg-gradient-to-br rounded-xl p-4 border transition-all duration-200 hover:scale-105 text-left ${
              task.completed
                ? 'from-green-500/10 to-emerald-500/10 border-green-500/30 opacity-80'
                : task.type === 'primary'
                ? 'from-teal-500/10 to-cyan-500/10 border-teal-500/30'
                : 'from-purple-500/10 to-indigo-500/10 border-purple-500/30'
            } disabled:hover:scale-100`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-500/20 border-green-500/40'
                    : task.type === 'primary'
                    ? 'bg-teal-500/20 border-teal-500/40'
                    : 'bg-purple-500/20 border-purple-500/40'
                }`}>
                  {task.completed ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : task.type === 'primary' ? (
                    <Target size={16} className="text-teal-400" />
                  ) : (
                    <Zap size={16} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-white font-medium">{task.name}</h3>
                    {task.type === 'bonus' && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full text-xs font-medium">
                        Bonus
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{task.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-white/60 mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{task.duration}m</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Star size={10} className="text-orange-400" />
                      <span>+{task.xpReward} XP</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {!task.completed && (
                <Play size={16} className="text-white/40" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Completion Bonus */}
      {completedTasks === dailyTasks.length && dailyTasks.length > 1 && (
        <div className="mt-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 animate-bounce-in">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mx-auto mb-2 animate-level-up">
              <Trophy size={20} className="text-yellow-400" />
            </div>
            <h4 className="text-white font-medium mb-1">Perfect Day Bonus!</h4>
            <p className="text-white/70 text-sm">All tasks completed • +20 bonus XP • +5 bonus tokens</p>
          </div>
        </div>
      )}

      {/* Tomorrow's Preview */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <h4 className="text-white/60 font-medium text-sm mb-2">Tomorrow's Preview</h4>
        <div className="bg-black/20 rounded-lg p-3 border border-white/10">
          <div className="flex items-center space-x-2">
            <Target size={14} className="text-teal-400" />
            <span className="text-white/70 text-sm">Advanced {userGoals?.mainGoal || 'Transformation'} Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}