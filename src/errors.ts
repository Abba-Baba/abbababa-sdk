export class AbbabaError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AbbabaError'
  }
}

export class AuthenticationError extends AbbabaError {
  constructor(message = 'Invalid or missing API key') {
    super(401, message)
    this.name = 'AuthenticationError'
  }
}

export class ForbiddenError extends AbbabaError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AbbabaError {
  constructor(message = 'Resource not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AbbabaError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, details)
    this.name = 'ValidationError'
  }
}

export class PaymentRequiredError extends AbbabaError {
  public paymentRequirements: unknown

  constructor(message = 'Payment required', paymentRequirements?: unknown) {
    super(402, message)
    this.name = 'PaymentRequiredError'
    this.paymentRequirements = paymentRequirements
  }
}

export class RateLimitError extends AbbabaError {
  public retryAfter: number

  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(429, message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}
