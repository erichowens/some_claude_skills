import React from 'react';
import './styles.css';

type EasterEggProps = {
  type: 'hadouken' | 'moon-tiara' | 'energize';
  visible: boolean;
};

export default function KonamiEasterEgg({ type, visible }: EasterEggProps): JSX.Element {
  if (!visible) return null;

  return (
    <div className={`konami-egg konami-egg--${type}`}>
      {type === 'hadouken' && (
        <>
          <div className="konami-content">
            <div className="hadouken-hands">👊</div>
            <div className="konami-text">HADOUKEN!</div>
          </div>
          <div className="hadouken-projectile">💥</div>
        </>
      )}
      {type === 'moon-tiara' && (
        <>
          <div className="konami-content">
            <div className="konami-text">MOON TIARA ACTION!</div>
          </div>
          <div className="flying-tiara">👑</div>
        </>
      )}
      {type === 'energize' && (
        <>
          <div className="konami-content">
            <div className="energize-hand">🖖</div>
            <div className="konami-text">ENERGIZE!</div>
          </div>
          <div className="energize-beam"></div>
          <div className="energize-sparkles">
            <span>✨</span>
            <span>✨</span>
            <span>✨</span>
            <span>✨</span>
            <span>✨</span>
          </div>
        </>
      )}
    </div>
  );
}
