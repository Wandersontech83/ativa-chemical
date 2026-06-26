'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Camera, AlertCircle } from 'lucide-react'

interface BarcodeScannerProps {
  onRead: (chave: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onRead, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let codeReader: any = null
    let stream: MediaStream | null = null

    async function startScanner() {
      try {
        setScanning(true)
        const zxing = await import('@zxing/browser')
        const Reader = zxing.BrowserMultiFormatReader || (zxing as any).BrowserBarcodeReader
        codeReader = new Reader()

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream

          const result = await codeReader.decodeFromVideoElement(videoRef.current)
          const text = result.getText().replace(/\D/g, '')
          if (text.length === 44) {
            onRead(text)
          } else {
            setError('Código inválido. A chave de acesso deve ter 44 dígitos.')
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Permissão de câmera negada. Use o campo de digitação manual.')
        } else {
          setError('Câmera não disponível neste dispositivo.')
        }
      } finally {
        setScanning(false)
      }
    }

    startScanner()

    return () => {
      codeReader?.reset()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onRead])

  return (
    <div className="relative">
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Mira */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-24 border-2 border-secondary-400 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary-300 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary-300 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary-300 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary-300 rounded-br" />
            {scanning && (
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-secondary-400 animate-pulse" />
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center mt-2">
        Aponte a câmera para o código de barras da DANFE
      </p>
    </div>
  )
}
