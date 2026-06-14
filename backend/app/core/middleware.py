import os
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as redis
from app.core.config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.redis = redis.from_url(settings.REDIS_URL)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        # Extremely basic rate limiter: 100 requests per minute
        try:
            current = await self.redis.get(key)
            if current and int(current) > 100:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
            
            pipe = self.redis.pipeline()
            pipe.incr(key, 1)
            pipe.expire(key, 60)
            await pipe.execute()
        except redis.ConnectionError:
            # If Redis is down, we allow the request but log the error
            pass
            
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
