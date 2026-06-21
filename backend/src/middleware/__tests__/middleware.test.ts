import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../validate';
import { cacheMiddleware, clearCache } from '../cache';
import { z } from 'zod';

// Helper to create a minimal mock Response
const mockRes = (statusCode = 200) => {
  const res: any = { statusCode };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middleware', () => {
  describe('validateRequest', () => {
    const schema = z.object({ test: z.string() });
    const middleware = validateRequest(schema);
    let req: Partial<Request>;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
      req = { body: {} };
      res = mockRes();
      next = jest.fn();
    });

    it('should call next() when validation passes', async () => {
      req.body = { test: 'valid' };
      await middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when field type is wrong', async () => {
      req.body = { test: 123 };
      await middleware(req as Request, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when required field is missing', async () => {
      req.body = {};
      await middleware(req as Request, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return an error object in response body', async () => {
      req.body = {};
      await middleware(req as Request, res, next);
      const call = res.json.mock.calls[0][0];
      expect(call.status).toBe('error');
      expect(call.error).toBeDefined(); // Zod error (may be array or ZodError object)
    });

    it('should pass extra fields if schema allows passthrough', async () => {
      req.body = { test: 'valid', extra: 'field' };
      await middleware(req as Request, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('cacheMiddleware', () => {
    let req: Partial<Request>;
    let res: any;
    let next: NextFunction;
    const ttl = 10;

    beforeEach(() => {
      clearCache();
      req = { method: 'GET', originalUrl: '/test-cache-' + Math.random() };
      res = mockRes();
      next = jest.fn();
    });

    it('should call next() for GET requests', () => {
      cacheMiddleware(ttl)(req as Request, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should bypass cache for POST requests', () => {
      req.method = 'POST';
      cacheMiddleware(ttl)(req as Request, res, next);
      expect(next).toHaveBeenCalled();
      // POST should not cache — calling again still calls next
      const res2 = mockRes();
      const next2 = jest.fn();
      cacheMiddleware(ttl)(req as Request, res2, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should bypass cache for PUT requests', () => {
      req.method = 'PUT';
      cacheMiddleware(ttl)(req as Request, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should bypass cache for DELETE requests', () => {
      req.method = 'DELETE';
      cacheMiddleware(ttl)(req as Request, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should cache a successful GET response and serve it on second request', () => {
      const url = '/unique-test-url-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      // Simulate controller writing a successful response
      res.json({ status: 'success', data: 'first response' });

      // Second request to same URL
      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);

      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ status: 'success', data: 'first response' });
      expect(next2).not.toHaveBeenCalled();
    });

    it('should NOT cache error responses (status !== success)', () => {
      const url = '/error-url-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      res.json({ status: 'error', data: null }); // not cached

      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);

      // Cache miss → next() called again
      expect(next2).toHaveBeenCalled();
      expect(res2.status).not.toHaveBeenCalledWith(200);
    });

    it('should NOT cache non-200 status responses', () => {
      const url = '/status-400-url-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      res.statusCode = 400;
      res.json({ status: 'success', data: 'bad' }); // statusCode is 400, should not cache

      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('clearCache() should remove all cached entries', () => {
      const url = '/clear-all-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      res.json({ status: 'success', data: 'cached' });

      clearCache(); // wipe everything

      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);
      expect(next2).toHaveBeenCalled(); // cache miss
    });

    it('clearCache(prefix) should only remove matching entries', () => {
      const url = '/api/match-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      res.json({ status: 'success', data: 'cached' });

      clearCache('/api'); // clears the entry above

      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);
      expect(next2).toHaveBeenCalled(); // cache cleared
    });

    it('clearCache(prefix) should NOT remove non-matching entries', () => {
      const url = '/keep-me-' + Date.now();
      req.originalUrl = url;

      const middleware = cacheMiddleware(ttl);
      middleware(req as Request, res, next);
      res.json({ status: 'success', data: 'preserved' });

      clearCache('/other-prefix'); // different prefix, should not clear /keep-me-

      const res2 = mockRes();
      const next2 = jest.fn();
      middleware({ ...req, originalUrl: url } as Request, res2, next2);
      expect(res2.status).toHaveBeenCalledWith(200); // cache hit
    });
  });
});
