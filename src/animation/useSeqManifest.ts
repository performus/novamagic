import { useEffect, useState } from 'react'
import { loadManifest, type SeqManifest } from './bottleFrames'

/** Читает manifest.json секвенции (frameCount + размеры) — компонент сам подхватит
 *  новые файлы при их замене. Возвращает null, пока манифест не загружен. */
export function useSeqManifest(base: string): SeqManifest | null {
  const [mf, setMf] = useState<SeqManifest | null>(null)
  useEffect(() => {
    let live = true
    loadManifest(base)
      .then((m) => {
        if (live) setMf(m)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [base])
  return mf
}
