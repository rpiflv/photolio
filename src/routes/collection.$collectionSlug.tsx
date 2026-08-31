import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import PhotoGrid from '../components/PhotoGrid'
import { getPhotosByCollectionSlug } from '../data/photos'

export const Route = createFileRoute('/collection/$collectionSlug')({
  component: CollectionGalleryPage,
})

function CollectionGalleryPage() {
  const { collectionSlug } = Route.useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['collection', collectionSlug],
    queryFn: () => getPhotosByCollectionSlug(collectionSlug),
    staleTime: 1000 * 60 * 5,
  })

  if (!isLoading && !data) {
    throw notFound()
  }

  return (
    <div className="min-h-screen bg-[#f6f4f2] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.08em] text-neutral-900 mb-4">
            {data?.collection.name || 'Collection'}
          </h1>
          {data?.collection.description && (
            <p className="text-base md:text-lg text-neutral-500">
              {data.collection.description}
            </p>
          )}
        </div>

        {data && data.photos.length > 0 ? (
          <PhotoGrid photos={data.photos} categoryId="all" />
        ) : !isLoading ? (
          <div className="text-center text-neutral-500">
            <p className="text-lg">No photos in this collection yet.</p>
            <Link to="/" className="inline-block mt-4 text-neutral-700 underline">
              Back to home
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
