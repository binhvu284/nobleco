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

    // Define headers according to the template format
    const headers = [
      'Product Code',
      'Supplier Code',
      'Product Name',
      'Jewelry Specifications',
      'Description',
      'Price (VND)',
      'Stock',
      'Categories'
    ];

    // Create sample data row (optional - can be empty)
    const sampleRow = [
      '01R0924001',           // Product Code
      'RDM24213',             // Supplier Code
      'Sample Product Name',  // Product Name
      'Center Stone Size: 2.4 mm\nNi tay: 6.5\nShape: Round\nDimensions: 2.9*3.3\nStone Count: 16\nCarat Weight: 4.065 ct\nGold Purity: 18K\nProduct Weight: 9.083 g\nType: L',  // Jewelry Specifications (multi-line)
      'Sample description',   // Description
      88300000,               // Price (VND)
      1,                      // Stock
      'Rings, Gold Jewelry'  // Categories (comma-separated)
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
      { wch: 15 },  // Product Code
      { wch: 15 },  // Supplier Code
      { wch: 25 },  // Product Name
      { wch: 50 },  // Jewelry Specifications (wider for multi-line text)
      { wch: 30 },  // Description
      { wch: 15 },  // Price (VND)
      { wch: 10 },  // Stock
      { wch: 25 }   // Categories
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
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
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

