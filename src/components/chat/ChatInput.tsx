import React from 'react';
import { Send, RotateCcw, Mic, Play, Trash2, Square } from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearChat: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onDeleteRecording: () => void;
  onSendRecording: () => void;
  isLoading: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  isPlayingRecording: boolean;
  recordingDuration: number;
  hasMessages: boolean;
}

export default function ChatInput({
  inputText,
  onInputChange,
  onSubmit,
  onClearChat,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onDeleteRecording,
  onSendRecording,
  isLoading,
  isRecording,
  hasRecording,
  isPlayingRecording,
  recordingDuration,
  hasMessages
}: ChatInputProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (inputText.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  if (hasRecording) {
    return (
      <div className="border-t border-[#565869] bg-[#343541]/95 px-4 pb-[calc(1.5rem+var(--safe-bottom,0px))] pt-4">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-[#565869] bg-[#40414f] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onPlayRecording}
              disabled={isPlayingRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 transition hover:bg-cyan-500/30 disabled:opacity-50"
              type="button"
            >
              <Play size={20} className="text-cyan-200" />
            </button>
            <div className="flex flex-col text-sm">
              <span className="font-medium">Voice recording ready</span>
              <span className="text-white/60">{formatTime(recordingDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteRecording}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-red-200 transition hover:bg-red-500/20"
              type="button"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onSendRecording}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#10a37f] text-black transition hover:bg-[#12b187]"
              type="button"
            >
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-[#565869] bg-[#343541]/95 px-4 pb-[calc(1.5rem+var(--safe-bottom,0px))] pt-4 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[#565869] bg-[#40414f] p-3 shadow-[0_0_20px_rgba(0,0,0,0.25)] focus-within:border-white/40"
        >
          <textarea
            value={inputText}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Libero..."
            rows={1}
            className="h-14 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            disabled={isLoading}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  type="button"
                  onClick={onClearChat}
                  className="flex items-center gap-2 rounded-full border border-[#565869] px-3 py-1.5 text-xs text-white/70 transition hover:text-white hover:border-white/50"
                >
                  <RotateCcw size={14} />
                  New chat
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={onStartRecording}
                onPointerUp={onStopRecording}
                onPointerLeave={onStopRecording}
                onTouchStart={onStartRecording}
                onTouchEnd={onStopRecording}
                disabled={isLoading}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isRecording
                    ? 'border-red-400 bg-red-500/20 text-red-200'
                    : 'border-[#565869] bg-[#343541] text-white/70 hover:text-white'
                } disabled:opacity-50`}
                title={isRecording ? 'Recording…' : 'Hold to record'}
              >
                {isRecording ? <Square size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10a37f] text-black transition hover:bg-[#12b187] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} className="translate-x-[1px]" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-white/40">
          Libero may produce inaccuracies. Check critical information before acting.
        </p>
      </div>
    </div>
  );
}