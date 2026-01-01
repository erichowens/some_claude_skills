/**
 * HTTP Server Integration Tests
 *
 * Tests the actual http-server.ts module by importing and testing
 * the exported functions and Express app.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { z } from 'zod';

// Set test environment before importing the server
process.env.NODE_ENV = 'test';
process.env.PROJECT_ROOT = '/tmp/test-skills';

// Mock dependencies before importing the server
vi.mock('fs/promises', () => ({
  access: vi.fn().mockRejectedValue(new Error('Not found')),
  readdir: vi.fn().mockResolvedValue([]),
  readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('glob', () => ({
  glob: vi.fn().mockResolvedValue([]),
}));

// Import after mocking
import {
  app,
  rateLimiter,
  apiKeyAuth,
  errorHandler,
  generateReasoning,
  SERVER_INFO,
} from '../src/http-server.js';

// ============================================================================
// Rate Limiter Tests (Using actual implementation)
// ============================================================================

describe('Rate Limiter (Actual Implementation)', () => {
  it('should be a function', () => {
    expect(typeof rateLimiter).toBe('function');
  });

  it('should have middleware signature', () => {
    expect(rateLimiter.length).toBe(3); // req, res, next
  });
});

// ============================================================================
// API Key Auth Tests (Using actual implementation)
// ============================================================================

describe('API Key Auth (Actual Implementation)', () => {
  it('should be a function', () => {
    expect(typeof apiKeyAuth).toBe('function');
  });

  it('should have middleware signature', () => {
    expect(apiKeyAuth.length).toBe(3); // req, res, next
  });
});

// ============================================================================
// Error Handler Tests (Using actual implementation)
// ============================================================================

describe('Error Handler (Actual Implementation)', () => {
  it('should be a function', () => {
    expect(typeof errorHandler).toBe('function');
  });

  it('should have error handler signature', () => {
    expect(errorHandler.length).toBe(4); // err, req, res, next
  });
});

// ============================================================================
// Generate Reasoning Tests
// ============================================================================

describe('generateReasoning', () => {
  const mockSkill = {
    id: 'test-skill',
    type: 'skill' as const,
    name: 'Test Skill',
    description: 'A test skill',
    category: 'Development' as const,
    activation: {
      triggers: ['test', 'example'],
      notFor: [],
    },
    tags: [
      { id: 'dev', type: 'domain' as const },
      { id: 'testing', type: 'skill-type' as const },
    ],
  };

  it('should include keyword match info for high keyword scores', () => {
    const result = generateReasoning(mockSkill, 0.3, 0.7);
    expect(result).toContain('Strong keyword match');
  });

  it('should include semantic similarity info for high semantic scores', () => {
    const result = generateReasoning(mockSkill, 0.8, 0.3);
    expect(result).toContain('semantic similarity');
    expect(result).toContain('80%');
  });

  it('should include tags when present', () => {
    const result = generateReasoning(mockSkill, 0.5, 0.5);
    expect(result).toContain('Tags:');
    expect(result).toContain('dev');
  });

  it('should fallback to category when no strong matches', () => {
    const skillNoTags = { ...mockSkill, tags: [] };
    const result = generateReasoning(skillNoTags, 0.3, 0.3);
    expect(result).toContain('Development');
  });
});

// ============================================================================
// Server Info Tests
// ============================================================================

describe('SERVER_INFO', () => {
  it('should have correct server name', () => {
    expect(SERVER_INFO.name).toBe('skill-matcher');
  });

  it('should have version', () => {
    expect(SERVER_INFO.version).toBeDefined();
    expect(typeof SERVER_INFO.version).toBe('string');
  });

  it('should have start time', () => {
    expect(SERVER_INFO.startTime).toBeDefined();
    expect(typeof SERVER_INFO.startTime).toBe('number');
    expect(SERVER_INFO.startTime).toBeLessThanOrEqual(Date.now());
  });
});

// ============================================================================
// Express App Tests
// ============================================================================

describe('Express App', () => {
  it('should be an express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
    expect(typeof app.use).toBe('function');
  });

  describe('GET /', () => {
    it('should return server info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('skill-matcher');
      expect(response.body.version).toBeDefined();
      expect(response.body.endpoints).toBeDefined();
    });

    it('should include documentation link', async () => {
      const response = await request(app).get('/');

      expect(response.body.documentation).toBeDefined();
      expect(response.body.documentation).toContain('someclaudeskills.com');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.version).toBe(SERVER_INFO.version);
      expect(response.body.uptime).toBeDefined();
      expect(response.body.memory).toBeDefined();
    });

    it('should include memory usage info', async () => {
      const response = await request(app).get('/health');

      expect(response.body.memory.heapUsed).toBeDefined();
      expect(response.body.memory.heapTotal).toBeDefined();
      expect(typeof response.body.memory.heapUsed).toBe('number');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});

// ============================================================================
// API Endpoints Tests
// ============================================================================

describe('API Endpoints', () => {
  describe('GET /api/skills', () => {
    it('should return skills list', async () => {
      const response = await request(app).get('/api/skills');

      expect(response.status).toBe(200);
      expect(response.body.total).toBeDefined();
      expect(Array.isArray(response.body.skills)).toBe(true);
    });

    it('should accept category filter', async () => {
      const response = await request(app)
        .get('/api/skills')
        .query({ category: 'development' });

      expect(response.status).toBe(200);
    });

    it('should accept type filter', async () => {
      const response = await request(app)
        .get('/api/skills')
        .query({ type: 'skill' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/skills/:id', () => {
    it('should return 404 for unknown skill', async () => {
      const response = await request(app).get('/api/skills/nonexistent-skill');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/match', () => {
    it('should accept valid prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: 'help me design a website' });

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('help me design a website');
    });

    it('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: '' });

      expect(response.status).toBe(400);
    });

    it('should reject missing prompt', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should accept maxResults parameter', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: 'test query', maxResults: 3 });

      expect(response.status).toBe(200);
    });

    it('should accept includeGapAnalysis parameter', async () => {
      const response = await request(app)
        .post('/api/match')
        .send({ prompt: 'test query', includeGapAnalysis: false });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/gap', () => {
    it('should accept valid prompt', async () => {
      const response = await request(app)
        .post('/api/gap')
        .send({ prompt: 'help with quantum computing' });

      expect(response.status).toBe(200);
      expect(response.body.prompt).toBe('help with quantum computing');
    });

    it('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/gap')
        .send({ prompt: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/external', () => {
    it('should accept valid query', async () => {
      const response = await request(app)
        .post('/api/external')
        .send({ query: 'file system MCP' });

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('file system MCP');
    });

    it('should accept optional sources', async () => {
      const response = await request(app)
        .post('/api/external')
        .send({
          query: 'database MCP',
          sources: ['mcp-registry'],
          maxResults: 5,
        });

      expect(response.status).toBe(200);
    });

    it('should reject empty query', async () => {
      const response = await request(app)
        .post('/api/external')
        .send({ query: '' });

      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// Security Headers Tests
// ============================================================================

describe('Security Headers', () => {
  it('should include helmet security headers', async () => {
    const response = await request(app).get('/');

    // Helmet adds various security headers
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should allow CORS', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:3000');

    // CORS headers should be present
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});
