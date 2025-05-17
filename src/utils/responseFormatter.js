/**
 * Response Formatter Utility
 * 
 * This utility ensures consistent response formats across all API endpoints.
 * It standardizes success and error responses to ensure the frontend can
 * reliably process them.
 */

/**
 * Format a success response with consistent structure
 * @param {Object} user - User object to include in the response
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {String} message - Optional success message
 * @param {Object} additionalData - Any additional data to include in the response
 * @returns {Object} Formatted response object
 */
exports.formatSuccessResponse = (user, statusCode = 200, message = null, additionalData = {}) => {
  // Create a consistent response format
  const response = {
    success: true,
    // Include user data in both 'user' and 'data' fields for backward compatibility
    user: user,
    data: user,
    ...additionalData
  };

  // Add message if provided
  if (message) {
    response.message = message;
  }

  return {
    statusCode,
    responseBody: response
  };
};

/**
 * Format an error response with consistent structure
 * @param {String} errorMessage - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} additionalData - Any additional data to include in the response
 * @returns {Object} Formatted error response object
 */
exports.formatErrorResponse = (errorMessage, statusCode = 400, additionalData = {}) => {
  return {
    statusCode,
    responseBody: {
      success: false,
      error: errorMessage,
      ...additionalData
    }
  };
};

/**
 * Send a formatted response
 * @param {Object} res - Express response object
 * @param {Object} formattedResponse - Response from formatSuccessResponse or formatErrorResponse
 */
exports.sendResponse = (res, formattedResponse) => {
  const { statusCode, responseBody } = formattedResponse;
  res.status(statusCode).json(responseBody);
};
