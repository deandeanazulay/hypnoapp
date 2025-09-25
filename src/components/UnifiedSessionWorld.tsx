{/* Session Status */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 border border-white/20 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              sessionState.playState === 'playing' ? 'bg-green-400 animate-pulse' :
              sessionState.playState === 'paused' ? 'bg-yellow-400' :
              sessionState.playState === 'loading' ? 'bg-blue-400 animate-spin' :
              'bg-gray-400'
            }`} />
            <span className="text-xs font-medium text-white/80">
              {sessionState.playState === 'playing' ? 'Guided session active' :
               sessionState.playState === 'paused' ? 'Session paused' :
               sessionState.playState === 'loading' ? 'Preparing session...' :
               'Session ready'}
            </span>
            {sessionState.currentSegmentIndex >= 0 && (
              <div className="text-xs text-white/50">
                Segment {sessionState.currentSegmentIndex + 1}/{sessionState.totalSegments}
                {sessionHandle?.segments?.[sessionState.currentSegmentIndex]?.ttsProvider === 'browser-tts' && (
                  <span className="ml-2 px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-full">
                    Device Voice
                  </span>
                )}
                {sessionHandle?.segments?.[sessionState.currentSegmentIndex]?.ttsProvider === 'none' && (
                  <span className="ml-2 py-1 bg-gray-500/20 border border-gray-500/40 text-gray-400 rounded-full">
                    Text Only
                  </span>
                )}
              </div>
            )}
            {sessionState.error && (
              <div className="text-xs text-red-400">
                Error: {sessionState.error.message}
              </div>
            )}
          </div>
        </div>
      </header>