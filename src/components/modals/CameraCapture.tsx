import { useState, useRef, useEffect } from 'react'
import { X, Camera, Video as VideoIcon, Upload } from 'lucide-react'
import Button from '../ui/Button'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  mode: 'photo' | 'video'
}

export default function CameraCapture({ onCapture, onClose, mode }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: mode === 'video'
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể truy cập camera'
      setError(errorMessage)
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsStreaming(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        stopCamera()
        onClose()
      }
    }, 'image/jpeg', 0.95)
  }

  const startRecording = async () => {
    if (!videoRef.current?.srcObject) return

    try {
      const stream = videoRef.current.srcObject as MediaStream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        onCapture(file)
        stopCamera()
        onClose()
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi quay video'
      setError(errorMessage)
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onCapture(file)
      stopCamera()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === 'photo' ? '📸 Chụp ảnh' : '🎥 Quay video'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        {/* Camera preview */}
        <div className="relative bg-black">
          {error ? (
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-sm mb-4">❌ {error}</p>
                <p className="text-xs mb-4">Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept={mode === 'photo' ? 'image/*' : 'video/*'}
                    capture
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer inline-block">
                    Chọn từ thư viện
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover"
              onLoadedMetadata={() => setIsStreaming(true)}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        {isStreaming && !error && (
          <div className="p-4 border-t border-slate-200 flex flex-col gap-3">
            {mode === 'photo' ? (
              <button
                onClick={capturePhoto}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Camera size={20} /> Chụp ảnh
              </button>
            ) : (
              <>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <VideoIcon size={20} /> Bắt đầu quay
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition animate-pulse"
                  >
                    <VideoIcon size={20} /> Dừng quay
                  </button>
                )}
              </>
            )}

            <label className="w-full">
              <input
                type="file"
                accept={mode === 'photo' ? 'image/*' : 'video/*'}
                capture
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-2">
                <Upload size={20} /> Chọn từ thư viện
              </span>
            </label>

            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
