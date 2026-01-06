import { Photo } from '../data/photos'

interface PhotoGridProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo) => void
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => onPhotoClick?.(photo)}
        >
          <div className="aspect-square overflow-hidden">
            <img
              src={photo.src}
              alt={photo.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
            <p className="text-sm text-gray-600 capitalize">{photo.category}</p>
            {photo.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{photo.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}