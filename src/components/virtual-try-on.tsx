"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Виртуальная примерка очков. Современный 6DoF-подход:
 *
 *   камера (getUserMedia)
 *      ↓ video отзеркален CSS-ом (scaleX(-1))
 *   MediaPipe FaceLandmarker (478 точек + facialTransformationMatrixes)
 *      ↓ выдаёт 4×4 матрицу позы головы (yaw/pitch/roll + translation)
 *   <img> с PNG оправы
 *      ↓ позиционируется + поворачивается через CSS `transform` (translate3d + rotate3d)
 *   GPU compositor (hardware accelerated)
 *
 * Почему не canvas.drawImage с rotate:
 *  • Canvas 2D даёт только roll (вращение в плоскости экрана). Поворот головы
 *    в стороны (yaw) и наклон вперёд-назад (pitch) — невозможны.
 *  • CSS 3D transform на <img> делает true-perspective через GPU,
 *    плавнее (60+ fps на mobile) и без блюра при ресайзе.
 *
 * Зачем выходная матрица MediaPipe:
 *  • Точно как у Snapchat / Spectacles / Cubitts: чтобы оправа поворачивалась
 *    при повороте головы. Без неё «примерка» — это плоский стикер.
 *
 * Лоу-пасс фильтр (lerp с α=0.5) убирает дрожь между кадрами без заметного
 * лага. Альтернатива (1€-filter) даёт чуть лучше, но сложнее в коде.
 */

type Props = {
  /** URL прозрачного PNG оправы (анфас, ширина ~1500px). */
  overlaySrc: string;
  /** Название модели — для подписи в модалке. */
  productTitle: string;
  /** Колбэк закрытия. */
  onClose: () => void;
};

// Индексы из 478-точечной схемы Face Landmarker.
// https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

type Smooth = {
  x: number;
  y: number;
  scale: number;
  rx: number;
  ry: number;
  rz: number;
  init: boolean;
};

type DetectResult = {
  faceLandmarks: { x: number; y: number; z: number }[][];
  facialTransformationMatrixes?: { data: number[] }[];
};

type Landmarker = {
  detectForVideo: (v: HTMLVideoElement, ts: number) => DetectResult;
  close?: () => void;
};

export function VirtualTryOn({ overlaySrc, productTitle, onClose }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLImageElement | null>(null);
  const landmarkerRef = useRef<Landmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothRef = useRef<Smooth>({
    x: 0,
    y: 0,
    scale: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    init: false,
  });

  const [status, setStatus] = useState<
    "loading" | "ready" | "no-camera" | "no-face" | "error"
  >("loading");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ---- Esc / lock body scroll ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // ---- Render loop ----
  const tick = useCallback(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    const lm = landmarkerRef.current;

    if (!video || !stage || !overlay || !lm || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const w = stage.clientWidth;
    const h = stage.clientHeight;

    let result: DetectResult;
    try {
      result = lm.detectForVideo(video, performance.now());
    } catch (e) {
      // Иногда detectForVideo бросает, если video размер изменился — просто
      // пропускаем кадр.
      void e;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const faces = result.faceLandmarks;
    if (!faces || faces.length === 0) {
      overlay.style.opacity = "0";
      setStatus((s) => (s === "ready" ? "no-face" : s));
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    setStatus("ready");

    const f = faces[0];
    // X отзеркаливаем — видео показано с scaleX(-1).
    const lx = (1 - f[LEFT_EYE_OUTER].x) * w;
    const ly = f[LEFT_EYE_OUTER].y * h;
    const rx = (1 - f[RIGHT_EYE_OUTER].x) * w;
    const ry = f[RIGHT_EYE_OUTER].y * h;

    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2;
    const eyeDist = Math.hypot(rx - lx, ry - ly);

    // Ширина оправы = 1.5 × расстояние между внешними углами глаз.
    // Это стандартная пропорция в оптике (PD/«междузрачковое» × 1.45–1.55).
    const overlayW = eyeDist * 1.5;
    const aspect = overlay.naturalHeight / overlay.naturalWidth || 0.32;

    // 2D-roll из линии глаз — точнее, чем извлекать roll из матрицы при
    // зеркалировании.
    const roll = Math.atan2(ry - ly, rx - lx);

    // 3D-углы из transformation matrix (column-major 4×4 от MediaPipe).
    // Yaw (поворот головы влево-вправо) и pitch (кивок) — позволяют оправе
    // следовать за поворотами головы, а не «прилипать» плоско ко лбу.
    const M = result.facialTransformationMatrixes?.[0]?.data;
    let yaw = 0;
    let pitch = 0;
    if (M && M.length === 16) {
      // Mirror yaw — видео зеркальное.
      yaw = -Math.atan2(M[2], M[10]);
      pitch = Math.atan2(-M[6], Math.hypot(M[2], M[10]));
      // Limit, чтобы при сильном повороте оправа не «уплывала».
      yaw = Math.max(-0.9, Math.min(0.9, yaw));
      pitch = Math.max(-0.7, Math.min(0.7, pitch));
    }

    // Lowpass smoothing — убирает дрожь.
    const s = smoothRef.current;
    const a = s.init ? 0.5 : 1;
    s.x += (cx - s.x) * a;
    s.y += (cy - s.y) * a;
    s.scale += (overlayW - s.scale) * a;
    s.rz += (roll - s.rz) * a;
    s.ry += (yaw - s.ry) * a;
    s.rx += (pitch - s.rx) * a;
    s.init = true;

    const sh = s.scale * aspect;
    // Чуть выше середины глаз — переносица «садит» оправу.
    const yShift = -sh * 0.07;

    overlay.style.width = `${s.scale}px`;
    overlay.style.height = `${sh}px`;
    overlay.style.transform =
      `translate3d(${s.x - s.scale / 2}px, ${s.y - sh / 2 + yShift}px, 0)` +
      ` rotateZ(${s.rz}rad) rotateY(${s.ry}rad) rotateX(${s.rx}rad)`;
    overlay.style.opacity = "1";

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ---- Init камеры + модели ----
  const startCamera = useCallback(async () => {
    setStatus("loading");
    setErrMsg(null);

    // 1. Камера первым шагом — если откажут, нет смысла качать 12МБ модели.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e) {
      const err = e as Error;
      console.error("[try-on] camera", err);
      if (err.name === "NotAllowedError") {
        setStatus("no-camera");
        setErrMsg(
          "Доступ к камере запрещён. Разрешите камеру в настройках браузера и обновите страницу.",
        );
      } else if (err.name === "NotFoundError") {
        setStatus("no-camera");
        setErrMsg("Камера не найдена. Подключите устройство с камерой.");
      } else {
        setStatus("error");
        setErrMsg(err.message || "Не удалось получить доступ к камере");
      }
      return;
    }

    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch (e) {
      // Autoplay policy в Safari может ругнуться, но playsInline+muted решает
      void e;
    }

    // 2. MediaPipe — ленивая загрузка.
    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      // WASM с того же CDN, что и npm-пакет — версии должны совпадать.
      const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      const landmarker = await FaceLandmarker.createFromOptions(resolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: false,
      });
      landmarkerRef.current = landmarker as unknown as Landmarker;
      setStatus("ready");
      tick();
    } catch (e) {
      const err = e as Error;
      console.error("[try-on] mediapipe", err);
      setStatus("error");
      setErrMsg(
        err.message ||
          "Не удалось загрузить модель распознавания лица. Проверьте интернет.",
      );
    }
  }, [tick]);

  // ---- Auto-start + cleanup ----
  useEffect(() => {
    startCamera();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      const stream = v?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close?.();
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

      <div className="vto__stage" ref={stageRef}>
        <video
          ref={videoRef}
          className="vto__video vto__video--live"
          playsInline
          muted
          autoPlay
        />
        <img
          ref={overlayRef}
          src={overlaySrc}
          alt=""
          className="vto__overlay"
          crossOrigin="anonymous"
          draggable={false}
        />

        {status !== "ready" ? (
          <div className="vto__status">
            {status === "loading" && (
              <>
                <span className="vto__spinner" aria-hidden />
                <span>Загружаем камеру и модель…</span>
                <small
                  style={{
                    opacity: 0.6,
                    marginTop: 6,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                  }}
                >
                  Первый запуск — до 5 секунд (модель кешируется)
                </small>
              </>
            )}
            {status === "no-camera" && (
              <>
                <span style={{ fontSize: 15, marginBottom: 4 }}>
                  Нет доступа к камере
                </span>
                {errMsg ? (
                  <small
                    style={{
                      opacity: 0.75,
                      maxWidth: 320,
                      lineHeight: 1.5,
                      fontSize: 12,
                    }}
                  >
                    {errMsg}
                  </small>
                ) : null}
                <button
                  type="button"
                  className="vto__retry"
                  onClick={() => startCamera()}
                >
                  Попробовать снова
                </button>
              </>
            )}
            {status === "no-face" && (
              <>
                <span>Покажите лицо в камеру</span>
                <small
                  style={{
                    opacity: 0.7,
                    marginTop: 6,
                    fontSize: 11,
                    letterSpacing: "0.04em",
                  }}
                >
                  Лицо должно быть в кадре целиком и хорошо освещено
                </small>
              </>
            )}
            {status === "error" && (
              <>
                <span style={{ fontSize: 15 }}>
                  {errMsg ?? "Не удалось запустить примерку"}
                </span>
                <button
                  type="button"
                  className="vto__retry"
                  onClick={() => startCamera()}
                >
                  Попробовать снова
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="vto__caption">
        Виртуальная примерка · <strong>{productTitle}</strong>
      </div>
      <div className="vto__hint">
        Поверните голову — оправа повторит движение
      </div>
    </div>
  );
}
