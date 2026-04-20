/**
 * Nén ảnh sử dụng Canvas API
 * @param file - File ảnh cần nén
 * @param maxWidth - Chiều rộng tối đa (pixel)
 * @param maxHeight - Chiều cao tối đa (pixel)
 * @param quality - Chất lượng nén (0-1, mặc định 0.8)
 * @returns Promise<string> - Base64 DataURL của ảnh đã nén
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Tính toán kích thước mới để giữ tỉ lệ
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Vẽ ảnh lên canvas với kích thước mới
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Không thể lấy canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Chuyển đổi thành base64 với chất lượng được chỉ định
        const mimeType = file.type || 'image/jpeg'
        const compressedBase64 = canvas.toDataURL(mimeType, quality)
        resolve(compressedBase64)
      }

      img.onerror = () => {
        reject(new Error('Không thể load ảnh'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Không thể đọc ảnh'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Nén nhiều ảnh cùng một lúc
 * @param files - FileList hoặc mảng File
 * @param maxWidth - Chiều rộng tối đa (pixel)
 * @param maxHeight - Chiều cao tối đa (pixel)
 * @param quality - Chất lượng nén (0-1)
 * @returns Promise<string[]> - Mảng base64 DataURL của các ảnh đã nén
 */
export async function compressImages(
  files: FileList | File[],
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<string[]> {
  const fileArray = Array.from(files)
  const compressedImages = await Promise.all(
    fileArray.map((file) => {
      // Nếu là video, không nén, chỉ convert thành base64
      if (file.type.startsWith('video/')) {
        return convertFileToBase64(file)
      }
      // Nếu là ảnh, thực hiện nén
      return compressImage(file, maxWidth, maxHeight, quality)
    })
  )
  return compressedImages
}

/**
 * Chuyển đổi file thành base64 DataURL (dùng cho video hoặc file không nén)
 * @param file - File cần chuyển đổi
 * @returns Promise<string> - Base64 DataURL
 */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Không thể đọc file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Tính kích thước file (dùng để hiển thị thông tin)
 * @param bytes - Số byte
 * @returns string - Kích thước định dạng (KB, MB, etc.)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Tính kích thước base64 string (xấp xỉ)
 * @param base64String - Base64 string
 * @returns number - Kích thước tính bằng byte
 */
export function getBase64Size(base64String: string): number {
  return Math.ceil((base64String.length * 3) / 4)
}
