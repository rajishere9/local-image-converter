'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress'; // Import Progress
import { useDropzone } from 'react-dropzone';
import GIF from 'gif.js';
import JSZip from 'jszip'; // Import JSZip
import { saveAs } from 'file-saver'; // Utility to trigger downloads
import { X, Download } from 'lucide-react'; // Icons

const MAX_FILES = 50;

interface DownloadInfo {
  name: string;
  url: string;
  size?: number; // Add size property
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Array for multiple files
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [downloadUrls, setDownloadUrls] = useState<DownloadInfo[]>([]); // Array for download links
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Array for previews
  const [jpegQuality, setJpegQuality] = useState<number>(92);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Dropzone setup for multiple files
  const onDrop = (acceptedFiles: File[]) => {
    setError(null); // Clear previous errors
    const newFiles = acceptedFiles.slice(0, MAX_FILES - selectedFiles.length); // Respect limit

    if (acceptedFiles.length > newFiles.length) {
       setError(`Limit of ${MAX_FILES} files reached. Only ${newFiles.length} files were added.`);
    }

    if (newFiles.length > 0) {
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
      setDownloadUrls([]); // Clear old download links on new file add
    }
  };

   const handleClearSelection = () => {
    // Revoke all existing preview URLs before clearing
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    // Revoke all existing download URLs
    downloadUrls.forEach(info => URL.revokeObjectURL(info.url));

    setSelectedFiles([]);
    setPreviewUrls([]);
    setDownloadUrls([]);
    setError(null);
    setConversionProgress(0);
    setIsConverting(false); // Ensure conversion state is reset
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/bmp': [],
      'image/gif': [],
    },
    multiple: true, // Allow multiple files
  });

  // Clean up ALL preview Object URLs on unmount or when previews change
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
          console.log('Revoked Preview Object URL:', url);
        }
      });
    };
  }, [previewUrls]); // Depend on the array itself

  // Clean up ALL download Object URLs on unmount or when downloads change
   useEffect(() => {
    return () => {
      downloadUrls.forEach(info => {
         if (info.url.startsWith('blob:')) {
           URL.revokeObjectURL(info.url);
           console.log('Revoked Download Object URL:', info.url);
         }
      });
    };
  }, [downloadUrls]);

  // Reusable function to convert a single file
  const convertFile = (file: File, targetFormat: string, qualityValue: number): Promise<DownloadInfo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return reject(new Error('Could not get canvas context.'));
          }
          if (!img.complete || img.naturalWidth === 0) {
             return reject(new Error('Image failed to load properly.'));
          }
          ctx.drawImage(img, 0, 0);

          const quality = targetFormat === 'image/jpeg' ? qualityValue / 100 : 0.92;
          const outputFilename = `converted-${file.name.split('.').slice(0, -1).join('.')}.${targetFormat.split('/')[1]}`;

          if (targetFormat === 'image/gif') {
            const gif = new GIF({ workers: 2, quality: 10, workerScript: '/gif.worker.js' });
            gif.addFrame(canvas, { delay: 200 });
            gif.on('finished', (blob) => {
              if (!blob) return reject(new Error('GIF conversion failed: No blob.'));
              resolve({ name: outputFilename, url: URL.createObjectURL(blob), size: blob.size });
            });
            try {
              gif.render();
            } catch (err: any) {
              reject(new Error(`GIF rendering error: ${err?.message || err}`));
            }
          } else {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('Conversion failed: No blob.'));
                resolve({ name: outputFilename, url: URL.createObjectURL(blob), size: blob.size });
              },
              targetFormat,
              quality
            );
          }
        }; // End img.onload
        img.onerror = () => reject(new Error('Could not load image data.'));
        img.src = loadEvent.target?.result as string; // Use FileReader result for canvas
      }; // End reader.onload
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file); // Read file for conversion
    });
  };


  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select one or more files first.');
      return;
    }

    setIsConverting(true);
    setError(null);
    setDownloadUrls([]);
    setConversionProgress(0);

    const results: DownloadInfo[] = [];
    let filesProcessed = 0;
    const totalFiles = selectedFiles.length;
    let conversionErrors: string[] = [];

    for (const file of selectedFiles) {
      try {
        const result = await convertFile(file, outputFormat, jpegQuality);
        results.push(result);
      } catch (err: any) {
        console.error(`Failed to convert ${file.name}:`, err);
        conversionErrors.push(`Failed ${file.name}: ${err.message}`);
      } finally {
        filesProcessed++;
        setConversionProgress(Math.round((filesProcessed / totalFiles) * 100));
      }
    }

    setDownloadUrls(results);
    if (conversionErrors.length > 0) {
       setError(`Completed with ${conversionErrors.length} error(s). Check console for details.`);
       // Optionally display specific errors: setError(conversionErrors.join('; '));
    }
    setIsConverting(false);
  };


  /*
  // --- OLD SINGLE FILE CONVERSION LOGIC (REMOVED) ---
  const handleConvert_OLD = async () => {
    // ... old logic ...
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setError('Could not get canvas context.');
          setIsConverting(false);
          return;
        }

        // Draw image, ensuring it's loaded
        if (!img.complete || img.naturalWidth === 0) {
           setError('Image failed to load properly for conversion.');
           setIsConverting(false);
           return;
        }
        ctx.drawImage(img, 0, 0);

        // Use the state for JPEG quality, converted to 0-1 scale
        const quality = outputFormat === 'image/jpeg' ? jpegQuality / 100 : 0.92;

        // Use gif.js for GIF output
        if (outputFormat === 'image/gif') {
          const gif = new GIF({
            workers: 2, // Number of workers
            quality: 10,
            workerScript: '/gif.worker.js',
          });
          gif.addFrame(canvas, { delay: 200 });

          gif.on('progress', (p) => {
             setConversionProgress(Math.round(p * 100)); // Update progress for GIF
          });

          gif.on('finished', (blob) => {
            if (!blob) {
              setError('GIF conversion failed: Could not create blob.');
              setIsConverting(false);
              return;
            }
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setIsConverting(false);
            setConversionProgress(100); // Ensure progress hits 100
          });

          try {
            gif.render();
          } catch (err: any) {
             setError(`GIF rendering error: ${err?.message || err}`);
             setIsConverting(false);
             setConversionProgress(0);
          }
        } else {
          // Use canvas.toBlob for other formats
          // Show pseudo-progress for toBlob as it's synchronous after draw
          setConversionProgress(50);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                setError('Conversion failed: Could not create blob.');
                setIsConverting(false);
                return;
              }
              const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            setIsConverting(false);
            setConversionProgress(100); // Mark as complete
          },
          outputFormat,
            quality
          );
        }
      }; // End img.onload
      img.onerror = (e) => {
        console.error("Image loading error:", e);
        setError('Could not load image data for conversion.');
        setIsConverting(false);
      };
      // Use the ObjectURL directly if available (from dropzone), otherwise use FileReader result
      img.src = previewUrl && previewUrl.startsWith('blob:') ? previewUrl : loadEvent.target?.result as string;
    };
    reader.onerror = () => { setError('Could not read file.'); setIsConverting(false); };
    reader.readAsDataURL(selectedFile);
  };
  */
  // --- END OLD LOGIC ---

  const handleDownloadAll = async () => {
    if (downloadUrls.length === 0) return;

    const zip = new JSZip();
    setError(null); // Clear previous errors

    try {
      // Fetch all blobs concurrently
      const blobPromises = downloadUrls.map(info =>
        fetch(info.url).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${info.name}`);
          return res.blob();
        }).then(blob => ({ name: info.name, blob }))
      );

      const blobs = await Promise.all(blobPromises);

      // Add blobs to zip
      blobs.forEach(item => {
        zip.file(item.name, item.blob);
      });

      // Generate zip file and trigger download
      zip.generateAsync({ type: 'blob' })
        .then((content) => {
          saveAs(content, `converted_images_${Date.now()}.zip`);
        })
        .catch(err => {
          console.error("Error generating zip:", err);
          setError(`Failed to generate ZIP file: ${err.message}`);
        });

    } catch (err: any) {
       console.error("Error fetching blobs for zipping:", err);
       setError(`Failed to prepare files for zipping: ${err.message}`);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Image Converter</CardTitle>
          <CardDescription>
            Convert images locally in your browser. Select a file and choose the
            output format.
          </CardDescription>
          <div className="text-xs text-muted-foreground mt-2">
            Open source project - 
            <a 
              href="https://github.com/rajankrishnan/local-image-converter" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline ml-1"
            >
              View on GitHub
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone Input Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the image here ...</p>
            ) : (
              <p>Drag 'n' drop an image here, or click to select multiple images at once</p>
            )}
          </div>
          {/* Selected Files Info & Clear Button */}
          {selectedFiles.length > 0 && (
             <div className="flex justify-between items-center pt-2">
               <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                 Selected: {selectedFiles.length} file(s)
               </p>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={handleClearSelection}
                 className="text-red-500 hover:text-red-700"
                 aria-label="Clear selection"
               >
                 <X className="h-4 w-4" />
               </Button>
             </div>
          )}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="format">Output Format</Label>
            <Select
              value={outputFormat}
              onValueChange={setOutputFormat}
              disabled={isConverting}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/webp">WEBP</SelectItem>
                <SelectItem value="image/bmp">BMP</SelectItem>
                <SelectItem value="image/gif">GIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* JPEG Quality Slider - Conditionally Rendered */}
          {outputFormat === 'image/jpeg' && (
            <div className="grid w-full max-w-sm items-center gap-1.5 pt-2">
              <Label htmlFor="quality">JPEG Quality ({jpegQuality})</Label>
              <Slider
                id="quality"
                min={0}
                max={100}
                step={1}
                value={[jpegQuality]}
                onValueChange={(value) => setJpegQuality(value[0])}
                disabled={isConverting}
                className="mt-2"
              />
            </div>
          )}
          {/* Conversion Progress */}
          {isConverting && (
            <div className="pt-2">
               <Progress value={conversionProgress} className="w-full" />
               <p className="text-sm text-center mt-1">{conversionProgress}%</p>
            </div>
          )}
          {/* Image Preview Section (Multiple Previews) */}
          {previewUrls.length > 0 && (
             <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-800">
               {previewUrls.map((url, index) => (
                 <div key={index} className="relative aspect-square flex justify-center items-center">
                   <img
                     src={url}
                     alt={`Preview ${index + 1}`}
                     className="max-w-full max-h-full object-contain rounded"
                   />
                 </div>
               ))}
             </div>
           )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </CardContent>
        {/* Updated Footer Layout */}
        <CardFooter className="flex flex-col items-stretch gap-4 pt-4">
          {/* Convert Button takes full width initially */}
          <Button
            onClick={handleConvert}
            disabled={selectedFiles.length === 0 || isConverting}
            className="w-full"
          >
            {isConverting ? `Converting (${conversionProgress}%)` : `Convert ${selectedFiles.length} File(s)`}
          </Button>

          {/* Download Section */}
          {downloadUrls.length > 0 && !isConverting && (
            <div className="w-full space-y-2 border-t pt-4"> {/* Add border top for separation */}
              <h3 className="text-sm font-medium text-center">Converted Files:</h3>
              <ul className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                {downloadUrls.map((info, index) => (
                  <li key={index} className="flex justify-between items-center text-sm gap-2"> {/* Add gap */}
                    {/* Make filename span flexible */}
                    <span className="flex-1 truncate">
                      {info.name} {info.size ? `(${formatBytes(info.size)})` : ''}
                    </span>
                    {/* Ensure button doesn't shrink */}
                    <a href={info.url} download={info.name} aria-label={`Download ${info.name}`} className="flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </li>
                ))}
              </ul>
              {/* Center Download All button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleDownloadAll}
                  variant="secondary"
                  className="w-full max-w-xs" // Limit width but allow full on small screens
                  size="sm"
                >
                  Download All (.zip)
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
