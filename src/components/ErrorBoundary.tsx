import React from 'react'
import Button from './ui/Button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm max-w-md mx-auto">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-slate-700 font-semibold">Có lỗi xảy ra</p>
          <p className="text-sm text-slate-500 mt-2">{this.state.error?.message || 'Lỗi không xác định'}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button 
              type="button" 
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              ↻ Tải lại trang
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => window.history.back()}
            >
              ← Quay lại
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
