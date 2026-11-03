import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StoryDialogueEntry, StoryDialogueSequence } from '../types/story';
import { AudioService } from '../services/audio';
import { PORTRAIT_CONFIGS } from '../data/portraits';
import { AnimatedCommanderAvatar } from './AnimatedCommanderAvatar';
import {
  ChevronRight,
  FastForward,
  Sparkles,
  Radio,
  Crown,
  Shield,
  Volume2,
} from 'lucide-react';

interface StoryDialogueModalProps {
  sequence: StoryDialogueSequence | null;
  isOpen: boolean;
  onComplete: () => void;
}

export const StoryDialogueModal: React.FC<StoryDialogueModalProps> = ({
  sequence,
  isOpen,
  onComplete,
}) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lines = sequence?.lines || [];
  const currentEntry: StoryDialogueEntry | undefined = lines[lineIndex];

  // Reset when a new sequence opens
  useEffect(() => {
    if (isOpen && sequence) {
      setLineIndex(0);
      setDisplayedText('');
      setIsTyping(true);
    }
  }, [isOpen, sequence]);

  // Typewriter effect with 8-bit voice chirps and Neko vocalizations
  useEffect(() => {
    if (!isOpen || !currentEntry) return;

    const fullText = currentEntry.text;
    const isNeko = currentEntry.speaker.portrait.includes('neko') || !!currentEntry.speaker.isCute;
    let charIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    // Play Neko voice cue at transmission start
    if (isNeko) {
      if (fullText.toLowerCase().includes('buru nyuu') || fullText.toLowerCase().includes('nyuu')) {
        AudioService.playNekoVoice('buru_nyuu');
      } else if (fullText.toLowerCase().includes('dori')) {
        AudioService.playNekoVoice('dori');
      } else {
        AudioService.playNekoVoice('nya');
      }
    }

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      charIdx++;
      setDisplayedText(fullText.slice(0, charIdx));

      // Trigger 8-bit voice blip on characters
      if (charIdx % 2 === 1 && charIdx < fullText.length) {
        AudioService.voiceChirp(
          currentEntry.speaker.voicePitch || 1.0,
          isNeko
        );
      }

      if (charIdx >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, 22);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [isOpen, currentEntry]);

  // Advance to next line or complete
  const handleAdvance = useCallback(() => {
    if (!currentEntry) return;

    if (isTyping) {
      // Instant skip typewriter to full text
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(currentEntry.text);
      setIsTyping(false);
      AudioService.play('click');
    } else {
      // Advance to next line
      if (lineIndex + 1 < lines.length) {
        setLineIndex((prev) => prev + 1);
        AudioService.play('tab');
      } else {
        AudioService.play('turnReady');
        onComplete();
      }
    }
  }, [isTyping, currentEntry, lineIndex, lines.length, onComplete]);

  // Keyboard navigation (Space or Enter advances)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleAdvance]);

  if (!isOpen || !currentEntry) return null;

  const speaker = currentEntry.speaker;
  const isLastLine = lineIndex === lines.length - 1;
  const portraitKey = speaker.portrait || 'neko_queen';
  const config = PORTRAIT_CONFIGS[portraitKey] || PORTRAIT_CONFIGS['neko_queen'];
  const isNeko = portraitKey.includes('neko') || !!speaker.isCute;

  return (
    <div
      onClick={handleAdvance}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none cursor-pointer"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleAdvance();
        }}
        className="w-full max-w-3xl bg-[#0a0e12]/95 border-2 rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 font-sans flex flex-col gap-4 relative overflow-hidden backdrop-blur-xl transition-all"
        style={{
          borderColor: speaker.accentColor,
          boxShadow: `0 0 35px ${config?.glowColor || 'rgba(234, 179, 8, 0.25)'}`,
        }}
      >
        {/* Animated Background Ambience */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            config?.themeGradient || 'from-slate-900 to-black'
          } opacity-40 pointer-events-none`}
        />

        {/* Tactical Corner Reticles */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/60 pointer-events-none" />

        {/* Top Info Bar */}
        <div className="flex items-center justify-between border-b border-[#212b32] pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span
              className="text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-md font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border"
              style={{
                backgroundColor: `${speaker.accentColor}25`,
                color: speaker.accentColor,
                borderColor: `${speaker.accentColor}50`,
              }}
            >
              {isNeko ? (
                <Crown className="w-3.5 h-3.5 text-pink-400" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>{config?.badgeLabel || speaker.title}</span>
            </span>

            <span className="text-xs text-slate-400 font-mono">
              Transmission {lineIndex + 1} / {lines.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              [SPACE] or [TAP]
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isTyping) {
                  setDisplayedText(currentEntry.text);
                  setIsTyping(false);
                } else {
                  handleAdvance();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#141e25] hover:bg-[#1d2a33] text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-[#2b3a45] transition-all cursor-pointer active:scale-95"
            >
              {isTyping ? (
                <>
                  <FastForward className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fast</span>
                </>
              ) : isLastLine ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Commence</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Character Portrait & Dialogue Body */}
        <div className="flex items-start gap-4 sm:gap-6 relative z-10">
          {/* Animated Vector Commander Avatar (Neco-Arc Chibi for Neko, Military commanders for others) */}
          <div className="shrink-0 relative group">
            {/* Outer Animated Ring / Audio Beacon */}
            <div
              className={`absolute -inset-1.5 rounded-2xl sm:rounded-3xl blur-sm transition-opacity duration-300 pointer-events-none ${
                isTyping ? 'opacity-90 animate-pulse' : 'opacity-40'
              }`}
              style={{
                background: `linear-gradient(135deg, ${speaker.accentColor}, ${
                  isNeko ? '#f472b6' : '#38bdf8'
                })`,
              }}
            />

            {/* Vector Character Avatar Component */}
            <AnimatedCommanderAvatar
              portraitKey={portraitKey}
              isSpeaking={isTyping}
              accentColor={speaker.accentColor}
              size="md"
            />
          </div>

          {/* Dialogue Body & Typewriter Text */}
          <div className="flex-1 min-h-[110px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h4
                    className="text-base sm:text-xl font-black tracking-wide font-mono flex items-center gap-2"
                    style={{ color: speaker.accentColor }}
                  >
                    <span>{speaker.name}</span>
                    {isNeko && <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />}
                  </h4>

                  {/* Cute Voice Line Soundboard Button for Neko */}
                  {isNeko && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        AudioService.playNekoVoice('buru_nyuu');
                      }}
                      className="px-2 py-0.5 rounded-full bg-pink-950/70 border border-pink-500/40 text-[10px] font-mono font-bold text-pink-300 hover:bg-pink-900 flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm"
                      title="Play Neco-Arc Voice"
                    >
                      <Volume2 className="w-3 h-3 text-pink-400" />
                      <span>Buru Nyuu!~</span>
                    </button>
                  )}
                </div>

                {/* Animated Equalizer Waveform while speaking */}
                <div className="flex items-center gap-1 h-3 px-2 py-0.5 bg-black/40 rounded-full border border-white/10">
                  <span
                    className={`w-0.5 bg-amber-400 rounded-full transition-all duration-150 ${
                      isTyping ? 'h-3 animate-bounce' : 'h-1'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-amber-400 rounded-full transition-all duration-150 delay-75 ${
                      isTyping ? 'h-2.5 animate-bounce' : 'h-1.5'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-amber-400 rounded-full transition-all duration-150 delay-150 ${
                      isTyping ? 'h-3 animate-bounce' : 'h-1'
                    }`}
                  />
                </div>
              </div>

              <span className="text-xs text-slate-400 font-mono block mb-2">
                {speaker.title}
              </span>

              {/* Typewriter text with retro colored cursor */}
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans font-medium">
                {displayedText}
                {isTyping && (
                  <span
                    className="inline-block w-2 h-4 ml-1.5 animate-pulse align-middle"
                    style={{ backgroundColor: speaker.accentColor }}
                  />
                )}
              </p>
            </div>

            {/* Bottom Status / Proceed Indicator */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2.5 mt-3 border-t border-[#1a2329]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-slate-300">
                  {isNeko ? '🐾 Neko-Arc Chibi Audio Frequency · "Buru Nyuu!~"' : '8-Bit Synthesized Command Frequency'}
                </span>
              </div>

              <span className="text-amber-400 font-bold flex items-center gap-1 cursor-pointer">
                {isLastLine ? 'Tap to Confirm Directive' : 'Tap to Continue'}
                <ChevronRight className="w-3.5 h-3.5 animate-bounce" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
