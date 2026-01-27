import React from 'react';
import FileNode from './FileNode';
import { FileQuestion } from 'lucide-react';

function FileTree({ nodes }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <FileQuestion size={48} className="mb-2 opacity-50" />
        <p>폴더가 비어있습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map(node => (
        <FileNode key={node.id} node={node} />
      ))}
    </div>
  );
}

export default FileTree;
