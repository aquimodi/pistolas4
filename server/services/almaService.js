import fetch from 'node-fetch';

/**
 * Service for integrating with ServiceNow via ALMA API
 * Handles fetching project data from ServiceNow based on RITM code
 */

/**
 * Fetch project data from ServiceNow using RITM code
 * @param {string} ritmCode - The ServiceNow RITM code (e.g., RITM0012345)
 * @returns {Promise<Object>} - Project data from ServiceNow
 */
export async function fetchServiceNowData(ritmCode) {
  const almaApiUrl = process.env.ALMA_API_URL;
  const almaAuthToken = process.env.ALMA_AUTH_TOKEN;

  if (!almaApiUrl || !almaAuthToken) {
    throw new Error('ServiceNow API configuration is missing. Please check ALMA_API_URL and ALMA_AUTH_TOKEN environment variables.');
  }

  if (!ritmCode || !ritmCode.startsWith('RITM')) {
    throw new Error('Invalid RITM code format. RITM code must start with "RITM".');
  }

  console.log(`🔍 Fetching ServiceNow data for RITM: ${ritmCode}`);

  try {
    const requestBody = {
      snUrl: `/api/now/table/sc_req_item_list?sysparm_query=number=${ritmCode}`,
      snRequestMethod: 'GET'
    };

    const response = await fetch(almaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ALMA-Auth-Token': `Bearer ${almaAuthToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your ALMA-Auth-Token.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Insufficient permissions to access ServiceNow table.');
      }
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 ServiceNow API response received');

    // Parse the response and extract project data
    const projectData = parseServiceNowResponse(data, ritmCode);
    
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
    // ServiceNow typically returns data in a 'result' array
    const results = data.result || [];
    
    if (!results || results.length === 0) {
      throw new Error(`No data found for RITM code: ${ritmCode}`);
    }

    const record = results[0]; // Take the first matching record

    // Map ServiceNow fields to project fields
    const projectData = {
      ritm_code: ritmCode,
      project_name: record.short_description || '',
      client: record.owner_delivery || '',
      datacenter: record.Datacenter || record.datacenter || '', // Try both field names
      excel_file_path: extractLatestExcelFile(record)
    };

    console.log('📋 Mapped project data:', {
      ritm_code: projectData.ritm_code,
      project_name: projectData.project_name ? '✓' : '✗',
      client: projectData.client ? '✓' : '✗',
      datacenter: projectData.datacenter ? '✓' : '✗',
      excel_file_path: projectData.excel_file_path ? '✓' : '✗'
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
    // ServiceNow attachments are typically in sys_attachment table
    // This is a simplified approach - you may need to adjust based on actual ServiceNow structure
    
    if (record.attachments && Array.isArray(record.attachments)) {
      const excelFiles = record.attachments.filter(attachment => 
        attachment.file_name && attachment.file_name.toLowerCase().endsWith('.xlsx')
      );
      
      if (excelFiles.length > 0) {
        // Sort by created date and get the latest
        excelFiles.sort((a, b) => new Date(b.sys_created_on) - new Date(a.sys_created_on));
        const latestFile = excelFiles[0];
        
        console.log(`📎 Found Excel file: ${latestFile.file_name}`);
        return latestFile.download_link || latestFile.file_path || '';
      }
    }

    // If no attachments found, check for direct file fields
    if (record.excel_attachment || record.excel_file) {
      return record.excel_attachment || record.excel_file;
    }

    console.log('📎 No Excel files found in ServiceNow record');
    return '';

  } catch (error) {
    console.warn('⚠️ Error extracting Excel file:', error.message);
    return '';
  }
}