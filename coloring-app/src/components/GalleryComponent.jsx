/**
 * Gallery Component for Coloring Book Creator
 * 
 * Image gallery with Firebase Firestore integration for user-generated content.
 * Evidence-based implementation following Firebase and React best practices:
 * - Firestore queries with user authentication
 * - Image grid with thumbnails and metadata
 * - Single and bulk delete functionality with confirmations
 * - Responsive design with loading and error states
 * - Real-time updates and offline support
 */

import React, { useState, useEffect, memo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc,
  writeBatch,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase-config.js';

const GalleryComponent = ({ user }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // 'single' or 'bulk'
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time listener for user's images with fallback strategies
  useEffect(() => {
    if (!user) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // SOLUTION: Progressive enhancement with fallback queries
    const setupGalleryListener = async () => {
      try {
        let imagesQuery;
        
        // STRATEGY 1: Try optimized query with composite index
        // Requires index: (userId ASC, createdAt DESC)
        try {
          imagesQuery = query(
            collection(db, 'user_images'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          // Test the query with a single document to check if index exists
          const testQuery = query(
            collection(db, 'user_images'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          // This will throw if index doesn't exist  
          await getDocs(testQuery);
          console.log('✅ Using optimized query with composite index');
          
        } catch (indexError) {
          console.warn('⚠️ Composite index not available, using fallback query:', indexError.message);
          
          // STRATEGY 2: Fallback query without orderBy (works without index)
          // Client-side sorting will be applied
          imagesQuery = query(
            collection(db, 'user_images'),
            where('userId', '==', user.uid),
            limit(50)
          );
        }

        // Set up real-time listener with the chosen query
        const unsubscribe = onSnapshot(
          imagesQuery,
          (querySnapshot) => {
            const imagesList = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              imagesList.push({
                id: doc.id,
                ...data,
                // Ensure createdAt is properly formatted for sorting
                createdAt: data.createdAt || new Date()
              });
            });
            
            // STRATEGY 3: Client-side sorting if server-side orderBy failed
            // This ensures consistent ordering regardless of index availability
            const sortedImages = imagesList.sort((a, b) => {
              const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
              const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return bTime - aTime; // DESC order (newest first)
            });
            
            setImages(sortedImages);
            setIsLoading(false);
          },
          (error) => {
            console.error('Error fetching images:', error);
            
            // Enhanced error handling with specific messaging
            if (error.code === 'failed-precondition') {
              setError('Gallery index is being created. Please try again in a few minutes.');
            } else if (error.code === 'permission-denied') {
              setError('Access denied. Please sign in again.');
            } else {
              setError(`Failed to load gallery: ${error.message}`);
            }
            
            setIsLoading(false);
          }
        );

        // Cleanup listener on unmount
        return () => unsubscribe();
        
      } catch (error) {
        console.error('Error setting up gallery listener:', error);
        setError('Failed to initialize gallery. Please refresh the page.');
        setIsLoading(false);
      }
    };

    setupGalleryListener();
  }, [user]);

  // Handle single image selection
  const handleImageSelect = (imageId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  // Select all images
  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  // Show delete confirmation for single image
  const handleSingleDelete = (imageId) => {
    setDeleteImageId(imageId);
    setDeleteTarget('single');
    setShowDeleteConfirm(true);
  };

  // Show delete confirmation for selected images
  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return;
    setDeleteTarget('bulk');
    setShowDeleteConfirm(true);
  };

  // Execute single image deletion
  const deleteSingleImage = async (imageId) => {
    setIsDeleting(true);
    
    try {
      await deleteDoc(doc(db, 'user_images', imageId));
      setShowDeleteConfirm(false);
      setDeleteImageId(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute bulk deletion
  const deleteBulkImages = async () => {
    if (selectedImages.size === 0) return;
    
    setIsDeleting(true);

    try {
      const batch = writeBatch(db);
      
      // Add all selected images to the batch delete
      selectedImages.forEach(imageId => {
        const imageRef = doc(db, 'user_images', imageId);
        batch.delete(imageRef);
      });

      await batch.commit();
      
      setSelectedImages(new Set());
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting images:', error);
      setError('Failed to delete images. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (deleteTarget === 'single' && deleteImageId) {
      deleteSingleImage(deleteImageId);
    } else if (deleteTarget === 'bulk') {
      deleteBulkImages();
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setDeleteImageId(null);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Invalid date';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Gallery</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your gallery...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Gallery</h2>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load gallery</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No images state
  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Gallery</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600">Create your first coloring page to start building your gallery!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          My Gallery ({images.length} image{images.length !== 1 ? 's' : ''})
        </h2>
        
        {/* Bulk Actions */}
        {images.length > 0 && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedImages.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition duration-200"
              >
                Delete Selected ({selectedImages.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group bg-gray-50 rounded-lg overflow-hidden">
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedImages.has(image.id)}
                onChange={() => handleImageSelect(image.id)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleSingleDelete(image.id)}
              className="absolute top-2 right-2 z-10 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
              title="Delete image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Image */}
            <div className="aspect-square">
              <img
                src={image.imageUrl}
                alt={image.originalPrompt || 'Generated coloring page'}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => window.open(image.imageUrl, '_blank')}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTAuNTg2IDEwLjU4NkMxMS4zNjcgOS44MDUgMTIuNjMzIDkuODA1IDEzLjQxNCAxMC41ODZMMjAgMTdNMTQgMTFMMTUuNTg2IDkuNDE0QzE2LjM2NyA4LjYzMyAxNy42MzMgOC42MzMgMTguNDE0IDkuNDE0TDIwIDExTTE0IDdINy4wMU02IDEwSDEyQTIgMiAwIDAwMTQgOFY2QTIgMiAwIDAwMTIgNEg2QTIgMiAwIDAwNCA2VjE2QTIgMiAwIDAwNiAxOEgxOEEyIDIgMCAwMDIwIDE2VjE0IiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                  e.target.alt = 'Image not available';
                }}
              />
            </div>

            {/* Image Info */}
            <div className="p-3">
              <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                {image.originalPrompt || 'No description available'}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(image.createdAt)}
              </p>
              
              {/* Metadata */}
              {image.metadata && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {image.metadata.complexity && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {image.metadata.complexity}
                    </span>
                  )}
                  {image.metadata.ageGroup && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {image.metadata.ageGroup}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Deletion
              </h3>
              
              <p className="text-gray-600 mb-6">
                {deleteTarget === 'single' 
                  ? 'Are you sure you want to delete this image? This action cannot be undone.'
                  : `Are you sure you want to delete ${selectedImages.size} selected image${selectedImages.size !== 1 ? 's' : ''}? This action cannot be undone.`
                }
              </p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(GalleryComponent);