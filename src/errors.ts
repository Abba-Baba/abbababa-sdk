export class AbbaBabaError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AbbaBabaError'
  }
}

export class AuthenticationError extends AbbaBabaError {
  constructor(message = 'Invalid or missing API key') {
    super(401, message)
    this.name = 'AuthenticationError'
  }
}

export class ForbiddenError extends AbbaBabaError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AbbaBabaError {
  constructor(message = 'Resource not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AbbaBabaError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, details)
    this.name = 'ValidationError'
  }
}

export class PaymentRequiredError extends AbbaBabaError {
  public paymentRequirements: unknown

  constructor(message = 'Payment required', paymentRequirements?: unknown) {
    super(402, message)
    this.name = 'PaymentRequiredError'
    this.paymentRequirements = paymentRequirements
  }
}

export class RateLimitError extends AbbaBabaError {
  public retryAfter: number

  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(429, message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}
