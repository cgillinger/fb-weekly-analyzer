import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { validateFile } from '../utils/period_validator';
import { processMultipleFiles } from '../core/csv_processor';

const WeeklyUploader = ({ onDataUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (files) => {
    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);
    setUploadResults(null);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Remove file from selection
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  // Process and upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadResults(null);

    try {
      // 1. Validate all files first
      const validationPromises = selectedFiles.map(file => validateFile(file, []));
      const validations = await Promise.all(validationPromises);

      // Check for validation errors
      const hasErrors = validations.some(v => !v.isValid);
      if (hasErrors) {
        setUploadResults({
          success: false,
          message: 'Vissa filer har valideringsfel',
          validations
        });
        setUploading(false);
        return;
      }

      // 2. Process CSV files
      const results = await processMultipleFiles(selectedFiles);

      // Check for processing errors
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      if (successfulResults.length === 0) {
        setUploadResults({
          success: false,
          message: 'Kunde inte bearbeta några filer',
          results
        });
        setUploading(false);
        return;
      }

      // 3. Prepare data for parent component
      const periodsData = successfulResults.map(result => {
        // Extract period info from first row of dataset
        const firstRow = result.dataset.data[0];
        
        return {
          year: firstRow.period.year,
          week: firstRow.period.week,
          month: firstRow.period.getMonthNumber(),
          startDate: firstRow.period.startDate,
          endDate: firstRow.period.endDate,
          filename: result.filename,
          data: result.dataset.data // Full dataset
        };
      });

      // 4. Call parent callback
      onDataUploaded(periodsData);

      // 5. Show success message
      setUploadResults({
        success: true,
        message: `${successfulResults.length} fil(er) uppladdade framgångsrikt!`,
        successCount: successfulResults.length,
        failedCount: failedResults.length,
        results
      });

      // Clear selected files
      setSelectedFiles([]);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults({
        success: false,
        message: `Fel vid uppladdning: ${error.message}`,
        error
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Ladda upp veckodata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Dra och släpp CSV-filer här
          </p>
          <p className="text-sm text-gray-500 mb-4">
            eller klicka för att välja filer
          </p>
          <p className="text-xs text-gray-400">
            Format: week_XX.csv (t.ex. week_41.csv, week_42.csv)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">
              Valda filer ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Bearbetar...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ladda upp {selectedFiles.length} fil(er)
              </>
            )}
          </Button>
        )}

        {/* Upload Results */}
        {uploadResults && (
          <Alert variant={uploadResults.success ? 'default' : 'destructive'}>
            {uploadResults.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <p className="font-medium">{uploadResults.message}</p>
              {uploadResults.failedCount > 0 && (
                <p className="text-sm mt-2">
                  {uploadResults.failedCount} fil(er) misslyckades
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyUploader;
