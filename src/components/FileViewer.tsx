import React from 'react';
import { File, Download, Eye, X } from 'lucide-react';

interface FileViewerProps {
  filePath?: string;
  fileName?: string;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  filePath,
  fileName,
  onRemove,
  showRemove = false,
  className = ''
}) => {
  if (!filePath) {
    return null;
  }

  const getFileName = (path: string): string => {
    if (fileName) return fileName;
    return path.split('/').pop() || path;
  };

  const getFileExtension = (path: string): string => {
    return path.split('.').pop()?.toLowerCase() || '';
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = getFileName(filePath);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(filePath, '_blank');
  };

  const extension = getFileExtension(filePath);
  const displayFileName = getFileName(filePath);

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <File className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayFileName}
            </p>
            <p className="text-xs text-gray-500 uppercase">
              {extension} file
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            type="button"
            onClick={handleView}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Ver archivo"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Descargar archivo"
          >
            <Download className="h-4 w-4" />
          </button>
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Eliminar archivo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
