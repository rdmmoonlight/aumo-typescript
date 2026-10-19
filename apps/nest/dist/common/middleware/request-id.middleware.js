import { randomUUID } from 'node:crypto';
export const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[\w=-]{1,255}$/;
export function requestIdMiddleware(req, res, next) {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.locals.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
}
//# sourceMappingURL=request-id.middleware.js.map