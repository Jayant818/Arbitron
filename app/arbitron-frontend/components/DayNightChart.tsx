import React from 'react';

type Props = Readonly<{
  gmVotes: bigint;
  gnVotes: bigint;
}>;

export function DayNightChart({ gmVotes, gnVotes }: Props) {
  const totalVotes = gmVotes + gnVotes;
  const gmPercentage = totalVotes === 0n ? 50 : Number(gmVotes * 100n / totalVotes);

  return (
    <div style={{
      position: 'relative',
      height: '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #ccc',
      marginBottom: '8px'
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/day-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'left center',
        clipPath: `inset(0 ${100 - gmPercentage}% 0 0)`,
        transition: 'clip-path 0.3s ease'
      }}>
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Votes for GM: {gmVotes.toString()}
        </div>
      </div>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/night-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        clipPath: `inset(0 0 0 ${gmPercentage}%)`,
        transition: 'clip-path 0.3s ease'
      }}>
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Votes for GN: {gnVotes.toString()}
        </div>
      </div>
    </div>
  );
} 