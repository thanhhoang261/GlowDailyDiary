import React from 'react';

export const BUBU_AVATARS: { id: string; label: string; src: string; isGif?: boolean }[] = [
  { id: 'bubu-peace', label: 'Bubu Peace', src: '/bubu-dudu/bubu-peace.png' },
  { id: 'dudu-rose', label: 'Dudu Rose', src: '/bubu-dudu/dudu-rose.png' },
  { id: 'bubu-dudu-dance', label: 'Bubu & Dudu Dance', src: '/bubu-dudu/bubu-dudu-dance.png' },
  { id: 'bubu-swing', label: 'Bubu Swing', src: '/bubu-dudu/bubu-swing.png' },
  { id: 'dudu-swing', label: 'Dudu Swing', src: '/bubu-dudu/dudu-swing.png' },
  { id: 'bubu-sushi', label: 'Bubu Sushi', src: '/bubu-dudu/bubu-sushi.png' },
  { id: 'bubu-dudu-snuggle', label: 'Bubu & Dudu Snuggle', src: '/bubu-dudu/bubu-dudu-snuggle.gif', isGif: true },
  { id: 'bubu-dudu-kiss', label: 'Bubu & Dudu Kiss', src: '/bubu-dudu/bubu-dudu-kiss.gif', isGif: true },
];

export const getBubuAvatarSrc = (avatarId?: string | null): string | null => {
  if (!avatarId) return null;
  if (avatarId.startsWith('/bubu-dudu/') || avatarId.startsWith('http')) return avatarId;
  const match = BUBU_AVATARS.find((a) => a.id === avatarId);
  return match ? match.src : null;
};

interface BubuAvatarProps {
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-sm',
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl',
  xl: 'w-20 h-20 text-4xl',
};

export const BubuAvatar: React.FC<BubuAvatarProps> = ({
  avatar,
  size = 'md',
  className = '',
  alt = 'Bubu & Dudu Avatar',
}) => {
  const imgSrc = getBubuAvatarSrc(avatar);
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={`${sizeClasses} object-contain rounded-2xl drop-shadow-xs ${className}`}
      />
    );
  }

  // Fallback to emoji or default Bubu
  if (avatar && avatar.length <= 4) {
    return (
      <span
        className={`${sizeClasses} flex items-center justify-center select-none ${className}`}
      >
        {avatar}
      </span>
    );
  }

  // Default to Bubu winking peace
  return (
    <img
      src="/bubu-dudu/bubu-peace.png"
      alt="Bubu"
      className={`${sizeClasses} object-contain rounded-2xl drop-shadow-xs ${className}`}
    />
  );
};
