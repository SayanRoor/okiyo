import Image from "next/image";

import { mediaUrl } from "@/lib/format";

export type Review = {
  id: number | string;
  authorName: string;
  rating: number;
  text: string;
  city?: string | null;
  verified?: boolean | null;
  photo?: unknown;
};

/**
 * Блок отзывов. Используется на главной (карусель/grid из 6-8 общих) и под
 * товаром (только отзывы про эту модель + общие про бренд).
 *
 * Дизайн — без фоновых блоков, без drop-shadow: чистая текстовая ткань с
 * тонкими разделителями, как в премиум-журналах (Aesop, Toteme). Звёзды
 * нарисованы SVG-полугалочками — глифы (★) визуально шумные.
 */
export function ReviewsBlock({
  reviews,
  title = "Что говорят клиенты",
  eyebrow = "Отзывы",
  variant = "grid",
}: {
  reviews: Review[];
  title?: string;
  eyebrow?: string;
  variant?: "grid" | "compact";
}) {
  if (reviews.length === 0) return null;

  const avg =
    reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;

  return (
    <section className="okiyo-reviews">
      <div className="okiyo-reviews__head">
        <div>
          <div className="eyebrow mb-3">{eyebrow}</div>
          <h2 className="okiyo-reviews__title">{title}</h2>
        </div>
        <div className="okiyo-reviews__summary">
          <Stars rating={avg} large />
          <div className="okiyo-reviews__summary-meta">
            <span className="okiyo-reviews__avg">{avg.toFixed(1)}</span>
            <span className="okiyo-reviews__count">
              {reviews.length}{" "}
              {pluralReviews(reviews.length)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={
          variant === "grid"
            ? "okiyo-reviews__grid"
            : "okiyo-reviews__list"
        }
      >
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const photoUrl = mediaUrl(review.photo, "thumbnail");
  return (
    <article className="okiyo-review-card">
      <Stars rating={Number(review.rating) || 0} />
      <p className="okiyo-review-card__text">«{review.text}»</p>
      <div className="okiyo-review-card__foot">
        {photoUrl ? (
          <div className="okiyo-review-card__avatar">
            <Image
              src={photoUrl}
              alt={review.authorName}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="okiyo-review-card__avatar okiyo-review-card__avatar--initial">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="okiyo-review-card__person">
          <span className="okiyo-review-card__name">
            {review.authorName}
            {review.verified ? (
              <span
                className="okiyo-review-card__verified"
                title="Подтверждённый покупатель"
                aria-label="Подтверждённый покупатель"
              >
                ✓
              </span>
            ) : null}
          </span>
          {review.city ? (
            <span className="okiyo-review-card__city">{review.city}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Stars({ rating, large }: { rating: number; large?: boolean }) {
  const full = Math.round(rating);
  return (
    <div
      className="okiyo-stars"
      aria-label={`Оценка ${rating.toFixed(1)} из 5`}
      data-size={large ? "large" : "default"}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden
          className={
            i < full ? "okiyo-stars__star is-full" : "okiyo-stars__star"
          }
        >
          <path
            d="M10 1.5l2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L10 14.97l-5.3 2.84 1.01-5.9L1.42 7.73l5.93-.86L10 1.5z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function pluralReviews(n: number): string {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "отзывов";
  if (last === 1) return "отзыв";
  if (last >= 2 && last <= 4) return "отзыва";
  return "отзывов";
}
