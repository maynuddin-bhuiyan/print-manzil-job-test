'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

const CANVAS_SIZE = {
  width: 2000,
  height: 2000
};

// Adjust printable area to match the visual T-shirt area more precisely
const PRINTABLE_AREA = {
  x: CANVAS_SIZE.width * 0.2, // 20% from left
  y: CANVAS_SIZE.height * 0.12, // 12% from top
  width: CANVAS_SIZE.width * 0.6, // 60% of total width
  height: CANVAS_SIZE.height * 0.7 // 70% of total height
};

const TShirtDesigner = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState({ x: 400, y: 300 });
  const [logoSize, setLogoSize] = useState({ width: 100, height: 100 });
  const [originalLogoSize, setOriginalLogoSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const designAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Get original image dimensions before setting the logo
        const img = window.document.createElement('img');
        img.onload = () => {
          const maxInitialSize = 200; // Maximum initial size
          const aspectRatio = img.height / img.width;
          let initialWidth, initialHeight;

          if (img.width > img.height) {
            initialWidth = maxInitialSize;
            initialHeight = maxInitialSize * aspectRatio;
          } else {
            initialHeight = maxInitialSize;
            initialWidth = maxInitialSize / aspectRatio;
          }

          setOriginalLogoSize({ width: img.width, height: img.height });
          setLogoSize({ width: initialWidth, height: initialHeight });
          setLogo(result);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - logoPosition.x,
      y: e.clientY - logoPosition.y
    });
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && designAreaRef.current) {
      const rect = designAreaRef.current.getBoundingClientRect();
      const designPrintableArea = {
        width: rect.width * 0.6,
        height: rect.height * 0.7,
        x: rect.width * 0.2,
        y: rect.height * 0.12
      };

      // Constrain movement within printable area
      const newX = Math.min(
        Math.max(designPrintableArea.x, e.clientX - dragStart.x - rect.left),
        designPrintableArea.x + designPrintableArea.width - logoSize.width
      );
      const newY = Math.min(
        Math.max(designPrintableArea.y, e.clientY - dragStart.y - rect.top),
        designPrintableArea.y + designPrintableArea.height - logoSize.height
      );
      
      setLogoPosition({ x: newX, y: newY });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX - logoSize.width,
      y: e.clientY - logoSize.height
    });
  };

  const handleResize = (e: React.MouseEvent) => {
    if (isResizing && designAreaRef.current) {
      const rect = designAreaRef.current.getBoundingClientRect();
      const maxWidth = rect.width * 0.8; // Maximum 80% of design area width
      const minWidth = 50; // Minimum width in pixels

      // Calculate new width based on mouse position
      let newWidth = Math.max(minWidth, e.clientX - dragStart.x);
      newWidth = Math.min(newWidth, maxWidth); // Apply maximum width constraint

      // Calculate new height maintaining aspect ratio
      const aspectRatio = originalLogoSize.height / originalLogoSize.width;
      const newHeight = newWidth * aspectRatio;

      // Check if new height would exceed design area height
      const maxHeight = rect.height * 0.8;
      if (newHeight > maxHeight) {
        // If height would exceed, calculate width based on max height instead
        newWidth = maxHeight / aspectRatio;
      }

      setLogoSize({ 
        width: newWidth, 
        height: newWidth * aspectRatio 
      });

      // Adjust position if new size would push logo outside design area
      const newX = Math.min(logoPosition.x, rect.width - newWidth);
      const newY = Math.min(logoPosition.y, rect.height - newHeight);
      setLogoPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleExport = async () => {
    if (!designAreaRef.current || !logo) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = CANVAS_SIZE.width;
      canvas.height = CANVAS_SIZE.height;

      const loadTshirtImage = () => {
        return new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = '/tshirt-template.png';
        });
      };

      const loadLogoImage = () => {
        return new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = logo;
        });
      };

      const [tshirtImage, logoImage] = await Promise.all([
        loadTshirtImage(),
        loadLogoImage()
      ]) as [HTMLImageElement, HTMLImageElement];

      // Draw t-shirt at full canvas size
      ctx.drawImage(tshirtImage, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

      // Get the design area dimensions
      const designArea = designAreaRef.current.getBoundingClientRect();
      
      // Calculate the actual printable area in the design view
      const designPrintableArea = {
        width: designArea.width * 0.6,
        height: designArea.height * 0.7,
        x: designArea.width * 0.2,
        y: designArea.height * 0.12
      };

      // Calculate the position relative to the printable area
      const relativeX = (logoPosition.x - designPrintableArea.x) / designPrintableArea.width;
      const relativeY = (logoPosition.y - designPrintableArea.y) / designPrintableArea.height;

      // Calculate the size relative to the printable area
      const relativeSizeW = logoSize.width / designPrintableArea.width;
      const relativeSizeH = logoSize.height / designPrintableArea.height;

      // Apply the relative positions and sizes to the high-res canvas
      const finalLogoX = PRINTABLE_AREA.x + (relativeX * PRINTABLE_AREA.width);
      const finalLogoY = PRINTABLE_AREA.y + (relativeY * PRINTABLE_AREA.height);
      const finalLogoWidth = PRINTABLE_AREA.width * relativeSizeW;
      const finalLogoHeight = PRINTABLE_AREA.height * relativeSizeH;

      // Draw logo
      ctx.drawImage(
        logoImage,
        finalLogoX,
        finalLogoY,
        finalLogoWidth,
        finalLogoHeight
      );

      // Convert to high-quality PNG
      const finalImage = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = 'tshirt-design.png';
      link.href = finalImage;
      link.click();
    } catch (error) {
      console.error('Error exporting design:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* T-shirt Design Area */}
      <div className="flex-1 relative">
        <div
          ref={designAreaRef}
          className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden"
          onMouseMove={(e) => {
            handleDrag(e);
            handleResize(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* T-shirt Template */}
          <Image
            src="/tshirt-template.png"
            alt="T-shirt Template"
            fill
            className="object-contain"
          />

          {/* Logo */}
          {logo && (
            <div
              style={{
                position: 'absolute',
                left: logoPosition.x,
                top: logoPosition.y,
                width: logoSize.width,
                height: logoSize.height,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleDragStart}
            >
              <Image
                src={logo}
                alt="Uploaded Logo"
                fill
                className="object-contain"
              />
              {/* Resize Handle */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize transform translate-x-1/2 translate-y-1/2 hover:scale-110 transition-transform"
                onMouseDown={handleResizeStart}
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full md:w-80">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Design Controls</h2>
          
          {/* Logo Upload */}
          <div 
            className={`mb-4 border-2 border-dashed rounded-lg p-4 transition-colors ${
              isDraggingFile 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="text-center">
              <p className="text-gray-300 mb-2">
                {isDraggingFile ? 'Drop your logo here' : 'Drag & drop your logo here'}
              </p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={!logo || isExporting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export Design'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2">Instructions</h3>
          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
            <li>Drag & drop your logo or click to browse</li>
            <li>Drag the logo to position it on the t-shirt</li>
            <li>Use the blue handle to resize the logo</li>
            <li>Click Export Design when finished</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TShirtDesigner; 