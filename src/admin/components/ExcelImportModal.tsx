import { useState, useRef, useEffect } from 'react';
import { IconX, IconUpload, IconDownload, IconCheck, IconAlertCircle, IconLoader, IconFileSpreadsheet } from './icons';

interface ExcelImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<{ success: boolean; estimatedCount?: number; errors?: string[] }>;
    onDownloadTemplate: () => Promise<void>;
}

interface FileAnalysis {
    estimatedCount: number;
    isValid: boolean;
    errors: string[];
}

export default function ExcelImportModal({ open, onClose, onImport, onDownloadTemplate }: ExcelImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [downloadTemplateLoading, setDownloadTemplateLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            // Reset state when modal closes
            setSelectedFile(null);
            setFileAnalysis(null);
            setImportProgress({ current: 0, total: 0 });
        }
    }, [open]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validExtensions = ['.xlsx'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!validExtensions.includes(fileExtension)) {
            alert('Invalid file type. Please upload a .xlsx file.');
            return;
        }

        setSelectedFile(file);
        setFileAnalysis(null);
        setAnalyzing(true);

        try {
            // Analyze file
            const result = await analyzeFile(file);
            setFileAnalysis(result);
        } catch (error) {
            console.error('Error analyzing file:', error);
            setFileAnalysis({
                estimatedCount: 0,
                isValid: false,
                errors: ['Failed to analyze file. Please check the file format.']
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const analyzeFile = async (file: File): Promise<FileAnalysis> => {
        // Read file and analyze
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Import xlsx library dynamically
                    const XLSX = await import('xlsx');
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                    
                    // Skip header row (row 0)
                    const dataRows = jsonData.slice(1).filter((row: any) => {
                        // Filter out completely empty rows
                        return row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
                    });
                    
                    const estimatedCount = dataRows.length;
                    const errors: string[] = [];
                    
                    // Basic validation
                    if (estimatedCount === 0) {
                        errors.push('No data rows found in the file.');
                    }
                    
                    // Check required columns (at minimum: Product Code, Product Name, Price)
                    if (jsonData.length > 0) {
                        const headerRow = jsonData[0] as any[];
                        const requiredColumns = ['Product Code', 'Product Name', 'Price'];
                        const missingColumns = requiredColumns.filter(col => 
                            !headerRow.some((h: any) => 
                                h && String(h).toLowerCase().includes(col.toLowerCase())
                            )
                        );
                        
                        if (missingColumns.length > 0) {
                            errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
                        }
                    }
                    
                    resolve({
                        estimatedCount,
                        isValid: errors.length === 0,
                        errors
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleImport = async () => {
        if (!selectedFile || !fileAnalysis?.isValid) return;

        setImporting(true);
        setImportProgress({ current: 0, total: fileAnalysis.estimatedCount });

        try {
            // Call the import function with progress callback
            const result = await onImport(selectedFile);
            
            if (result.success) {
                // Success - close modal after a brief delay
                setTimeout(() => {
                    onClose();
                    // Refresh page or show success message
                    window.location.reload();
                }, 1000);
            } else {
                alert('Import failed. Please check the errors and try again.');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import products. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        setDownloadTemplateLoading(true);
        try {
            await onDownloadTemplate();
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Failed to download template. Please try again.');
        } finally {
            setDownloadTemplateLoading(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFileAnalysis(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal excel-import-modal" onClick={(e) => e.stopPropagation()}>
                {/* Fixed Header */}
                <div className="excel-import-header">
                    <div className="excel-import-header-content">
                        <h3>Import Products from Excel</h3>
                        <div className="excel-import-header-actions">
                            <button 
                                className="btn-download-template-header" 
                                onClick={handleDownloadTemplate}
                                disabled={downloadTemplateLoading || importing}
                            >
                                {downloadTemplateLoading ? (
                                    <>
                                        <IconLoader className="spinner" />
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconDownload />
                                        <span>Download Template</span>
                                    </>
                                )}
                            </button>
                            <button className="btn-close-modal" onClick={onClose} disabled={importing}>
                                <IconX />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="excel-import-body">
                    {/* File Upload Section with Combined Analysis */}
                    <div className="file-upload-section">
                        <label className="file-upload-label">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileSelect}
                                disabled={importing || analyzing}
                                style={{ display: 'none' }}
                            />
                            <div className="file-upload-area">
                                <IconUpload />
                                <div>
                                    <strong>Click to upload</strong> or drag and drop
                                </div>
                                <div className="file-upload-hint">.xlsx files only</div>
                            </div>
                        </label>

                        {/* Combined File Display and Analysis */}
                        {selectedFile && (
                            <div className="file-analysis-combined">
                                {analyzing ? (
                                    <div className="analysis-status-inline">
                                        <IconLoader className="spinner" />
                                        <span>Analyzing file...</span>
                                    </div>
                                ) : fileAnalysis ? (
                                    <div className={`file-info-with-analysis ${fileAnalysis.isValid ? 'valid' : 'invalid'}`}>
                                        <div className="file-info-row">
                                            <IconFileSpreadsheet className="file-icon" />
                                            <span className="file-name">{selectedFile.name}</span>
                                            {!importing && (
                                                <button 
                                                    className="btn-remove-file" 
                                                    onClick={handleRemoveFile}
                                                    type="button"
                                                    title="Remove file"
                                                >
                                                    <IconX />
                                                </button>
                                            )}
                                        </div>
                                        {fileAnalysis.isValid ? (
                                            <div className="file-validation-success">
                                                <IconCheck />
                                                <div className="validation-text">
                                                    <strong>File is valid!</strong>
                                                    <span className="estimated-count">
                                                        Estimated products to import: <strong>{fileAnalysis.estimatedCount}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="file-validation-error">
                                                <IconAlertCircle />
                                                <div className="validation-text">
                                                    <strong>File validation failed:</strong>
                                                    <ul>
                                                        {fileAnalysis.errors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Instructions - Moved Below Upload */}
                    <div className="import-instructions">
                        <h4>File Format Instructions</h4>
                        <ul>
                            <li><strong>Format:</strong> Single row format - each product should be on one row</li>
                            <li><strong>Multiple values:</strong> Separate multiple values with commas (e.g., "Value1, Value2")</li>
                            <li><strong>Categories:</strong> Category names must exactly match the format (Capital letter, space) of values in the Category table</li>
                            <li><strong>Unrecognized values:</strong> Any mismatch or unrecognized category values will be imported as null</li>
                            <li><strong>File type:</strong> Only .xlsx files are accepted</li>
                        </ul>
                    </div>

                    {/* Import Progress */}
                    {importing && (
                        <div className="import-progress">
                            <div className="progress-header">
                                <IconLoader className="spinner" />
                                <span>Importing products...</span>
                            </div>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar" 
                                    style={{ 
                                        width: `${fileAnalysis.estimatedCount > 0 
                                            ? (importProgress.current / fileAnalysis.estimatedCount) * 100 
                                            : 0}%` 
                                    }}
                                />
                            </div>
                            <div className="progress-text">
                                {importProgress.current} / {fileAnalysis.estimatedCount} products imported
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="excel-import-footer">
                    <div className="excel-import-footer-content">
                        <button 
                            className="btn-secondary" 
                            onClick={onClose}
                            disabled={importing}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn-primary" 
                            onClick={handleImport}
                            disabled={!selectedFile || !fileAnalysis?.isValid || importing || analyzing}
                        >
                            {importing ? (
                                <>
                                    <IconLoader className="spinner" />
                                    <span>Importing...</span>
                                </>
                            ) : (
                                'Create Products'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

