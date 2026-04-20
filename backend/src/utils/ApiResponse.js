class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {*} data - Response data
   * @param {Object} meta - Pagination or other metadata
   */
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  static ok(message, data, meta) {
    return new ApiResponse(200, message, data, meta);
  }

  static created(message, data) {
    return new ApiResponse(201, message, data);
  }

  static noContent(message = 'Success') {
    return new ApiResponse(204, message);
  }

  /**
   * Send the response
   * @param {import('express').Response} res
   * @param {number} statusCode
   */
  send(res, statusCode = 200) {
    return res.status(statusCode).json(this);
  }
}

module.exports = ApiResponse;
