import React, { useState, useEffect } from 'react';

export interface AnimatedCommanderAvatarProps {
  portraitKey: string;
  isSpeaking: boolean;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedCommanderAvatar: React.FC<AnimatedCommanderAvatarProps> = ({
  portraitKey,
  isSpeaking,
  accentColor,
  size = 'md',
  className = '',
}) => {
  const [blink, setBlink] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const [earTwitch, setEarTwitch] = useState(false);

  // Periodic eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3400 + Math.random() * 1200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic Neko ear twitch
  useEffect(() => {
    if (!portraitKey.includes('neko')) return;
    const twitchInterval = setInterval(() => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 240);
    }, 2800 + Math.random() * 1800);

    return () => clearInterval(twitchInterval);
  }, [portraitKey]);

  // Mouth flapping when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthPhase(0);
      return;
    }
    const mouthInterval = setInterval(() => {
      setMouthPhase((prev) => (prev + 1) % 4);
    }, 110);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28 sm:w-32 sm:h-32',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
  }[size];

  // Render Neco-Arc inspired chibi anime cat creature
  const renderNekoArc = (isQueen: boolean) => {
    return (
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nekoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a044e" />
            <stop offset="50%" stopColor="#831843" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="nekoHair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="nekoEye" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="nekoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="nekoCape" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
        </defs>

        {/* Ambient Darkened Background */}
        <rect width="200" height="200" fill="url(#nekoBg)" />

        {/* Subtle magical sparkle stars in background */}
        <g opacity="0.6">
          <circle cx="28" cy="40" r="1.5" fill="#f472b6" className="animate-pulse" />
          <circle cx="172" cy="48" r="2" fill="#fbcfe8" className="animate-pulse" />
          <circle cx="160" cy="140" r="1.5" fill="#f472b6" />
          <circle cx="36" cy="155" r="2" fill="#fbcfe8" />
        </g>

        {/* Twitching Cat Ears (Neco-Arc perky ears) */}
        <g
          className="transition-transform duration-150 origin-bottom"
          transform={earTwitch ? 'translate(0, -2) scale(1.05)' : ''}
        >
          {/* Left Cat Ear */}
          <polygon
            points="38,82 60,18 94,62"
            fill="#fffdf5"
            stroke="#facc15"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Left Inner Pink Fluff */}
          <polygon points="48,74 62,32 86,60" fill="#f472b6" />
          <polygon points="54,68 64,42 80,60" fill="#fbcfe8" opacity="0.8" />

          {/* Right Cat Ear */}
          <polygon
            points="162,82 140,18 106,62"
            fill="#fffdf5"
            stroke="#facc15"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Right Inner Pink Fluff */}
          <polygon points="152,74 138,32 114,60" fill="#f472b6" />
          <polygon points="146,68 136,42 120,60" fill="#fbcfe8" opacity="0.8" />
        </g>

        {/* Queen Felina's Royal Golden Mini Crown or Military Beret */}
        {isQueen ? (
          <g transform="translate(100, 32) rotate(-8) scale(0.95)" className="animate-bounce">
            <polygon points="-22,12 -18,-14 -6,-2 0,-18 6,-2 18,-14 22,12" fill="url(#nekoGold)" stroke="#78350f" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="0" cy="-18" r="3" fill="#ef4444" />
            <circle cx="-18" cy="-14" r="2.5" fill="#38bdf8" />
            <circle cx="18" cy="-14" r="2.5" fill="#22c55e" />
            <circle cx="0" cy="4" r="3" fill="#dc2626" />
          </g>
        ) : (
          <g transform="translate(74, 30) rotate(-14)">
            {/* Cute mini military cap perched between ears */}
            <path d="M-12,12 Q0,0 24,6 Q16,18 -12,12 Z" fill="#3c4a36" stroke="#1c2419" strokeWidth="1.5" />
            <circle cx="6" cy="7" r="2.5" fill="#eab308" />
          </g>
        )}

        {/* Hair - Back Tuft */}
        <path d="M42,90 Q100,165 158,90 Q168,135 154,155 Q100,175 46,155 Z" fill="#d97706" />

        {/* Small Chibi Body & Royal Burgundy Capelet */}
        <g transform="translate(0, 10)">
          <path d="M68,142 Q100,136 132,142 L146,195 Q100,205 54,195 Z" fill="url(#nekoCape)" />
          {/* White Shirt Collar */}
          <polygon points="100,146 86,160 114,160" fill="#ffffff" />
          {/* Golden Royal Bell / Bowtie */}
          <circle cx="100" cy="162" r="6.5" fill="url(#nekoGold)" stroke="#78350f" strokeWidth="1.5" />
          <line x1="96" y1="162" x2="104" y2="162" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="100" cy="164" r="1.5" fill="#450a0a" />
        </g>

        {/* Head - Round Chubby Chibi Face */}
        <ellipse cx="100" cy="106" rx="54" ry="46" fill="#fffdf5" stroke="#fef08a" strokeWidth="2.5" />

        {/* Iconic Neco-Arc Blonde Bob Hair */}
        <g fill="url(#nekoHair)" stroke="#ca8a04" strokeWidth="1.5" strokeLinejoin="round">
          {/* Left Hair Fluff */}
          <path d="M52,78 Q40,105 44,136 Q58,132 62,118 Q54,102 60,86 Z" />
          {/* Right Hair Fluff */}
          <path d="M148,78 Q160,105 156,136 Q142,132 138,118 Q146,102 140,86 Z" />
          {/* Front Forehead Bangs with characteristic Neco-Arc arches */}
          <path d="M50,78 Q100,56 150,78 Q138,98 126,90 Q112,104 100,88 Q88,104 74,90 Q62,98 50,78 Z" />
          {/* Chaotic Ahoge Hair Strand */}
          <path d="M98,62 Q92,38 106,34 Q102,48 102,62 Z" />
        </g>

        {/* Cheeks - Kawaii Anime Pink Blush */}
        <g fill="#f472b6" opacity="0.65">
          <ellipse cx="62" cy="118" rx="9" ry="5.5" />
          <ellipse cx="138" cy="118" rx="9" ry="5.5" />
        </g>
        {/* Blush angle lines /// */}
        <g stroke="#db2777" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
          <line x1="57" y1="115" x2="60" y2="121" />
          <line x1="61" y1="115" x2="64" y2="121" />
          <line x1="65" y1="115" x2="68" y2="121" />

          <line x1="133" y1="115" x2="136" y2="121" />
          <line x1="137" y1="115" x2="140" y2="121" />
          <line x1="141" y1="115" x2="144" y2="121" />
        </g>

        {/* Neco-Arc Round Red Eyes (Animated Blinking) */}
        {blink ? (
          <g stroke="#991b1b" strokeWidth="3.5" strokeLinecap="round">
            {/* Cute closed happy curved eyes: ^ ^ */}
            <path d="M68,106 Q78,98 88,106" fill="none" />
            <path d="M112,106 Q122,98 132,106" fill="none" />
          </g>
        ) : (
          <g>
            {/* Left Eye */}
            <ellipse cx="78" cy="104" rx="14" ry="16" fill="url(#nekoEye)" stroke="#7f1d1d" strokeWidth="2" />
            {/* Left Eye Vertical Slit Pupil */}
            <ellipse cx="78" cy="104" rx="3.5" ry="11" fill="#450a0a" />
            {/* Eye Highlights */}
            <circle cx="73" cy="98" r="4.5" fill="#ffffff" />
            <circle cx="82" cy="111" r="2" fill="#ffffff" opacity="0.8" />

            {/* Right Eye */}
            <ellipse cx="122" cy="104" rx="14" ry="16" fill="url(#nekoEye)" stroke="#7f1d1d" strokeWidth="2" />
            {/* Right Eye Vertical Slit Pupil */}
            <ellipse cx="122" cy="104" rx="3.5" ry="11" fill="#450a0a" />
            {/* Eye Highlights */}
            <circle cx="117" cy="98" r="4.5" fill="#ffffff" />
            <circle cx="126" cy="111" r="2" fill="#ffffff" opacity="0.8" />
          </g>
        )}

        {/* Tiny Cute Cat Nose */}
        <polygon points="100,113 97,110 103,110" fill="#f43f5e" />

        {/* Iconic Neco-Arc ":3" Cat Mouth & Talking Animation Flaps */}
        {isSpeaking && mouthPhase > 0 ? (
          // Mouth Open Flapping: Chibi wide cat mouth with pink tongue
          <g>
            <path
              d={
                mouthPhase % 2 === 1
                  ? "M90,118 Q100,114 110,118 Q108,136 100,136 Q92,136 90,118 Z"
                  : "M92,118 Q100,115 108,118 Q106,128 100,128 Q94,128 92,118 Z"
              }
              fill="#881337"
              stroke="#4c0519"
              strokeWidth="2"
            />
            {/* Cute Pink Tongue */}
            <path d="M94,128 Q100,124 106,128 Q100,135 94,128 Z" fill="#fb7185" />
            {/* Left & Right Tiny Sharp Cat Fangs */}
            <polygon points="92,118 94,124 96,118" fill="#ffffff" />
            <polygon points="104,118 106,124 108,118" fill="#ffffff" />
          </g>
        ) : (
          // Iconic Closed ":3" Cat Smirk
          <g stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Wavy upper lip */}
            <path d="M92,119 Q96,125 100,119 Q104,125 108,119" />
            {/* Tiny fangs poking out */}
            <polygon points="94,120 96,124 97,120" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
            <polygon points="103,120 104,124 106,120" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
          </g>
        )}

        {/* Cute Floating Chibi Cat Paws (Bounce slightly when speaking) */}
        <g transform={isSpeaking ? 'translate(0, -2)' : 'translate(0, 0)'} className="transition-transform duration-100">
          {/* Left Paw */}
          <ellipse cx="56" cy="165" rx="14" ry="12" fill="#fffdf5" stroke="#fde047" strokeWidth="2" />
          {/* Paw Toe Beans */}
          <ellipse cx="56" cy="165" rx="5.5" ry="4" fill="#f472b6" />
          <circle cx="51" cy="158" r="2.2" fill="#f472b6" />
          <circle cx="56" cy="156" r="2.2" fill="#f472b6" />
          <circle cx="61" cy="158" r="2.2" fill="#f472b6" />

          {/* Right Paw */}
          <ellipse cx="144" cy="165" rx="14" ry="12" fill="#fffdf5" stroke="#fde047" strokeWidth="2" />
          {/* Paw Toe Beans */}
          <ellipse cx="144" cy="165" rx="5.5" ry="4" fill="#f472b6" />
          <circle cx="139" cy="158" r="2.2" fill="#f472b6" />
          <circle cx="144" cy="156" r="2.2" fill="#f472b6" />
          <circle cx="149" cy="158" r="2.2" fill="#f472b6" />
        </g>

        {/* Iconic Catchphrase Overlay Tag */}
        <g transform="translate(14, 185)">
          <rect x="0" y="0" width="84" height="15" rx="7.5" fill="#ec4899" opacity="0.9" />
          <text x="42" y="11" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            BURU NYU~!
          </text>
        </g>
      </svg>
    );
  };

  // Render WW2 Supreme Allied Commander (Eisenhower style)
  const renderAlliedGeneral = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="alliedBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="alliedSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="alliedJacket" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3f4f3c" />
            <stop offset="100%" stopColor="#253223" />
          </linearGradient>
          <linearGradient id="goldBraid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="url(#alliedBg)" />

        {/* Uniform Jacket & Lapels */}
        <path d="M30,150 L60,130 L100,165 L140,130 L170,150 L185,200 L15,200 Z" fill="url(#alliedJacket)" />
        {/* Shirt & Tie */}
        <polygon points="100,140 86,165 114,165" fill="#fef08a" />
        <polygon points="100,150 96,190 104,190" fill="#713f12" />

        {/* Shoulder Epaulettes with 5-Star Rank */}
        <polygon points="25,160 48,138 68,144 42,168" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
        <polygon points="175,160 152,138 132,144 158,168" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
        <text x="44" y="156" fill="#fff" fontSize="8" fontWeight="bold">★★★★★</text>
        <text x="134" y="156" fill="#fff" fontSize="8" fontWeight="bold">★★★★★</text>

        {/* Ribbon Bar on Chest */}
        <g transform="translate(120, 168)">
          <rect x="0" y="0" width="10" height="4" fill="#3b82f6" />
          <rect x="11" y="0" width="10" height="4" fill="#ef4444" />
          <rect x="22" y="0" width="10" height="4" fill="#22c55e" />
          <rect x="0" y="5" width="10" height="4" fill="#eab308" />
          <rect x="11" y="5" width="10" height="4" fill="#a855f7" />
          <rect x="22" y="5" width="10" height="4" fill="#f97316" />
        </g>

        {/* Head & Neck */}
        <rect x="88" y="120" width="24" height="25" fill="#f59e0b" />
        <ellipse cx="100" cy="98" rx="36" ry="40" fill="#fcd34d" stroke="#d97706" strokeWidth="1.5" />

        {/* Determined Military Brow & Eyes */}
        <path d="M72,82 Q84,78 94,83" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M106,83 Q116,78 128,82" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />

        {blink ? (
          <g stroke="#78350f" strokeWidth="3" strokeLinecap="round">
            <line x1="74" y1="92" x2="90" y2="92" />
            <line x1="110" y1="92" x2="126" y2="92" />
          </g>
        ) : (
          <g>
            <ellipse cx="82" cy="92" rx="7" ry="5.5" fill="#fff" />
            <circle cx="83" cy="92" r="3.5" fill="#1e3a8a" />
            <circle cx="84" cy="91" r="1.2" fill="#fff" />

            <ellipse cx="118" cy="92" rx="7" ry="5.5" fill="#fff" />
            <circle cx="117" cy="92" r="3.5" fill="#1e3a8a" />
            <circle cx="118" cy="91" r="1.2" fill="#fff" />
          </g>
        )}

        {/* Nose */}
        <path d="M99,88 L97,106 L103,106" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Mouth with speech flapping */}
        {isSpeaking && mouthPhase > 0 ? (
          <path
            d={mouthPhase % 2 === 1 ? "M91,118 Q100,126 109,118 Z" : "M92,118 Q100,122 108,118 Z"}
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="1.5"
          />
        ) : (
          <line x1="91" y1="118" x2="109" y2="118" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Allied Officer Peaked Visor Cap */}
        <path d="M52,70 Q100,32 148,70 Q100,58 52,70 Z" fill="#4d5f49" stroke="#2c3a2a" strokeWidth="2" />
        {/* Dark Visor Brim */}
        <path d="M56,68 Q100,82 144,68 Q100,60 56,68 Z" fill="#18181b" />
        {/* Gold Braid Chin Strap */}
        <path d="M58,66 Q100,74 142,66" stroke="url(#goldBraid)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* Gold Allied Eagle & Star Insignia */}
        <polygon points="100,44 94,54 106,54" fill="url(#goldBraid)" />
        <circle cx="100" cy="46" r="4" fill="#ca8a04" />

        {/* Radio Comms Headset & Mic */}
        <circle cx="56" cy="96" r="9" fill="#27272a" stroke="#52525b" strokeWidth="2" />
        <path d="M56,96 Q70,122 88,122" stroke="#52525b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="90" cy="122" r="3" fill="#22c55e" className="animate-ping" />
      </svg>
    );
  };

  // Render WW2 German Field Marshal (Von Rundstedt style)
  const renderGermanCommander = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="germanBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <linearGradient id="feldgrau" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          <linearGradient id="silverCord" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="url(#germanBg)" />

        {/* Feldgrau Tunic */}
        <path d="M25,148 L65,128 L100,165 L135,128 L175,148 L188,200 L12,200 Z" fill="url(#feldgrau)" />
        {/* Dark Green Collar */}
        <polygon points="65,128 100,165 135,128 128,118 100,135 72,118" fill="#1c2b21" stroke="#cbd5e1" strokeWidth="1" />

        {/* Knights Cross of the Iron Cross (Ritterkreuz) around neck */}
        <g transform="translate(100, 142)">
          <path d="M-6,0 L6,0 L8,14 L0,18 L-8,14 Z" fill="#dc2626" />
          <line x1="-3" y1="0" x2="-3" y2="16" stroke="#fff" strokeWidth="1.5" />
          <line x1="3" y1="0" x2="3" y2="16" stroke="#fff" strokeWidth="1.5" />
          {/* Iron Cross medal */}
          <polygon points="-5,14 5,14 3,18 7,22 3,24 5,28 -5,28 -3,24 -7,22 -3,18" fill="#18181b" stroke="#cbd5e1" strokeWidth="1" />
        </g>

        {/* Head & Neck */}
        <ellipse cx="100" cy="98" rx="35" ry="39" fill="#fcd34d" stroke="#ca8a04" strokeWidth="1.5" />

        {/* Eyebrows */}
        <path d="M72,83 Q82,79 93,84" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M107,84 Q118,79 128,83" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Aristocratic Monocle on Right Eye */}
        <circle cx="118" cy="93" r="10" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
        <path d="M112,87 L124,99" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
        <path d="M128,93 Q136,110 134,136" stroke="#94a3b8" strokeWidth="1" fill="none" />

        {blink ? (
          <g stroke="#713f12" strokeWidth="3" strokeLinecap="round">
            <line x1="74" y1="93" x2="90" y2="93" />
            <line x1="110" y1="93" x2="126" y2="93" />
          </g>
        ) : (
          <g>
            <ellipse cx="82" cy="93" rx="6.5" ry="5" fill="#fff" />
            <circle cx="83" cy="93" r="3.2" fill="#475569" />
            <circle cx="84" cy="92" r="1" fill="#fff" />

            <ellipse cx="118" cy="93" rx="6.5" ry="5" fill="#fff" opacity="0.85" />
            <circle cx="118" cy="93" r="3.2" fill="#475569" />
            <circle cx="119" cy="92" r="1" fill="#fff" />
          </g>
        )}

        {/* Sharp Aquiline Nose */}
        <path d="M100,88 L96,107 L102,107" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {isSpeaking && mouthPhase > 0 ? (
          <path
            d={mouthPhase % 2 === 1 ? "M92,119 Q100,126 108,119 Z" : "M93,119 Q100,122 107,119 Z"}
            fill="#450a0a"
            stroke="#7f1d1d"
            strokeWidth="1.5"
          />
        ) : (
          <line x1="92" y1="119" x2="108" y2="119" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Wehrmacht Peaked Officer Cap */}
        <path d="M50,66 Q100,24 150,66 Q100,54 50,66 Z" fill="#3f474f" stroke="#1f2937" strokeWidth="2" />
        {/* Black Lacquered Visor Brim */}
        <path d="M54,66 Q100,80 146,66 Q100,58 54,66 Z" fill="#09090b" />
        {/* Silver Cord Chin Strap */}
        <path d="M56,64 Q100,72 144,64" stroke="url(#silverCord)" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Wehrmacht Silver Eagle & Cockade */}
        <polygon points="100,42 92,48 108,48" fill="#e2e8f0" />
        <circle cx="100" cy="52" r="3.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  };

  // Render Modern US General (Advanced tactical HUD & helmet)
  const renderModernUS = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="modernBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="camoTan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a88d65" />
            <stop offset="100%" stopColor="#63533c" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="url(#modernBg)" />

        {/* Tactical Plate Carrier & Camo */}
        <path d="M25,145 L65,125 L100,155 L135,125 L175,145 L188,200 L12,200 Z" fill="url(#camoTan)" />
        {/* Subdued American Flag Patch */}
        <rect x="36" y="155" width="22" height="13" fill="#382f24" stroke="#d4d4d8" strokeWidth="1" />
        <text x="47" y="164" fill="#a1a1aa" fontSize="7" fontWeight="bold" textAnchor="middle">USA</text>

        {/* Head */}
        <ellipse cx="100" cy="98" rx="35" ry="38" fill="#fcd34d" stroke="#ca8a04" strokeWidth="1.5" />

        {/* Eyebrows */}
        <path d="M72,83 Q82,78 93,83" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M107,83 Q118,78 128,83" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        {blink ? (
          <g stroke="#713f12" strokeWidth="3" strokeLinecap="round">
            <line x1="74" y1="92" x2="90" y2="92" />
            <line x1="110" y1="92" x2="126" y2="92" />
          </g>
        ) : (
          <g>
            <ellipse cx="82" cy="92" rx="6.5" ry="5" fill="#fff" />
            <circle cx="83" cy="92" r="3.2" fill="#0284c7" />
            <circle cx="84" cy="91" r="1" fill="#fff" />

            <ellipse cx="118" cy="92" rx="6.5" ry="5" fill="#fff" />
            <circle cx="117" cy="92" r="3.2" fill="#0284c7" />
            <circle cx="118" cy="91" r="1" fill="#fff" />
          </g>
        )}

        {/* High-Tech Holographic HUD Monocular over Left Eye */}
        <g>
          <circle cx="82" cy="92" r="9" fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" strokeWidth="1.5" />
          <path d="M82,85 L82,99 M75,92 L89,92" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx="82" cy="92" r="4" fill="none" stroke="#38bdf8" strokeWidth="1" />
          <path d="M74,90 L60,86" stroke="#0891b2" strokeWidth="2" />
        </g>

        {/* Nose */}
        <path d="M100,88 L97,106 L103,106" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {isSpeaking && mouthPhase > 0 ? (
          <path
            d={mouthPhase % 2 === 1 ? "M92,118 Q100,125 108,118 Z" : "M93,118 Q100,121 107,118 Z"}
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="1.5"
          />
        ) : (
          <line x1="92" y1="118" x2="108" y2="118" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Modern FAST Tactical Ballistic Helmet */}
        <path d="M52,72 Q100,30 148,72 Q152,78 144,82 Q100,68 56,82 Q48,78 52,72 Z" fill="#786c52" stroke="#3f382a" strokeWidth="2" />
        {/* NVG Shroud Mount on Forehead */}
        <rect x="92" y="56" width="16" height="12" rx="2" fill="#27272a" stroke="#52525b" strokeWidth="1" />
        {/* Side Tactical Comms Headset & Boom Mic */}
        <rect x="46" y="86" width="10" height="18" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
        <path d="M50,96 Q68,124 88,124" stroke="#71717a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="89" cy="124" r="3" fill="#38bdf8" className="animate-pulse" />
      </svg>
    );
  };

  // Render WW2 British Field Marshal (Montgomery / Brodie helmet style)
  const renderBritishCommander = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="britishBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
          <linearGradient id="khakiBattledress" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5a40" />
            <stop offset="100%" stopColor="#2c3725" />
          </linearGradient>
          <linearGradient id="goldBrass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="url(#britishBg)" />

        {/* Khaki Wool Battledress Blouse */}
        <path d="M25,148 L65,128 L100,165 L135,128 L175,148 L188,200 L12,200 Z" fill="url(#khakiBattledress)" />
        {/* Red General Staff Gorget Collar Tabs */}
        <polygon points="68,130 76,146 84,136" fill="#dc2626" stroke="url(#goldBrass)" strokeWidth="1" />
        <polygon points="132,130 124,146 116,136" fill="#dc2626" stroke="url(#goldBrass)" strokeWidth="1" />
        {/* Tie & Collar */}
        <polygon points="100,146 95,175 105,175" fill="#78350f" />

        {/* Head */}
        <ellipse cx="100" cy="98" rx="35" ry="38" fill="#fcd34d" stroke="#ca8a04" strokeWidth="1.5" />

        {/* Thick British Officer Eyebrows */}
        <path d="M72,83 Q82,78 93,83" stroke="#713f12" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M107,83 Q118,78 128,83" stroke="#713f12" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Keen Blue Eyes */}
        {blink ? (
          <g stroke="#713f12" strokeWidth="3" strokeLinecap="round">
            <line x1="74" y1="92" x2="90" y2="92" />
            <line x1="110" y1="92" x2="126" y2="92" />
          </g>
        ) : (
          <g>
            <ellipse cx="82" cy="92" rx="6.5" ry="5" fill="#fff" />
            <circle cx="83" cy="92" r="3.2" fill="#0284c7" />
            <circle cx="84" cy="91" r="1" fill="#fff" />

            <ellipse cx="118" cy="92" rx="6.5" ry="5" fill="#fff" />
            <circle cx="117" cy="92" r="3.2" fill="#0284c7" />
            <circle cx="118" cy="91" r="1" fill="#fff" />
          </g>
        )}

        {/* Nose */}
        <path d="M100,88 L97,105 L103,105" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Iconic British Military Mustache */}
        <path d="M86,112 Q100,108 114,112 Q108,118 100,116 Q92,118 86,112 Z" fill="#713f12" stroke="#451a03" strokeWidth="1" />

        {/* Mouth */}
        {isSpeaking && mouthPhase > 0 ? (
          <path
            d={mouthPhase % 2 === 1 ? "M93,120 Q100,126 107,120 Z" : "M94,120 Q100,123 106,120 Z"}
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="1.5"
          />
        ) : (
          <line x1="93" y1="120" x2="107" y2="120" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Black Royal Tank Regiment Beret (Montgomery style) */}
        <path d="M50,74 Q68,44 116,46 Q156,48 152,72 Q136,80 84,78 Q54,78 50,74 Z" fill="#18181b" stroke="#09090b" strokeWidth="2" />
        {/* Double Gold Regimental Badges */}
        <g transform="translate(80, 60)">
          <polygon points="0,-8 5,0 0,8 -5,0" fill="url(#goldBrass)" stroke="#78350f" strokeWidth="1" />
          <polygon points="12,-8 17,0 12,8 7,0" fill="url(#goldBrass)" stroke="#78350f" strokeWidth="1" />
        </g>
      </svg>
    );
  };

  // Render Imperial Japanese Commander
  const renderJapanCommander = () => {
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="japanBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="japanKhaki" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#543007" />
          </linearGradient>
        </defs>

        <rect width="200" height="200" fill="url(#japanBg)" />

        {/* Khaki Showa-Era Field Uniform */}
        <path d="M25,148 L65,128 L100,165 L135,128 L175,148 L188,200 L12,200 Z" fill="url(#japanKhaki)" />
        {/* Red & Gold Rank Collar Tabs */}
        <rect x="76" y="132" width="14" height="7" fill="#dc2626" stroke="#facc15" strokeWidth="1" />
        <rect x="110" y="132" width="14" height="7" fill="#dc2626" stroke="#facc15" strokeWidth="1" />
        <circle cx="83" cy="135.5" r="1.5" fill="#facc15" />
        <circle cx="117" cy="135.5" r="1.5" fill="#facc15" />

        {/* Head */}
        <ellipse cx="100" cy="98" rx="35" ry="38" fill="#fcd34d" stroke="#ca8a04" strokeWidth="1.5" />

        {/* Eyebrows */}
        <path d="M72,83 Q82,78 93,83" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M107,83 Q118,78 128,83" stroke="#713f12" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Dark Eyes */}
        {blink ? (
          <g stroke="#713f12" strokeWidth="3" strokeLinecap="round">
            <line x1="74" y1="92" x2="90" y2="92" />
            <line x1="110" y1="92" x2="126" y2="92" />
          </g>
        ) : (
          <g>
            <ellipse cx="82" cy="92" rx="6" ry="4.8" fill="#fff" />
            <circle cx="83" cy="92" r="3" fill="#18181b" />
            <circle cx="84" cy="91" r="1" fill="#fff" />

            <ellipse cx="118" cy="92" rx="6" ry="4.8" fill="#fff" />
            <circle cx="117" cy="92" r="3" fill="#18181b" />
            <circle cx="118" cy="91" r="1" fill="#fff" />
          </g>
        )}

        {/* Nose */}
        <path d="M100,88 L97,105 L103,105" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Trimmed Military Mustache */}
        <rect x="88" y="111" width="24" height="4.5" rx="2" fill="#292524" />

        {/* Mouth */}
        {isSpeaking && mouthPhase > 0 ? (
          <path
            d={mouthPhase % 2 === 1 ? "M93,120 Q100,126 107,120 Z" : "M94,120 Q100,123 106,120 Z"}
            fill="#7f1d1d"
            stroke="#450a0a"
            strokeWidth="1.5"
          />
        ) : (
          <line x1="93" y1="120" x2="107" y2="120" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Showa Field Cap with Cloth Neck Flaps */}
        {/* Neck Flaps Behind Head */}
        <path d="M52,86 L44,142 L66,134 Z" fill="#713f12" opacity="0.85" />
        <path d="M148,86 L156,142 L134,134 Z" fill="#713f12" opacity="0.85" />
        {/* Cap Body */}
        <path d="M52,70 Q100,32 148,70 Q100,56 52,70 Z" fill="#854d0e" stroke="#543007" strokeWidth="2" />
        {/* Leather Visor */}
        <path d="M56,68 Q100,82 144,68 Q100,60 56,68 Z" fill="#451a03" />
        {/* Gold 5-Pointed Imperial Star */}
        <polygon points="100,44 102,50 108,50 103,54 105,60 100,56 95,60 97,54 92,50 98,50" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
      </svg>
    );
  };

  const isNeko = portraitKey.includes('neko');
  const isQueen = portraitKey === 'neko_queen';

  return (
    <div
      className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 shadow-2xl bg-slate-950 flex items-center justify-center ${sizeClasses} ${className}`}
      style={{ borderColor: accentColor }}
    >
      {/* Dynamic Commander Character Art */}
      {isNeko && renderNekoArc(isQueen)}
      {!isNeko && portraitKey.includes('allied') && renderAlliedGeneral()}
      {!isNeko && portraitKey.includes('german') && renderGermanCommander()}
      {!isNeko && (portraitKey.includes('us') || portraitKey.includes('modern')) && renderModernUS()}
      {!isNeko && portraitKey.includes('japan') && renderJapanCommander()}
      {!isNeko && (portraitKey.includes('british') || portraitKey.includes('royal')) && renderBritishCommander()}
      {!isNeko &&
        !portraitKey.includes('allied') &&
        !portraitKey.includes('german') &&
        !portraitKey.includes('us') &&
        !portraitKey.includes('modern') &&
        !portraitKey.includes('japan') &&
        !portraitKey.includes('british') &&
        !portraitKey.includes('royal') &&
        renderAlliedGeneral()}

      {/* Holographic Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.45)_51%)] [background-size:100%_4px] pointer-events-none opacity-40" />

      {/* Sweeping Radar Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent translate-y-[-100%] animate-[scan_3.5s_ease-in-out_infinite] pointer-events-none" />

      {/* Live Audio / Speaking Indicator */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/20">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isSpeaking ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
          }`}
        />
        <span className="text-[8px] font-mono font-bold text-slate-200">
          {isSpeaking ? 'REC' : 'LIVE'}
        </span>
      </div>

      {/* Neko Paw Accent Stamp */}
      {isNeko && (
        <div className="absolute top-1.5 right-1.5 text-pink-400 text-[10px] font-black opacity-85 select-none pointer-events-none">
          🐾
        </div>
      )}
    </div>
  );
};
