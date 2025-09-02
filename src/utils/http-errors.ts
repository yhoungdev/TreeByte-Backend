export class HttpError extends Error {
  public statusCode: number;
  public type: string;
  public detail?: string;
  public instance?: string;

  constructor(statusCode: number, message: string, type?: string, detail?: string, instance?: string) {
    super(message);
    this.statusCode = statusCode;
    this.type = type || `urn:problem-type:${statusCode}`;
    this.detail = detail;
    this.instance = instance;
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      type: this.type,
      title: this.message,
      status: this.statusCode,
      detail: this.detail,
      instance: this.instance
    };
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', detail?: string, instance?: string) {
    super(400, message, 'urn:problem-type:bad-request', detail, instance);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', detail?: string, instance?: string) {
    super(401, message, 'urn:problem-type:unauthorized', detail, instance);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', detail?: string, instance?: string) {
    super(403, message, 'urn:problem-type:forbidden', detail, instance);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', detail?: string, instance?: string) {
    super(404, message, 'urn:problem-type:not-found', detail, instance);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', detail?: string, instance?: string) {
    super(409, message, 'urn:problem-type:conflict', detail, instance);
  }
}

export class BadGatewayError extends HttpError {
  constructor(message = 'Bad Gateway', detail?: string, instance?: string) {
    super(502, message, 'urn:problem-type:bad-gateway', detail, instance);
  }
}

export class FailedDependencyError extends HttpError {
  constructor(message = 'Failed Dependency', detail?: string, instance?: string) {
    super(424, message, 'urn:problem-type:failed-dependency', detail, instance);
  }
}

export const handleHttpError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  // Default to 500 Internal Server Error
  return res.status(500).json({
    type: 'urn:problem-type:internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
};