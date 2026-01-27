import React from 'react';

function FileSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded animate-pulse">
      {/* Icon Skeleton */}
      <div className="w-5 h-5 bg-gray-700 rounded-md shrink-0"></div>
      
      {/* Text Skeleton */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      </div>
      
      {/* Action Button Skeleton (Optional) */}
      <div className="w-6 h-6 bg-gray-700 rounded ml-auto"></div>
    </div>
  );
}

export function FileListSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <FileSkeleton key={i} />
      ))}
    </div>
  );
}

export default FileSkeleton;
