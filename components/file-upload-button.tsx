'use client'

import { useRef, useState } from 'react'

import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Button } from './ui/button'

const allowedImageTypes = ['image/png', 'image/jpeg']
const allowedOtherTypes = ['application/pdf']

const isAllowedFileType = (file: File) =>
  allowedImageTypes.includes(file.type) || allowedOtherTypes.includes(file.type)

export function FileUploadButton({
  onFileSelect
}: {
  onFileSelect: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files).slice(0, 3)

    const validFiles = fileArray.filter(isAllowedFileType)
    const rejected = fileArray.filter(f => !isAllowedFileType(f))

    if (rejected.length > 0) {
      toast.error(
        'Some files were not accepted: ' + rejected.map(f => f.name).join(', ')
      )
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={e => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-full',
        isDragging && 'ring-2 ring-red-700/40 ring-offset-2 ring-offset-background'
      )}
      title="Drag and drop or click to upload"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        hidden
        multiple
        onChange={e => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <Button
        variant="outline"
        size="icon"
        className="rounded-full border-input bg-background text-red-700 shadow-none hover:border-red-700/40 hover:bg-red-700/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <Icon icon="solar:paperclip-bold" className="size-[18px]" />
      </Button>
    </div>
  )
}
