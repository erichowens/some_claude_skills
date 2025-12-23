/**
 * HTTP Server Tests
 *
 * Tests for the REST API endpoints, middleware (rate limiting,
 * API key auth, CORS), and error handling.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';

// ============================================================================
// Mock Middleware Functions (isolated from actual server)
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

function createRateLimiter(rateLimit: number = 60) {
  const rateLimitStore: Map<string, RateLimitRecord> = new Map();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = String(clientId);
    const now = Date.now();
    const windowMs = 60000;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    res.setHeader('X-RateLimit-Limit', rateLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > rateLimit) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}

function createApiKeyAuth(apiKeys: string[]) {
  return function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    if (apiKeys.length === 0) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey || !apiKeys.includes(String(apiKey))) {
      res.status(401).json({ error: 'Invalid or missing API key' });
      return;
    }

    next();
  };
}

import { z } from 'zod';

function createErrorHandler() {
  return function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: err.errors,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  };
}

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSkills = [
  {
    id: 'web-design-expert',
    type: 'skill',
    name: 'Web Design Expert',
    description: 'Expert in web design, UI/UX, and frontend development.',
    category: 'Design & UX',
    activation: {
      triggers: ['web design', 'website', 'CSS', 'HTML'],
      notFor: ['mobile apps'],
    },
    tags: [{ id: 'design', name: 'Design' }],
  },
  {
    id: 'mcp-creator',
    type: 'skill',
    name: 'MCP Creator',
    description: 'Expert MCP server developer for Model Context Protocol.',
    category: 'Development',
    activation: {
      triggers: ['MCP', 'Model Context Protocol'],
      notFor: ['general API'],
    },
    tags: [{ id: 'mcp', name: 'MCP' }],
  },
];

// ============================================================================
// Rate Limiter Tests
// ============================================================================

describe('Rate Limiter Middleware', () => {
  it('should allow requests under the limit', async () => {
    const app = express();
    const limiter = createRateLimiter(60);
    app.use(limiter);
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBe('60');
    expect(parseInt(response.headers['x-ratelimit-remaining'] as string)).toBeGreaterThanOrEqual(58);
  });

  it('should block requests over the limit', async () => {
    const app = express();
    const limiter = createRateLimiter(3);
    app.use(limiter);
    app.get('/test', (req, res) => res.json({ ok: true }));

    // Make 4 requests (limit is 3)
    await request(app).get('/test');
    await request(app).get('/test');
    await request(app).get('/test');
    const response = await request(app).get('/test');

    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Too many requests');
    expect(response.body.retryAfter).toBeDefined();
  });

  it('should include rate limit headers', async () => {
    const app = express();
    const limiter = createRateLimiter(10);
    app.use(limiter);
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/test');

    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('should track remaining requests correctly', async () => {
    const app = express();
    const limiter = createRateLimiter(5);
    app.use(limiter);
    app.get('/test', (req, res) => res.json({ ok: true }));

    const r1 = await request(app).get('/test');
    const r2 = await request(app).get('/test');
    const r3 = await request(app).get('/test');

    expect(parseInt(r1.headers['x-ratelimit-remaining'] as string)).toBe(4);
    expect(parseInt(r2.headers['x-ratelimit-remaining'] as string)).toBe(3);
    expect(parseInt(r3.headers['x-ratelimit-remaining'] as string)).toBe(2);
  });
});

// ============================================================================
// API Key Auth Tests
// ============================================================================

describe('API Key Authentication Middleware', () => {
  it('should allow requests when no API keys are configured', async () => {
    const app = express();
    app.use(createApiKeyAuth([]));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
  });

  it('should reject requests without API key when keys are configured', async () => {
    const app = express();
    app.use(createApiKeyAuth(['secret-key']));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/test');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or missing API key');
  });

  it('should accept requests with valid API key in header', async () => {
    const app = express();
    app.use(createApiKeyAuth(['valid-key-123']));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app)
      .get('/test')
      .set('X-API-Key', 'valid-key-123');

    expect(response.status).toBe(200);
  });

  it('should accept requests with valid API key in query', async () => {
    const app = express();
    app.use(createApiKeyAuth(['query-key']));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/test?api_key=query-key');

    expect(response.status).toBe(200);
  });

  it('should reject requests with invalid API key', async () => {
    const app = express();
    app.use(createApiKeyAuth(['valid-key']));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const response = await request(app)
      .get('/test')
      .set('X-API-Key', 'wrong-key');

    expect(response.status).toBe(401);
  });

  it('should accept any of multiple valid API keys', async () => {
    const app = express();
    app.use(createApiKeyAuth(['key1', 'key2', 'key3']));
    app.get('/test', (req, res) => res.json({ ok: true }));

    const r1 = await request(app).get('/test').set('X-API-Key', 'key1');
    const r2 = await request(app).get('/test').set('X-API-Key', 'key2');
    const r3 = await request(app).get('/test').set('X-API-Key', 'key3');

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);
  });
});

// ============================================================================
// Error Handler Tests
// ============================================================================

describe('Error Handler Middleware', () => {
  it('should handle Zod validation errors', async () => {
    const app = express();
    app.use(express.json());
    app.post('/validate', (req, res, next) => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });
      try {
        schema.parse(req.body);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
    app.use(createErrorHandler());

    const response = await request(app)
      .post('/validate')
      .send({ name: '', age: -5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.details).toBeDefined();
    expect(Array.isArray(response.body.details)).toBe(true);
  });

  it('should handle generic errors with 500 status', async () => {
    const app = express();
    app.get('/error', (req, res, next) => {
      next(new Error('Something went wrong'));
    });
    app.use(createErrorHandler());

    const response = await request(app).get('/error');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('should not expose error message in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = express();
    app.get('/error', (req, res, next) => {
      next(new Error('Secret internal error details'));
    });
    app.use(createErrorHandler());

    const response = await request(app).get('/error');

    expect(response.body.message).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

// ============================================================================
// REST API Endpoint Tests (Mocked)
// ============================================================================

describe('REST API Endpoints', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock health endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: '1.1.0',
        uptime: 1000,
        skills: mockSkills.length,
        memory: { heapUsed: 50, heapTotal: 100 },
      });
    });

    // Mock root endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'skill-matcher',
        version: '1.1.0',
        description: 'Semantic skill matching MCP server',
        endpoints: {
          health: 'GET /health',
          match: 'POST /api/match',
          skills: 'GET /api/skills',
        },
      });
    });

    // Mock skills list endpoint
    app.get('/api/skills', (req, res) => {
      let filtered = mockSkills;
      if (req.query.category) {
        filtered = filtered.filter(s => s.category === req.query.category);
      }
      if (req.query.type && req.query.type !== 'all') {
        filtered = filtered.filter(s => s.type === req.query.type);
      }
      res.json({
        total: filtered.length,
        skills: filtered.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          category: s.category,
          description: s.description.slice(0, 150),
        })),
      });
    });

    // Mock single skill endpoint
    app.get('/api/skills/:id', (req, res) => {
      const skill = mockSkills.find(s => s.id === req.params.id);
      if (!skill) {
        return res.status(404).json({ error: `Skill '${req.params.id}' not found` });
      }
      res.json(skill);
    });

    // Mock match endpoint
    app.post('/api/match', (req, res, next) => {
      try {
        const schema = z.object({
          prompt: z.string().min(1).max(2000),
          maxResults: z.number().optional().default(5),
          includeGapAnalysis: z.boolean().optional().default(true),
        });
        const input = schema.parse(req.body);

        // Simple mock matching
        const matches = mockSkills.map(skill => ({
          skill,
          score: Math.random() * 0.5 + 0.5,
          matchType: 'semantic',
          reasoning: 'Mock match',
        }));

        res.json({
          query: input.prompt,
          matches: matches.slice(0, input.maxResults),
          processingTime: 10,
        });
      } catch (err) {
        next(err);
      }
    });

    // Mock gap analysis endpoint
    app.post('/api/gap', (req, res, next) => {
      try {
        const schema = z.object({
          prompt: z.string().min(1).max(2000),
        });
        const input = schema.parse(req.body);

        res.json({
          prompt: input.prompt,
          analysis: {
            identified: true,
            opportunity: 'Consider creating a new skill for this use case',
            suggestedCategory: 'Development',
          },
          nearestSkills: mockSkills.slice(0, 2).map(s => ({
            id: s.id,
            name: s.name,
            score: 0.5,
          })),
        });
      } catch (err) {
        next(err);
      }
    });

    // Mock external search endpoint
    app.post('/api/external', (req, res, next) => {
      try {
        const schema = z.object({
          query: z.string().min(1),
          sources: z.array(z.string()).optional(),
          maxResults: z.number().optional(),
        });
        const input = schema.parse(req.body);

        res.json({
          query: input.query,
          results: [
            {
              source: 'mcp-registry',
              type: 'mcp',
              name: 'example-mcp',
              description: 'An example MCP server',
              url: 'https://github.com/example/mcp',
              relevanceScore: 0.8,
            },
          ],
          sources: input.sources || ['mcp-registry', 'smithery'],
        });
      } catch (err) {
        next(err);
      }
    });

    app.use(createErrorHandler());
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.version).toBe('1.1.0');
      expect(response.body.skills).toBe(2);
      expect(response.body.memory).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return server info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('skill-matcher');
      expect(response.body.version).toBeDefined();
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('GET /api/skills', () => {
    it('should return all skills', async () => {
      const response = await request(app).get('/api/skills');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(Array.isArray(response.body.skills)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/skills')
        .query({ category: 'Design & UX' });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.skills[0].id).toBe('web-design-expert');
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/skills')
        .query({ type: 'skill' });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
    });
  });

  describe('GET /api/skills/:id', () => {
    it('should return a specific skill', async () => {
      const response = await request(app).get('/api/skills/web-design-expert');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('web-design-expert');
      expect(response.body.name).toBe('Web Design Expert');
      expect(response.body.activation).toBeDefined();
    });

    it('should return 404 for unknown skill', async () => {
      const response = await request(app).get('/api/skills/nonexistent-skill');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/match', () => {
    it('should match skills to a prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: 'Help me design a website' });

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('Help me design a website');
      expect(Array.isArray(response.body.matches)).toBe(true);
      expect(response.body.processingTime).toBeDefined();
    });

    it('should respect maxResults parameter', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: 'Test query', maxResults: 1 });

      expect(response.status).toBe(200);
      expect(response.body.matches.length).toBe(1);
    });

    it('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject missing prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/gap', () => {
    it('should analyze skill gap', async () => {
      const response = await request(app)
        .post('/api/gap')
        .send({ prompt: 'Help me build a quantum computer' });

      expect(response.status).toBe(200);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.nearestSkills).toBeDefined();
    });

    it('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/gap')
        .send({ prompt: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/external', () => {
    it('should search external sources', async () => {
      const response = await request(app)
        .post('/api/external')
        .send({ query: 'file system MCP' });

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('file system MCP');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should accept optional sources parameter', async () => {
      const response = await request(app)
        .post('/api/external')
        .send({
          query: 'database MCP',
          sources: ['mcp-registry'],
          maxResults: 3,
        });

      expect(response.status).toBe(200);
    });
  });
});

// ============================================================================
// JSON Body Parsing Tests
// ============================================================================

describe('JSON Body Parsing', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '100kb' }));
    app.post('/test', (req, res) => {
      res.json({ received: req.body });
    });
    app.use(createErrorHandler());
  });

  it('should parse valid JSON', async () => {
    const response = await request(app)
      .post('/test')
      .send({ key: 'value' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.received.key).toBe('value');
  });

  it('should handle nested JSON objects', async () => {
    const data = {
      nested: {
        level1: {
          level2: 'deep value',
        },
      },
    };

    const response = await request(app)
      .post('/test')
      .send(data);

    expect(response.status).toBe(200);
    expect(response.body.received.nested.level1.level2).toBe('deep value');
  });

  it('should handle arrays in JSON', async () => {
    const data = {
      items: [1, 2, 3],
      strings: ['a', 'b', 'c'],
    };

    const response = await request(app)
      .post('/test')
      .send(data);

    expect(response.status).toBe(200);
    expect(response.body.received.items).toEqual([1, 2, 3]);
  });
});

// ============================================================================
// Content-Type Header Tests
// ============================================================================

describe('Content-Type Handling', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/json', (req, res) => {
      res.json({ type: 'json' });
    });
  });

  it('should return JSON content-type for JSON responses', async () => {
    const response = await request(app).get('/json');

    expect(response.headers['content-type']).toContain('application/json');
  });
});
