import { useEffect, useRef, useState } from 'react';
import './screenIntro.css';

const INTRO_VIDEO_SRC = '/intro/zoom-computer-screen.mp4';
const START_DELAY = 160;
const PLAYBACK_RATE = 1.22;
const HANDOFF_PLAYBACK_RATE = 1.48;
const HANDOFF_SOURCE_WINDOW = 1100;
const DEFAULT_SOURCE_VIDEO_DURATION = 8000;
const HANDOFF_DURATION = 720;
const SKIP_FADE_DURATION = 300;

function canPlayIntro() {
  if (typeof window === 'undefined') {
    return false;
  }

  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ScreenIntro() {
  const videoRef = useRef(null);
  const timersRef = useRef([]);
  const skippedRef = useRef(false);
  const skipIntroRef = useRef(() => {});
  const [isVisible, setIsVisible] = useState(canPlayIntro);
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };

    const finish = () => {
      videoRef.current?.pause();
      setIsVisible(false);
    };

    const startHandoff = () => {
      if (!skippedRef.current) {
        if (videoRef.current) {
          videoRef.current.playbackRate = HANDOFF_PLAYBACK_RATE;
        }
        setPhase('handoff');
      }
    };

    const scheduleHandoff = () => {
      const video = videoRef.current;
      const sourceDuration = Number.isFinite(video?.duration) && video.duration > 0
        ? video.duration * 1000
        : DEFAULT_SOURCE_VIDEO_DURATION;
      const handoffSourceWindow = Math.min(HANDOFF_SOURCE_WINDOW, sourceDuration * 0.32);
      const handoffStart = Math.max(
        1000,
        (sourceDuration - handoffSourceWindow) / PLAYBACK_RATE,
      );

      timersRef.current.push(window.setTimeout(startHandoff, handoffStart));
      timersRef.current.push(window.setTimeout(finish, handoffStart + HANDOFF_DURATION + 90));
    };

    const playIntro = () => {
      const video = videoRef.current;

      if (!video) {
        startHandoff();
        timersRef.current.push(window.setTimeout(finish, SKIP_FADE_DURATION));
        return;
      }

      video.playbackRate = PLAYBACK_RATE;
      setPhase('playing');
      scheduleHandoff();

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          startHandoff();
          timersRef.current.push(window.setTimeout(finish, SKIP_FADE_DURATION));
        });
      }
    };

    const skip = (event) => {
      if (skippedRef.current) {
        return;
      }

      skippedRef.current = true;
      event?.preventDefault();
      clearTimers();
      setPhase('skipping');
      timersRef.current.push(window.setTimeout(finish, SKIP_FADE_DURATION));
    };

    skippedRef.current = false;
    skipIntroRef.current = skip;

    window.addEventListener('keydown', skip);

    timersRef.current.push(window.setTimeout(playIntro, START_DELAY));

    return () => {
      clearTimers();
      window.removeEventListener('keydown', skip);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="screen-intro"
      data-phase={phase}
      onPointerDown={(event) => skipIntroRef.current(event)}
      onWheel={(event) => event.preventDefault()}
      style={{
        '--screen-intro-handoff-duration': `${HANDOFF_DURATION}ms`,
      }}
    >
      <video
        aria-hidden="true"
        className="screen-intro__video"
        disablePictureInPicture
        muted
        playsInline
        preload="auto"
        ref={videoRef}
        src={INTRO_VIDEO_SRC}
        onEnded={() => {
          setPhase('handoff');
          timersRef.current.push(window.setTimeout(() => setIsVisible(false), HANDOFF_DURATION));
        }}
      />
    </div>
  );
}

export default ScreenIntro;
