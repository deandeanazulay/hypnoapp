import React from 'react';
import { User, Copy } from 'lucide-react';
import Orb from '../Orb';
import type { ChatMessage } from '../../store/chatSessionStore';

interface ChatBubbleProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  activeEgoState: string;
  isSpeaking?: boolean;
}

const baseBubbleStyles =
  'relative w-full rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm transition-colors duration-150';

export default function ChatBubble({ message, onCopy, activeEgoState, isSpeaking = false }: ChatBubbleProps) {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const isUser = message.role === 'user';

  const playAudioMessage = () => {
    if (!message.audioUrl) return;

    const audio = new Audio(message.audioUrl);
    setIsPlayingAudio(true);

    audio.onended = () => {
      setIsPlayingAudio(false);
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
    };

    audio.play();
  };

  const containerAlignment = isUser ? 'flex-row-reverse text-right' : 'flex-row text-left';
  const messageSurface = isUser
    ? 'bg-[#343541] border-white/10 text-white'
    : message.error
    ? 'bg-[#5c1f1f] border-[#ff8b8b]/40 text-white'
    : message.isLoading
    ? 'bg-[#444654] border-[#565869] text-white'
    : 'bg-[#444654] border-[#565869] text-white';
  const bubbleClasses = `${baseBubbleStyles} group ${messageSurface}`;

  return (
    <div className={`flex w-full items-start gap-4 ${containerAlignment}`}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#444654] text-white">
        {isUser ? (
          <User size={18} className="text-white/80" aria-hidden />
        ) : (
          <div className="relative flex h-10 w-10 items-center justify-center overflow-visible">
            <Orb
              onTap={() => {}}
              egoState={activeEgoState}
              size={72}
              variant="webgl"
              isSpeaking={isSpeaking || Boolean(message.isLoading)}
            />
          </div>
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>

        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0.15s' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: '0.3s' }} />
              </span>
              <span>Libero is thinking…</span>
            </div>
          ) : (
            <>
              {message.audioUrl && (
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2">
                  <button
                    onClick={playAudioMessage}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 transition hover:bg-cyan-500/30"
                    type="button"
                  >
                    {isPlayingAudio ? (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-200" />
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-cyan-200" />
                    )}
                  </button>
                  <span className="text-xs uppercase tracking-wide text-white/70">Voice message</span>
                </div>
              )}

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/95">{message.content}</div>

              <button
                type="button"
                onClick={() => onCopy(message.content)}
                className="absolute -right-2 -top-2 hidden rounded-full border border-white/10 bg-[#343541]/90 p-1 text-white/60 transition hover:text-white/90 group-hover:flex"
                aria-label="Copy message"
              >
                <Copy size={14} />
              </button>
            </>
          )}
        </div>

        <div className={`text-xs text-white/40 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
