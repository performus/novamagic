/**
 * Раскладка кластеров фото-ингредиентов в карточках B4.
 * Позиции (%) вычислены из координат узлов 114:48–57 относительно
 * bounding-box кластера каждой карточки. ar = ширина/высота bbox.
 * Порядок в массиве = порядок отрисовки (последний — сверху).
 */
export interface ClusterImg {
  src: string
  left: number
  top: number
  width: number
}

export interface Cluster {
  ar: number
  imgs: ClusterImg[]
}

export const CLUSTERS: Record<string, Cluster> = {
  // bbox 390×449
  start: {
    ar: 390 / 449,
    imgs: [
      { src: '/notes/start-1.png', left: 0, top: 0, width: 100 }, // 114:48 лимон
      { src: '/notes/start-2.png', left: 5.6, top: 47.7, width: 64.6 }, // 114:50 шафран
    ],
  },
  // bbox 331×413
  heart: {
    ar: 331 / 413,
    imgs: [
      { src: '/notes/heart-2.png', left: 4.5, top: 5.1, width: 52.9 }, // 114:49
      { src: '/notes/heart-1.png', left: 4.5, top: 0, width: 95.5 }, // 114:51 анис/дерево
      { src: '/notes/heart-3.png', left: 46.5, top: 60.0, width: 40.2 }, // 114:52
      { src: '/notes/heart-4.png', left: 18.1, top: 74.8, width: 37.2 }, // 114:53 лепестки
      { src: '/notes/heart-5.png', left: 0, top: 51.3, width: 41.1 }, // 114:54
    ],
  },
  // bbox 420×419
  final: {
    ar: 420 / 419,
    imgs: [
      { src: '/notes/final-3.png', left: 24.8, top: 46.5, width: 66.9 }, // 114:55
      { src: '/notes/final-1.png', left: 33.1, top: 0, width: 66.9 }, // 114:56 смола
      { src: '/notes/final-2.png', left: 0, top: 14.8, width: 62.1 }, // 114:57 дерево
    ],
  },
}
