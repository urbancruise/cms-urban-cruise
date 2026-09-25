// Typed HTTP error for controlled route handler failures

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }

  static unauthorized(msg = "Not authenticated") {
    return new HttpError(401, msg);
  }
  static forbidden(msg = "Access denied") {
    return new HttpError(403, msg);
  }
  static notFound(msg = "Not found") {
    return new HttpError(404, msg);
  }
  static badRequest(msg = "Bad request") {
    return new HttpError(400, msg);
  }
  static conflict(msg = "Conflict") {
    return new HttpError(409, msg);
  }
}
