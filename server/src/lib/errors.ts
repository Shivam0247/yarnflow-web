/** Errors thrown by services; the error handler turns them into JSON responses. */
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export const badRequest = (msg: string, details?: unknown) => new AppError(400, 'BAD_REQUEST', msg, details);
export const unprocessable = (msg: string, details?: unknown) => new AppError(422, 'VALIDATION', msg, details);
export const notFound = (what = 'Record') => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const forbidden = (msg = 'You do not have permission for this action') => new AppError(403, 'FORBIDDEN', msg);
export const unauthorized = (msg = 'Please sign in') => new AppError(401, 'UNAUTHORIZED', msg);
export const conflict = (msg: string) => new AppError(409, 'CONFLICT', msg);
export const locked = (msg = 'This financial year is locked') => new AppError(423, 'LOCKED', msg);
