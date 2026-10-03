import Phaser from 'phaser';

/**
 * Title scene shown before the game: waits for the first click or tap, enters fullscreen
 * and starts the music.
 */
export default class TapScene extends Phaser.Scene {
  #isMobile = false;
  #tapText: Phaser.GameObjects.Text | null = null;
  #music: HTMLAudioElement | null = null;

  constructor() {
    super({ key: 'TapScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.#startMusic();
    this.#isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.#tapText) this.#centerTapText(gameSize.width, gameSize.height);
    });
    this.#showTapToStart();
  }

  #showTapToStart(): void {
    const { width, height } = this.scale;
    const label = this.#isMobile ? 'TOCA PARA JUGAR' : 'CLICK PARA JUGAR';
    this.#tapText = this.add
      .text(0, 0, label, {
        fontSize: '26px',
        color: '#ffffff',
        fontFamily: 'courier, sans-serif',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.#centerTapText(width, height);
    this.tweens.add({
      targets: this.#tapText,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    const trigger = (): void => {
      document.removeEventListener('touchend', trigger);
      document.removeEventListener('click', trigger);
      this.#enterFullscreen();
    };
    document.addEventListener('touchend', trigger);
    document.addEventListener('click', trigger);
  }

  #centerTapText(w: number, h: number): void {
    this.#tapText?.setPosition(w / 2, h / 2);
  }

  #startMusic(): void {
    try {
      const music = new Audio('music/tap-back.mp3');
      music.loop = true;
      void music.play().catch(() => {});
      this.#music = music;
    } catch {
      this.#music = null;
    }
  }

  #stopMusic(): void {
    if (!this.#music) return;
    try {
      this.#music.pause();
      this.#music.currentTime = 0;
    } catch {}
    this.#music = null;
  }

  #enterFullscreen(): void {
    if (this.#tapText) {
      this.#tapText.destroy();
      this.#tapText = null;
    }
    const afterFullscreen = (): void => {
      if (this.#isMobile) {
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (orientation: string) => Promise<void>;
          };
          void orientation.lock?.('landscape').catch(() => {});
        } catch {}
      }
      let started = false;
      const startGame = (): void => {
        if (started) return;
        started = true;
        this.#stopMusic();
        this.scene.start('GameScene');
      };
      this.sys.game.events.once('resume', startGame);
      window.setTimeout(() => {
        this.sys.game.resume();
        startGame();
      }, 300);
    };
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
    };
    const request =
      el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? el.mozRequestFullScreen?.();
    if (request !== undefined) {
      request.then(() => afterFullscreen()).catch(() => afterFullscreen());
    } else {
      afterFullscreen();
    }
  }
}
