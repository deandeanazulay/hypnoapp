import React from 'react';
import { Heart, Clock, Star, Play } from 'lucide-react';
import { useGameState } from '../GameStateManager';

interface FavoritesScreenProps {
  onSessionSelect: (session: any) => void;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onSessionSelect }) => {
  const { userState: user } = useGameState();

  // Mock favorite sessions data
  const favoriteSessions = [
    {
      id: 1,
      name: "Morning Meditation",
      egoState: "guardian",
      action: { name: "Meditate", icon: "🧘", energyCost: 10 },
      duration: "15 min",
      lastUsed: "2 days ago",
      rating: 5,
      completions: 12
    },
    {
      id: 2,
      name: "Creative Flow",
      egoState: "creator",
      action: { name: "Create", icon: "🎨", energyCost: 15 },
      duration: "30 min",
      lastUsed: "1 week ago",
      rating: 4,
      completions: 8
    },
    {
      id: 3,
      name: "Power Focus",
      egoState: "warrior",
      action: { name: "Focus", icon: "⚡", energyCost: 20 },
      duration: "45 min",
      lastUsed: "3 days ago",
      rating: 5,
      completions: 15
    }
  ];

  const handleSessionSelect = (session: any) => {
    onSessionSelect(session);
  };

  return (
    <div className="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Favorites</h1>
          <p className="text-purple-200 text-sm">Your most loved sessions</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
            <div className="text-white font-semibold text-sm">{favoriteSessions.length}</div>
            <div className="text-purple-200 text-xs">Favorites</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-white font-semibold text-sm">
              {favoriteSessions.reduce((total, session) => total + session.completions, 0)}
            </div>
            <div className="text-purple-200 text-xs">Sessions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-white font-semibold text-sm">
              {(favoriteSessions.reduce((total, session) => total + session.rating, 0) / favoriteSessions.length).toFixed(1)}
            </div>
            <div className="text-purple-200 text-xs">Avg Rating</div>
          </div>
        </div>

        {/* Favorite Sessions */}
        <div className="space-y-3">
          {favoriteSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{session.action.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{session.name}</h3>
                    <p className="text-purple-200 text-xs capitalize">{session.egoState} • {session.duration}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSessionSelect(session)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-purple-200">{session.rating}</span>
                  </div>
                  <div className="text-purple-200">
                    {session.completions} completions
                  </div>
                </div>
                <div className="text-purple-300">
                  {session.lastUsed}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {favoriteSessions.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-white font-semibold mb-2">No favorites yet</h3>
            <p className="text-purple-200 text-sm">
              Complete sessions and mark them as favorites to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesScreen;