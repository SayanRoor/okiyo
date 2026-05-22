"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Виртуальная примерка очков — 6DoF трекинг через MediaPipe Face Landmarker
 * + рендер оправы как `<img>` с CSS 3D transform.
 *
 * Стек:
 *   getUserMedia → video (mirrored via scaleX(-1))
 *   MediaPipe FaceLandmarker (478 точек + facialTransformationMatrixes)
 *     → выдаёт 4×4 матрицу позы головы (yaw/pitch/roll)
 *   <img> с PNG оправы
 *     → translate3d + rotateZ/Y/X через GPU compositor
 *
 * UX:
 *   Внизу — горизонтальная карусель всех моделей с VTO.
 *   Клик по превью мгновенно меняет оправу, MediaPipe не пересоздаётся.
 *   Пользователь может «примерить» весь каталог не выходя из модалки —
 *   как у Warby Parker / Cubitts / Ace & Tate.
 */

export type VtoFrame = {
  id: number | string;
  slug: string;
  title: string;
  /** URL прозрачного PNG оправы. */
  overlaySrc: string;
  /** Превью для боковой карусели (mainImage товара). */
  thumbSrc?: string | null;
  /** Цена для подписи. */
  price?: number | null;
};

type Props = {
  /** Все модели, между которыми можно переключаться. */
  frames: VtoFrame[];
  /** Какую модель показать первой при открытии. */
  initialId?: number | string;
  /** Колбэк закрытия. */
  onClose: () => void;
};

// Индексы из 478-точечной схемы MediaPipe Face Landmarker.
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

function formatPriceKz(p?: number | null): string | null {
  if (typeof p !== "number") return null;
  return new Intl.NumberFormat("ru-KZ").format(p) + " ₸";
}

export function VirtualTryOn({ frames, initialId, onClose }: Props) {
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

  // Активный фрейм — состояние модалки.
  const [currentId, setCurrentId] = useState<number | string>(
    initialId ?? frames[0]?.id,
  );
  const current = useMemo(
    () => frames.find((f) => f.id === currentId) ?? frames[0],
    [frames, currentId],
  );

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
    const lx = (1 - f[LEFT_EYE_OUTER].x) * w;
    const ly = f[LEFT_EYE_OUTER].y * h;
    const rx = (1 - f[RIGHT_EYE_OUTER].x) * w;
    const ry = f[RIGHT_EYE_OUTER].y * h;

    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2;
    const eyeDist = Math.hypot(rx - lx, ry - ly);

    const overlayW = eyeDist * 1.5;
    const aspect = overlay.naturalHeight / overlay.naturalWidth || 0.32;

    const roll = Math.atan2(ry - ly, rx - lx);

    const M = result.facialTransformationMatrixes?.[0]?.data;
    let yaw = 0;
    let pitch = 0;
    if (M && M.length === 16) {
      yaw = -Math.atan2(M[2], M[10]);
      pitch = Math.atan2(-M[6], Math.hypot(M[2], M[10]));
      yaw = Math.max(-0.9, Math.min(0.9, yaw));
      pitch = Math.max(-0.7, Math.min(0.7, pitch));
    }

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
      void e;
    }

    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
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

  // ---- Смена фрейма: ребутимся в плавный «крутой» переход через короткий fade ----
  const switchFrame = useCallback(
    (id: number | string) => {
      if (id === currentId) return;
      setCurrentId(id);
      // Сбрасываем «scale» в smoothRef, чтобы при разной aspect ratio оправа
      // пересчиталась с нуля без рывка между размерами.
      const overlay = overlayRef.current;
      if (overlay) overlay.style.opacity = "0";
    },
    [currentId],
  );

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
          key={current?.id}
          src={current?.overlaySrc}
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

      {/* Капшен — название текущей модели + цена */}
      <div className="vto__caption">
        <strong>{current?.title}</strong>
        {formatPriceKz(current?.price) ? (
          <span className="vto__caption-price">
            {formatPriceKz(current?.price)}
          </span>
        ) : null}
      </div>

      {/* Карусель моделей — клик меняет оправу мгновенно */}
      {frames.length > 1 ? (
        <div className="vto__rail" role="tablist" aria-label="Выбор модели">
          {frames.map((f) => {
            const active = f.id === currentId;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Примерить ${f.title}`}
                title={f.title}
                className={`vto__thumb${active ? " vto__thumb--active" : ""}`}
                onClick={() => switchFrame(f.id)}
              >
                {f.thumbSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={f.thumbSrc} alt="" loading="lazy" />
                ) : (
                  <span className="vto__thumb-fallback">
                    {f.title.slice(0, 2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="vto__hint">
          Поверните голову — оправа повторит движение
        </div>
      )}

      {/* Ссылка «купить эту модель» — открыть страницу товара */}
      {current ? (
        <a
          href={`/catalog/${current.slug}`}
          className="vto__buy"
          onClick={onClose}
        >
          Перейти к модели →
        </a>
      ) : null}
    </div>
  );
}
