import fetch from 'node-fetch';

/**
 * Service for integrating with ServiceNow via ALMA API with two-step authentication
 * Step 1: Authenticate to get token
 * Step 2: Use token to fetch project data from ServiceNow based on RITM code
 */

/**
 * Fetch project data from ServiceNow using RITM code
 * @param {string} ritmCode - The ServiceNow RITM code (e.g., RITM0012345)
 * @returns {Promise<Object>} - Project data from ServiceNow
 */
export async function fetchServiceNowData(ritmCode) {
  const almaAuthUrl = process.env.ALMA_AUTH_URL;
  const almaAuthUser = process.env.ALMA_AUTH_USER;
  const almaAuthPass = process.env.ALMA_AUTH_PASS;
  const almaSnUrl = process.env.ALMA_SN_URL;

  if (!almaAuthUrl || !almaAuthUser || !almaAuthPass || !almaSnUrl) {
    throw new Error('ServiceNow API configuration is missing. Please check ALMA_AUTH_URL, ALMA_AUTH_USER, ALMA_AUTH_PASS, and ALMA_SN_URL environment variables.');
  }

  if (!ritmCode || !ritmCode.startsWith('RITM')) {
    throw new Error('Invalid RITM code format. RITM code must start with "RITM".');
  }

  console.log(`🔍 Fetching ServiceNow data for RITM: ${ritmCode}`);

  try {
    // Step 1: Authenticate to get token
    console.log('🔐 Step 1: Authenticating with ALMA API...');
    
    const authResponse = await fetch(almaAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: almaAuthUser,
        password: almaAuthPass
      })
    });

    if (!authResponse.ok) {
      if (authResponse.status === 401) {
        throw new Error('Authentication failed. Please check your ALMA credentials (ALMA_AUTH_USER and ALMA_AUTH_PASS).');
      }
      if (authResponse.status === 403) {
        throw new Error('Access denied. Insufficient permissions for ALMA authentication.');
      }
      throw new Error(`Authentication API request failed with status: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    console.log('🔐 Authentication response received');

    // Extract token from the 'data' property
    const token = authData.data;
    if (!token) {
      throw new Error('No authentication token received from ALMA API');
    }

    console.log('✅ Authentication successful, token obtained');

    // Step 2: Use token to fetch ServiceNow data
    console.log('📞 Step 2: Fetching ServiceNow data...');
    
    const snRequestBody = {
      snUrl: `/api/now/table/sc_req_item?sysparm_query=number=${ritmCode}&sysparm_limit=1`,
      snRequestMethod: 'GET'
    };

    // DEBUGGING: Log the complete request details
    console.log('🔍 ALMA ServiceNow Request Debug:');
    console.log('  - ALMA SN URL (almaSnUrl):', almaSnUrl);
    console.log('  - ServiceNow Request Body:', JSON.stringify(snRequestBody, null, 2));
    console.log('  - ServiceNow Internal URL:', snRequestBody.snUrl);
    console.log('  - Authentication Token Length:', token ? token.length : 'No token');
    console.log('  - Request Headers:', {
      'Content-Type': 'application/json',
      'ALMA-Auth-Token': `Bearer ${token ? token.substring(0, 20) + '...' : 'No token'}`
    });

    const snResponse = await fetch(almaSnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ALMA-Auth-Token': `Bearer ${token}`
      },
      body: JSON.stringify(snRequestBody)
    });

    // DEBUGGING: Log response details before checking if it's ok
    console.log('📥 ServiceNow Response Debug:');
    console.log('  - Status Code:', snResponse.status);
    console.log('  - Status Text:', snResponse.statusText);
    console.log('  - Response Headers:', Object.fromEntries(snResponse.headers.entries()));

    if (!snResponse.ok) {
      // Get response text for more detailed error information
      let errorResponseText = '';
      try {
        errorResponseText = await snResponse.text();
        console.log('❌ ServiceNow Error Response Body:', errorResponseText);
      } catch (textError) {
        console.log('❌ Could not read error response body:', textError.message);
      }

      if (snResponse.status === 401) {
        throw new Error('Authentication failed. Token may have expired or be invalid.');
      }
      if (snResponse.status === 403) {
        throw new Error('Access denied. Insufficient permissions to access ServiceNow table.');
      }
      if (snResponse.status === 404) {
        throw new Error(`ServiceNow resource not found (404). Check if the ServiceNow URL is correct: ${snRequestBody.snUrl}. Response: ${errorResponseText}`);
      }
      throw new Error(`ServiceNow API request failed with status: ${snResponse.status} (${snResponse.statusText}). Response: ${errorResponseText}`);
    }

    const snData = await snResponse.json();
    console.log('📥 ServiceNow API response received');

    // PASO 1: Logging detallado para análisis de estructura
    console.log('🔍 FULL ServiceNow Response Structure:', JSON.stringify(snData, null, 2));
    console.log('🎯 ServiceNow Response Data Property:', JSON.stringify(snData.data, null, 2));
    
    // Análisis de estructura para debugging
    if (snData.data) {
      if (snData.data.result) {
        console.log('✅ Found data.result - Array length:', Array.isArray(snData.data.result) ? snData.data.result.length : 'Not an array');
        if (Array.isArray(snData.data.result) && snData.data.result.length > 0) {
          console.log('📋 First result structure:', JSON.stringify(snData.data.result[0], null, 2));
        }
      } else {
        console.log('⚠️ No data.result found');
        if (Array.isArray(snData.data)) {
          console.log('📊 data is array with length:', snData.data.length);
          if (snData.data.length > 0) {
            console.log('📋 First data element structure:', JSON.stringify(snData.data[0], null, 2));
          }
        } else {
          console.log('📊 data keys:', Object.keys(snData.data));
        }
      }
    } else {
      console.log('❌ No data property found in response');
    }

    // Extract data from the 'data' property and parse project data
    const serviceNowData = snData.data;
    const projectData = parseServiceNowResponse(serviceNowData, ritmCode);
    
    console.log('✅ ServiceNow data processed successfully');
    return projectData;

  } catch (error) {
    console.error('❌ ServiceNow API error:', error.message);
    throw error;
  }
}

/**
 * Parse ServiceNow API response and map to project fields
 * @param {Object} data - Raw ServiceNow API response
 * @param {string} ritmCode - Original RITM code for reference
 * @returns {Object} - Mapped project data
 */
function parseServiceNowResponse(data, ritmCode) {
  try {
    console.log('🔄 Starting parseServiceNowResponse with ritmCode:', ritmCode);
    console.log('🔄 Data received for parsing:', JSON.stringify(data, null, 2));

    let results = [];
    
    // PASO 2: Análisis adaptativo de la estructura de datos
    if (data && data.result && Array.isArray(data.result)) {
      // Estructura estándar: { result: [...] }
      results = data.result;
      console.log('📊 Using data.result - found', results.length, 'results');
    } else if (Array.isArray(data)) {
      // Estructura alternativa: datos directamente como array
      results = data;
      console.log('📊 Using data directly as array - found', results.length, 'results');
    } else if (data && typeof data === 'object') {
      // Buscar otras propiedades que puedan contener los resultados
      const possibleArrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (possibleArrayKeys.length > 0) {
        results = data[possibleArrayKeys[0]];
        console.log('📊 Using data.' + possibleArrayKeys[0] + ' - found', results.length, 'results');
      } else {
        console.log('⚠️ No array found in data object. Available keys:', Object.keys(data));
        results = [];
      }
    } else {
      console.log('❌ Data is not in expected format:', typeof data);
      results = [];
    }

    if (!results || results.length === 0) {
      console.log('❌ No results found for RITM:', ritmCode);
      throw new Error(`No data found for RITM code: ${ritmCode}`);
    }

    const record = results[0]; // Take the first matching record
    console.log('📋 Processing record:', JSON.stringify(record, null, 2));

    // PASO 3: Mapeo adaptativo de campos ServiceNow a campos de proyecto
    const projectData = {
      ritm_code: ritmCode,
      project_name: record.short_description || record.description || record.title || '',
      client: record.owner_delivery || record.requested_for || record.client || '',
      datacenter: record.Datacenter || record.datacenter || record.location || record.site || '',
      excel_file_path: extractLatestExcelFile(record)
    };

    console.log('📋 Mapped project data:');
    console.log('  - RITM Code:', projectData.ritm_code);
    console.log('  - Project Name:', projectData.project_name || '(empty)');
    console.log('  - Client:', projectData.client || '(empty)');
    console.log('  - Datacenter:', projectData.datacenter || '(empty)');
    console.log('  - Excel File Path:', projectData.excel_file_path || '(empty)');
    
    // Mostrar todos los campos disponibles para análisis futuro
    console.log('📋 Available fields in record:', Object.keys(record));
    console.log('📋 Record field analysis:');
    Object.keys(record).forEach(key => {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) {
        console.log(`  - ${key}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`);
      } else if (value !== null && value !== undefined && value !== '') {
        console.log(`  - ${key}: ${typeof value} - ${JSON.stringify(value).substring(0, 100)}`);
      }
    });

    return projectData;

  } catch (error) {
    console.error('❌ Error parsing ServiceNow response:', error.message);
    throw new Error(`Failed to parse ServiceNow data: ${error.message}`);
  }
}

/**
 * Extract the latest .xlsx file from ServiceNow attachments
 * @param {Object} record - ServiceNow record
 * @returns {string} - Path to the latest Excel file or empty string
 */
function extractLatestExcelFile(record) {
  try {
    console.log('📎 Starting extractLatestExcelFile');
    console.log('📎 Record keys for attachment search:', Object.keys(record));
    
    // PASO 4: Búsqueda adaptativa de archivos Excel
    // Buscar en múltiples posibles ubicaciones de adjuntos
    let excelFiles = [];
    
    // Opción 1: Array de adjuntos directo
    if (record.attachments && Array.isArray(record.attachments)) {
      console.log('📎 Found attachments array with', record.attachments.length, 'items');
      excelFiles = record.attachments.filter(attachment => 
        attachment.file_name && attachment.file_name.toLowerCase().endsWith('.xlsx')
      );
    }
    
    // Opción 2: Buscar en propiedades que contengan 'attach', 'file' o 'document'
    if (excelFiles.length === 0) {
      Object.keys(record).forEach(key => {
        const lowerKey = key.toLowerCase();
        if ((lowerKey.includes('attach') || lowerKey.includes('file') || lowerKey.includes('document')) && 
            Array.isArray(record[key])) {
          console.log(`📎 Checking ${key} for Excel files`);
          const filesInProperty = record[key].filter(item => 
            item && item.file_name && item.file_name.toLowerCase().endsWith('.xlsx')
          );
          excelFiles = excelFiles.concat(filesInProperty);
        }
      });
    }
    
    // Opción 3: Campos directos con nombres de archivo
    const directFileFields = ['excel_attachment', 'excel_file', 'attachment', 'document_path'];
    for (const field of directFileFields) {
      if (record[field] && typeof record[field] === 'string' && 
          record[field].toLowerCase().includes('.xlsx')) {
        console.log(`📎 Found Excel file in direct field ${field}: ${record[field]}`);
        return record[field];
      }
    }
    
    // Procesar archivos Excel encontrados
    if (excelFiles.length > 0) {
      console.log(`📎 Found ${excelFiles.length} Excel files`);
      
      // Sort by created date and get the latest
      excelFiles.sort((a, b) => {
        const dateA = new Date(a.sys_created_on || a.created_on || a.date || 0);
        const dateB = new Date(b.sys_created_on || b.created_on || b.date || 0);
        return dateB - dateA;
      });
      
      const latestFile = excelFiles[0];
      console.log(`📎 Selected latest Excel file: ${latestFile.file_name}`);
      
      return latestFile.download_link || latestFile.file_path || latestFile.url || '';
    }

    console.log('📎 No Excel files found in any location');
    return '';

  } catch (error) {
    console.warn('⚠️ Error extracting Excel file:', error.message);
    console.warn('⚠️ Record structure for debugging:', JSON.stringify(record, null, 2));
    return '';
  }
}