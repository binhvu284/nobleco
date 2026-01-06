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

    // Define headers according to the template format (in order specified by user)
    const headers = [
      'Product Code',
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
      'Categories'
    ];

    // Create sample data row (optional - can be empty)
    const sampleRow = [
      'CST-00000001',           // Product Code (required, unique)
      'Round, Excellent',        // Shape and Polished
      'Botswana',                // Origin
      'SER-001',                 // Item Serial
      'Botswana',                // Country of Origin
      'GIA-123456',              // Certification Number
      6.5,                       // Size (mm) - decimal
      'D',                       // Color
      'VS1',                     // Clarity
      1.5,                       // Weight (CT) - decimal
      1,                         // PCS - number
      'Excellent',               // Cut Grade
      'None',                    // Treatment
      88300000,                  // Price (VND) - required
      1,                         // Stock - defaults to 0 if null
      'Diamonds, Gemstones'     // Categories (comma-separated)
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
      { wch: 20 },  // Shape and Polished
      { wch: 15 },  // Origin
      { wch: 15 },  // Item Serial
      { wch: 18 },  // Country of Origin
      { wch: 18 },  // Certification Number
      { wch: 12 },  // Size (mm)
      { wch: 10 },  // Color
      { wch: 12 },  // Clarity
      { wch: 12 },  // Weight (CT)
      { wch: 8 },   // PCS
      { wch: 15 },  // Cut Grade
      { wch: 15 },  // Treatment
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Centerstones');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true 
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="centerstone-import-template.xlsx"');
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

