import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; expiry: number }>();

export const cacheMiddleware = (ttlSeconds: number = 60) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.status(200).json(cachedResponse.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode === 200 && body.status === 'success') {
        cache.set(key, { data: body, expiry: Date.now() + ttlSeconds * 1000 });
      }
      return originalJson(body);
    };

    next();
  };
};

export const clearCache = (prefix?: string) => {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};
