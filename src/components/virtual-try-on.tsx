"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Виртуальная примерка очков через камеру.
 *
 * Стек:
 *  - WebRTC getUserMedia → видеопоток с фронтальной камеры
 *  - MediaPipe FaceLandmarker (Google, open-source) → 468 точек лица
 *  - <canvas> поверх <video>: рисуем оправу очков с правильным
 *    масштабом, позицией и углом наклона головы
 *
 * Загрузка модели MediaPipe идёт с CDN при первом открытии модалки,
 * чтобы не утяжелять initial bundle страницы товара.
 */

type Props = {
  /** URL прозрачного PNG оправы (вид анфас). */
  overlaySrc: string;
  /** Название модели — для подписи в модалке. */
  productTitle: string;
  /** Колбэк закрытия. */
  onClose: () => void;
};

// Индексы ключевых landmark'ов MediaPipe Face Landmarker (468-точечная схема).
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_BRIDGE = 168;

export function VirtualTryOn({ overlaySrc, productTitle, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<
    "loading" | "ready" | "no-camera" | "no-face" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- Esc/click-outside ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // ---- Загрузка overlay (PNG) ----
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = overlaySrc;
    img.onload = () => {
      overlayImgRef.current = img;
    };
    img.onerror = () => {
      setStatus("error");
      setErrorMsg("Не удалось загрузить изображение очков");
    };
  }, [overlaySrc]);

  // ---- Init MediaPipe + камеры ----
  const startCamera = useCallback(async () => {
    try {
      setStatus("loading");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      // Динамический import — не утяжеляем initial bundle.
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );
      const landmarker = await FaceLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: false,
        outputFaceBlendshapes: false,
      });
      landmarkerRef.current = landmarker;
      setStatus("ready");
      tick();
    } catch (e) {
      const err = e as Error;
      console.error("[try-on]", err);
      if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
        setStatus("no-camera");
        setErrorMsg("Доступ к камере не разрешён");
      } else {
        setStatus("error");
        setErrorMsg(err.message || "Не удалось включить примерку");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Render loop ----
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayImgRef.current;
    const landmarker = landmarkerRef.current as
      | { detectForVideo: (v: HTMLVideoElement, ts: number) => {
          faceLandmarks: { x: number; y: number; z: number }[][];
        } }
      | null;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Сайз канвас по видео
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Зеркалим — пользователь видит себя «как в зеркале»
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const result = landmarker.detectForVideo(video, performance.now());
    const faces = result.faceLandmarks;
    if (!faces || faces.length === 0) {
      setStatus((s) => (s === "ready" ? "no-face" : s));
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    setStatus("ready");

    const lm = faces[0];
    // Зеркальные X-координаты (т.к. видео отзеркалено)
    const lx = (1 - lm[LEFT_EYE_OUTER].x) * canvas.width;
    const ly = lm[LEFT_EYE_OUTER].y * canvas.height;
    const rx = (1 - lm[RIGHT_EYE_OUTER].x) * canvas.width;
    const ry = lm[RIGHT_EYE_OUTER].y * canvas.height;
    const nx = (1 - lm[NOSE_BRIDGE].x) * canvas.width;
    const ny = lm[NOSE_BRIDGE].y * canvas.height;

    // Ширина оправы = расстояние между внешними углами глаз × 1.45
    // (типичная пропорция: оправа шире глаз на 40–50%)
    const eyeDist = Math.hypot(rx - lx, ry - ly);
    const overlayW = eyeDist * 1.45;
    const aspect = overlay
      ? overlay.naturalHeight / overlay.naturalWidth
      : 0.35;
    const overlayH = overlayW * aspect;
    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2 - overlayH * 0.05; // чуть выше середины глаз
    const angle = Math.atan2(ry - ly, rx - lx);

    if (overlay) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.drawImage(overlay, -overlayW / 2, -overlayH / 2, overlayW, overlayH);
      ctx.restore();
    } else {
      // Если PNG не задан — рисуем условный rect (для отладки/демо)
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeRect(-overlayW / 2, -overlayH / 2, overlayW, overlayH);
      ctx.restore();
    }

    // nose dot — для дебага можно включить
    void nx;
    void ny;

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ---- Auto-start ----
  useEffect(() => {
    startCamera();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      const lm = landmarkerRef.current as { close?: () => void } | null;
      lm?.close?.();
    };
  }, [startCamera]);

  return (
    <div
      className="vto"
      role="dialog"
      aria-modal
      aria-label="Виртуальная примерка"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="vto__close"
        onClick={onClose}
        aria-label="Закрыть примерку"
      >
        ✕
      </button>

      <div className="vto__stage">
        <video ref={videoRef} className="vto__video" playsInline muted />
        <canvas ref={canvasRef} className="vto__canvas" />

        {status !== "ready" ? (
          <div className="vto__status">
            {status === "loading" && (
              <>
                <span className="vto__spinner" aria-hidden />
                <span>Включаем камеру…</span>
              </>
            )}
            {status === "no-camera" && (
              <>
                <span>Нужен доступ к камере</span>
                <small style={{ opacity: 0.7, marginTop: 8 }}>
                  Разрешите камеру в настройках браузера и обновите страницу.
                </small>
              </>
            )}
            {status === "no-face" && <span>Покажите лицо в камеру</span>}
            {status === "error" && (
              <span>{errorMsg ?? "Не удалось запустить примерку"}</span>
            )}
          </div>
        ) : null}
      </div>

      <div className="vto__caption">
        Виртуальная примерка · <strong>{productTitle}</strong>
      </div>
    </div>
  );
}
