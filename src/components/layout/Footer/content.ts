/** B10 — Footer. Контент для i18n (SPEC §10). RU-этап. */
export const footerContent = {
  wordmarkAlt: 'NOVAMAGIC',
  /** Кнопки-маркетплейсы — внешние ссылки, новая вкладка (SPEC §10) */
  actions: [
    { label: 'Заказать на OZON', href: 'https://ozon.ru/t/C6s3tyi' }, // узлы 116:25/27
    { label: 'Заказать на YANDEX', href: '#' }, // узлы 116:26/29 — TODO: реальная ссылка Яндекса
  ],
  /** Реквизиты (узел 116:28) */
  legal: 'ООО «НОВАМЭДЖИК»  \\  435534534',
} as const
