import React from 'react';
import { useWinampSkin } from '../../hooks/useWinampSkin';
import styles from './styles.module.css';

interface SkinPickerProps {
  onClose?: () => void;
}

export default function SkinPicker({ onClose }: SkinPickerProps): JSX.Element {
  const { currentSkinId, setSkin, allSkins } = useWinampSkin();

  const handleSkinSelect = (skinId: string) => {
    setSkin(skinId);
    // Optional: close the picker after selection
    // if (onClose) onClose();
  };

  return (
    <div className={styles.skinPicker}>
      <div className={styles.header}>
        <h3 className={styles.title}>Choose Skin</h3>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <div className={styles.skinGrid}>
        {allSkins.map((skin) => (
          <button
            key={skin.id}
            className={`${styles.skinCard} ${currentSkinId === skin.id ? styles.active : ''}`}
            onClick={() => handleSkinSelect(skin.id)}
            style={{
              background: `linear-gradient(135deg, ${skin.colors.bgLight}, ${skin.colors.bgDark})`,
              borderColor: currentSkinId === skin.id ? skin.colors.accent : skin.colors.border,
            }}
          >
            <div className={styles.skinPreview}>
              <div
                className={styles.previewTitlebar}
                style={{ backgroundColor: skin.colors.titlebar }}
              />
              <div
                className={styles.previewDisplay}
                style={{
                  backgroundColor: skin.colors.displayBg,
                  color: skin.colors.displayText
                }}
              >
                <div
                  className={styles.previewVisualizer}
                  style={{ backgroundColor: skin.colors.visualizer }}
                />
              </div>
              <div className={styles.previewButtons}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={styles.previewButton}
                    style={{ backgroundColor: skin.colors.buttonBg }}
                  />
                ))}
              </div>
            </div>
            <div
              className={styles.skinInfo}
              style={{ color: skin.colors.text }}
            >
              <div className={styles.skinName}>{skin.name}</div>
              <div
                className={styles.skinDesc}
                style={{ color: skin.colors.textDim }}
              >
                {skin.description}
              </div>
            </div>
            {currentSkinId === skin.id && (
              <div
                className={styles.activeIndicator}
                style={{ backgroundColor: skin.colors.accent }}
              >
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
