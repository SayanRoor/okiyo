/**
 * Полоса доверия под ценой товара. 4 быстрых иконки + текст,
 * закрывающих главные возражения покупателя:
 *  1. Качество (UV400 поляризация)
 *  2. Скорость (доставка в Алматы за 2 ч)
 *  3. Риск (возврат 14 дней по KZ-закону)
 *  4. Оплата (привычные KZ-способы)
 *
 * Такая «strip» стоит у всех топ-e-commerce (Mango, Cubitts, Lensfield) —
 * прямо в decision-zone, чтобы клиент не уходил гуглить «есть ли возврат».
 */
export function TrustStrip() {
  return (
    <div className="okiyo-trust-strip">
      <TrustItem icon={<UvIcon />} label="UV400 поляризация" />
      <TrustItem icon={<TruckIcon />} label="Алматы — 2 часа" />
      <TrustItem icon={<RefreshIcon />} label="Возврат 14 дней" />
      <TrustItem icon={<KaspiIcon />} label="Kaspi / Счёт" />
    </div>
  );
}

function TrustItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="okiyo-trust-strip__item">
      <span className="okiyo-trust-strip__icon" aria-hidden>
        {icon}
      </span>
      <span className="okiyo-trust-strip__label">{label}</span>
    </div>
  );
}

function UvIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  );
}

function KaspiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
