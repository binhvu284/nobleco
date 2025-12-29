import { useState, useRef, useEffect } from 'react';
import { IconX, IconUpload, IconDownload, IconCheck, IconAlertCircle, IconLoader, IconFileSpreadsheet } from './icons';

interface ExcelImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<{ 
        success: boolean; 
        estimatedCount?: number; 
        errors?: string[];
        duplicateCount?: number;
        duplicateSKUs?: string[];
        duplicateDetails?: Array<{ sku: string; rows: number[] }>;
        duplicateSKUList?: string;
    }>;
    onDownloadTemplate: () => Promise<void>;
    onSuccess?: () => void;
    productType?: 'jewelry' | 'centerstone';
}

interface FileAnalysis {
    estimatedCount: number;
    isValid: boolean;
    errors: string[];
}

interface DuplicateSKUError {
    duplicateCount: number;
    duplicateSKUs?: string[];
    duplicateDetails?: Array<{ sku: string; rows: number[] }>;
    duplicateSKUList?: string;
    errorMessage: string;
}

export default function ExcelImportModal({ open, onClose, onImport, onDownloadTemplate, onSuccess, productType = 'jewelry' }: ExcelImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [downloadTemplateLoading, setDownloadTemplateLoading] = useState(false);
    const [duplicateSKUError, setDuplicateSKUError] = useState<DuplicateSKUError | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            // Reset state when modal closes
            setSelectedFile(null);
            setFileAnalysis(null);
            setImportProgress({ current: 0, total: 0 });
            setDuplicateSKUError(null);
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
                        
                        // Validate specification column matches productType
                        const hasJewelrySpec = headerRow.some((h: any) => 
                            h && String(h).toLowerCase().includes('jewelry specification')
                        );
                        const hasCenterstoneSpec = headerRow.some((h: any) => 
                            h && String(h).toLowerCase().includes('centerstone specification')
                        );
                        
                        if (productType === 'jewelry') {
                            if (hasCenterstoneSpec && !hasJewelrySpec) {
                                errors.push('This file is for centerstone products. Please use the jewelry product template instead.');
                            } else if (!hasJewelrySpec && !hasCenterstoneSpec) {
                                // No specification column found - this is acceptable but warn
                                // Don't add error, just allow it
                            }
                        } else if (productType === 'centerstone') {
                            if (hasJewelrySpec && !hasCenterstoneSpec) {
                                errors.push('This file is for jewelry products. Please use the centerstone template instead.');
                            } else if (!hasCenterstoneSpec && !hasJewelrySpec) {
                                // No specification column found - this is acceptable but warn
                                // Don't add error, just allow it
                            }
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
        const totalItems = fileAnalysis.estimatedCount || 1;
        // Start with a small initial progress to show the bar immediately
        setImportProgress({ current: 1, total: totalItems });
        setDuplicateSKUError(null);

        // Simulate progress to avoid freezing UI
        let simulatedProgress = 5; // Start at 5% to show the bar immediately
        const progressInterval = setInterval(() => {
            // Gradually increase progress up to 90% while waiting for response
            if (simulatedProgress < 90) {
                simulatedProgress = Math.min(90, simulatedProgress + Math.random() * 5 + 2);
                const currentCount = Math.floor((simulatedProgress / 100) * totalItems);
                setImportProgress({ 
                    current: Math.max(1, currentCount), // Ensure at least 1 to show the bar
                    total: totalItems 
                });
            }
        }, 200); // Update every 200ms

        try {
            // Call the import function with progress callback
            const result = await onImport(selectedFile);
            
            // Clear the simulation interval
            clearInterval(progressInterval);
            
            // Set to 100% when complete
            setImportProgress({ 
                current: totalItems, 
                total: totalItems 
            });
            
            if (result.success) {
                // Success - close modal after a brief delay
                setTimeout(() => {
                    onClose();
                    // Call onSuccess callback if provided, otherwise reload page
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        window.location.reload();
                    }
                }, 1000);
            } else {
                // Check if this is a duplicate SKU error
                if (result.duplicateCount !== undefined) {
                    setDuplicateSKUError({
                        duplicateCount: result.duplicateCount,
                        duplicateSKUs: result.duplicateSKUs,
                        duplicateDetails: result.duplicateDetails,
                        duplicateSKUList: result.duplicateSKUList,
                        errorMessage: result.errors?.[0] || 'Duplicate SKUs found'
                    });
                } else {
                    // Generic error - show alert for now
                    alert(result.errors?.join('\n') || 'Import failed. Please check the errors and try again.');
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            clearInterval(progressInterval);
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
        setDuplicateSKUError(null);
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

                    {/* Duplicate SKU Error Display */}
                    {duplicateSKUError && (
                        <div className="duplicate-sku-error">
                            <div className="duplicate-sku-error-header">
                                <IconAlertCircle className="error-icon" />
                                <div className="error-title">
                                    <strong>Duplicate Product Code (SKU) Detected</strong>
                                </div>
                            </div>
                            <div className="duplicate-sku-error-body">
                                <div className="duplicate-sku-summary">
                                    This file contains <strong>{duplicateSKUError.duplicateCount} duplicate Product Code{duplicateSKUError.duplicateCount > 1 ? 's' : ''}</strong>. 
                                    Product Code (SKU) must be unique.
                                </div>
                                
                                {/* Show duplicate details if available (duplicates within file) */}
                                {duplicateSKUError.duplicateDetails && duplicateSKUError.duplicateDetails.length > 0 && (
                                    <div className="duplicate-sku-details">
                                        <strong>Duplicates found in this file:</strong>
                                        <ul className="duplicate-sku-list">
                                            {duplicateSKUError.duplicateDetails.map((dup, index) => (
                                                <li key={index}>
                                                    <span className="sku-value">"{dup.sku}"</span> appears in row{dup.rows.length > 1 ? 's' : ''}: {dup.rows.join(', ')}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Show duplicate SKUs if available (duplicates in database) */}
                                {duplicateSKUError.duplicateSKUs && duplicateSKUError.duplicateSKUs.length > 0 && (
                                    <div className="duplicate-sku-details">
                                        <strong>Product Codes that already exist in the database:</strong>
                                        <div className="duplicate-sku-tags">
                                            {duplicateSKUError.duplicateSKUs.map((sku, index) => (
                                                <span key={index} className="sku-tag">{sku}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Show duplicate SKU list if available (alternative format) */}
                                {duplicateSKUError.duplicateSKUList && !duplicateSKUError.duplicateSKUs && (
                                    <div className="duplicate-sku-details">
                                        <strong>Details:</strong>
                                        <div className="duplicate-sku-text">{duplicateSKUError.duplicateSKUList}</div>
                                    </div>
                                )}
                                
                                <div className="duplicate-sku-action">
                                    Please fix the duplicate Product Codes in your Excel file and try again.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Progress */}
                    {importing && (
                        <div className="import-progress">
                            <div className="progress-header">
                                <IconLoader className="spinner" />
                                <span>Importing products...</span>
                            </div>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar progress-bar-animated" 
                                    style={{ 
                                        width: `${fileAnalysis && fileAnalysis.estimatedCount > 0 
                                            ? Math.max(2, (importProgress.current / fileAnalysis.estimatedCount) * 100)
                                            : 2}%` 
                                    }}
                                >
                                    <div className="progress-bar-shimmer"></div>
                                </div>
                            </div>
                            <div className="progress-text">
                                <span className="progress-count">
                                    {importProgress.current} / {fileAnalysis?.estimatedCount || 0} products imported
                                </span>
                                <span className="progress-percentage">
                                    {fileAnalysis && fileAnalysis.estimatedCount > 0 
                                        ? Math.round((importProgress.current / fileAnalysis.estimatedCount) * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Instructions - Moved Below Error and Progress Sections */}
                    <div className="import-instructions">
                        <h4>File Format Instructions</h4>
                        <ul>
                            <li><strong>Format:</strong> Single row format - each product should be on one row</li>
                            <li><strong>Multiple values:</strong> Separate multiple values with commas (e.g., "Value1, Value2")</li>
                            <li><strong>Decimal values:</strong> Use "." (dot) to indicate decimal values. This is used to distinguish from commas which are used for multiple values (e.g., use "2.5" not "2,5")</li>
                            <li><strong>Categories:</strong> Category names must exactly match the format (Capital letter, space) of values in the Category table</li>
                            <li><strong>Unrecognized values:</strong> Any mismatch or unrecognized category values will be imported as null</li>
                            <li><strong>File type:</strong> Only .xlsx files are accepted</li>
                        </ul>
                    </div>
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

