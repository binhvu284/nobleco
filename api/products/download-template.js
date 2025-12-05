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
      'Type',
      'Description',
      'Price (VND)',
      'Stock',
      'Carat Weight (Ct)',
      'Gold Purity',
      'Product Weight (g)',
      'Shape',
      'Dimensions',
      'Stone Count',
      'Center Stone Size (mm)',
      'Ring Size (Ni tay)',
      'Inventory Value',
      'Category Names',
      'Notes'
    ];

    // Create sample data row (optional - can be empty)
    const sampleRow = [
      '01R0924001',           // Product Code
      'RDM24213',             // Supplier Code
      'Sample Product Name',  // Product Name
      'L',                    // Type (L, N, or K)
      'Sample description',   // Description
      88300000,               // Price (VND)
      1,                      // Stock
      4.065,                  // Carat Weight (Ct)
      '18K',                  // Gold Purity
      9.083,                  // Product Weight (g)
      'Round',                // Shape
      '2.9*3.3',              // Dimensions
      16,                     // Stone Count
      2.4,                    // Center Stone Size (mm)
      6.5,                    // Ring Size (Ni tay)
      88300000,               // Inventory Value
      'Rings, Gold Jewelry',  // Category Names (comma-separated)
      'Sample notes'          // Notes
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
      { wch: 10 },  // Type
      { wch: 30 },  // Description
      { wch: 15 },  // Price
      { wch: 10 },  // Stock
      { wch: 15 },  // Carat Weight
      { wch: 12 },  // Gold Purity
      { wch: 15 },  // Product Weight
      { wch: 12 },  // Shape
      { wch: 15 },  // Dimensions
      { wch: 12 },  // Stone Count
      { wch: 18 },  // Center Stone Size
      { wch: 15 },  // Ring Size
      { wch: 15 },  // Inventory Value
      { wch: 25 },  // Category Names
      { wch: 30 }   // Notes
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

