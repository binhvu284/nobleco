import XLSX from 'xlsx';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Define headers according to the new jewelry specifications format
    const headers = [
      'Product Code',
      'Product Name',
      'Categories',
      'Material / Purity',
      'Material Weight (g)',
      'Total Weight (g)',
      'Size',
      'Jewelry Size',
      'Style (BST)',
      'Sub Style',
      'Main Stone Type',
      'Stone Quantity',
      'Shape and Polished',
      'Origin',
      'Item Serial',
      'Country of Origin',
      'Certification Number',
      'Size (mm)',
      'Color',
      'Clarity',
      'Weight (CT)',
      'PCS',
      'Cut Grade',
      'Treatment',
      'Price (VND)',
      'Stock',
      'Sub Stone Type 1',
      'Sub Stone Type 2',
      'Sub Stone Type 3',
      'Description'
    ];

    // Create sample data row
    const sampleRow = [
      'PRD-00000001',          // Product Code
      'Diamond Ring 18K',      // Product Name (optional - defaults to Product Code if empty)
      'Rings, Gold Jewelry',   // Categories (comma-separated)
      '18K',                   // Material / Purity
      5.5,                     // Material Weight (g)
      9.083,                   // Total Weight (g)
      'M',                     // Size
      '6.5',                   // Jewelry Size
      'Classic',               // Style (BST)
      'Solitaire',             // Sub Style
      'Diamond',               // Main Stone Type
      16,                      // Stone Quantity
      'Round, Excellent',      // Shape and Polished
      'South Africa',          // Origin
      'SER-001',               // Item Serial
      'South Africa',          // Country of Origin
      'GIA-123456',            // Certification Number
      2.4,                     // Size (mm)
      'D',                     // Color
      'VS1',                   // Clarity
      1.5,                     // Weight (CT)
      1,                       // PCS
      'Excellent',             // Cut Grade
      'None',                  // Treatment
      88300000,                // Price (VND)
      1,                       // Stock
      'Ruby',                  // Sub Stone Type 1
      '',                      // Sub Stone Type 2
      '',                      // Sub Stone Type 3
      'Sample jewelry description' // Description
    ];

    // Create worksheet data
    const worksheetData = [
      headers,
      sampleRow
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 18 },  // Product Code
      { wch: 25 },  // Product Name
      { wch: 25 },  // Categories
      { wch: 15 },  // Material / Purity
      { wch: 18 },  // Material Weight (g)
      { wch: 16 },  // Total Weight (g)
      { wch: 10 },  // Size
      { wch: 12 },  // Jewelry Size
      { wch: 12 },  // Style (BST)
      { wch: 12 },  // Sub Style
      { wch: 15 },  // Main Stone Type
      { wch: 15 },  // Stone Quantity
      { wch: 18 },  // Shape and Polished
      { wch: 15 },  // Origin
      { wch: 12 },  // Item Serial
      { wch: 18 },  // Country of Origin
      { wch: 20 },  // Certification Number
      { wch: 12 },  // Size (mm)
      { wch: 10 },  // Color
      { wch: 10 },  // Clarity
      { wch: 12 },  // Weight (CT)
      { wch: 8 },   // PCS
      { wch: 12 },  // Cut Grade
      { wch: 12 },  // Treatment
      { wch: 15 },  // Price (VND)
      { wch: 10 },  // Stock
      { wch: 15 },  // Sub Stone Type 1
      { wch: 15 },  // Sub Stone Type 2
      { wch: 15 },  // Sub Stone Type 3
      { wch: 30 }   // Description
    ];
    worksheet['!cols'] = columnWidths;

    // Style header row (bold)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E3F2FD' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true 
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="jewelry-import-template.xlsx"');
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the file
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Error generating template:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate template file' 
    });
  }
}
