---
name: bot-developer
description: Expert bot developer specializing in Discord, Telegram, Slack automation with deep knowledge of rate limiting, state machines, event sourcing, moderation systems, and conversational AI integration
version: 1.0.0
category: AI & ML
tags:
  - bot-development
  - discord
  - telegram
  - slack
  - automation
  - moderation
  - state-machines
author: Erich Owens
---

# Bot Developer

Expert in building production-grade bots with proper architecture, state management, and scalability considerations.

## Architecture Patterns

### Event-Driven Bot Architecture

```
                         ┌─────────────────────────────────┐
                         │         Message Broker          │
                         │   (Redis Streams / RabbitMQ)    │
                         └──────────────┬──────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│  Command      │              │   Event       │              │  Scheduled    │
│  Processor    │              │   Handler     │              │  Task Runner  │
│               │              │               │              │               │
│ /cmd parsing  │              │ on_message    │              │ cron jobs     │
│ validation    │              │ on_reaction   │              │ reminders     │
│ permissions   │              │ on_join       │              │ cleanups      │
└───────┬───────┘              └───────┬───────┘              └───────┬───────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────────┐
                         │        Service Layer            │
                         │                                 │
                         │  ┌─────────┐  ┌─────────────┐  │
                         │  │ User    │  │ Moderation  │  │
                         │  │ Service │  │ Service     │  │
                         │  └─────────┘  └─────────────┘  │
                         │  ┌─────────┐  ┌─────────────┐  │
                         │  │ Economy │  │ Integration │  │
                         │  │ Service │  │ Service     │  │
                         │  └─────────┘  └─────────────┘  │
                         └──────────────┬──────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────────┐
                         │        Data Layer               │
                         │  PostgreSQL + Redis + S3        │
                         └─────────────────────────────────┘
```

### State Machine for Conversations

```python
from enum import Enum, auto
from typing import Callable, Optional
import asyncio

class State(Enum):
    IDLE = auto()
    AWAITING_CONFIRMATION = auto()
    COLLECTING_INPUT = auto()
    PROCESSING = auto()
    ERROR = auto()

class ConversationStateMachine:
    """
    Finite state machine for managing multi-turn conversations.

    Prevents race conditions and ensures clean state transitions.
    """

    def __init__(self, user_id: str, timeout: float = 300):
        self.user_id = user_id
        self.state = State.IDLE
        self.context: dict = {}
        self.timeout = timeout
        self._timeout_task: Optional[asyncio.Task] = None
        self._transitions: dict[tuple[State, str], tuple[State, Callable]] = {}

    def register_transition(self, from_state: State, event: str,
                           to_state: State, handler: Callable):
        """Register a valid state transition."""
        self._transitions[(from_state, event)] = (to_state, handler)

    async def handle_event(self, event: str, data: dict) -> Optional[str]:
        """Process event and execute transition if valid."""
        key = (self.state, event)

        if key not in self._transitions:
            return f"Cannot {event} from state {self.state.name}"

        to_state, handler = self._transitions[key]

        # Cancel existing timeout
        if self._timeout_task:
            self._timeout_task.cancel()

        # Execute handler
        try:
            result = await handler(self.context, data)
            self.state = to_state

            # Set new timeout if not idle
            if to_state != State.IDLE:
                self._timeout_task = asyncio.create_task(
                    self._handle_timeout()
                )

            return result
        except Exception as e:
            self.state = State.ERROR
            raise

    async def _handle_timeout(self):
        """Reset to IDLE after timeout."""
        await asyncio.sleep(self.timeout)
        self.state = State.IDLE
        self.context = {}


# Usage example: Moderation flow
async def setup_ban_flow(machine: ConversationStateMachine):
    async def start_ban(ctx, data):
        ctx['target_user'] = data['target']
        ctx['reason'] = data.get('reason', 'No reason provided')
        return f"Confirm ban of {ctx['target_user']}? (yes/no)"

    async def confirm_ban(ctx, data):
        if data['response'].lower() == 'yes':
            # Execute ban
            await ban_user(ctx['target_user'], ctx['reason'])
            return f"Banned {ctx['target_user']}"
        return "Ban cancelled"

    async def cancel(ctx, data):
        return "Operation cancelled"

    machine.register_transition(State.IDLE, 'ban', State.AWAITING_CONFIRMATION, start_ban)
    machine.register_transition(State.AWAITING_CONFIRMATION, 'confirm', State.IDLE, confirm_ban)
    machine.register_transition(State.AWAITING_CONFIRMATION, 'cancel', State.IDLE, cancel)
```

## Rate Limiting (Production-Grade)

```python
import asyncio
import time
from dataclasses import dataclass
from collections import defaultdict
import redis.asyncio as redis

@dataclass
class RateLimitConfig:
    requests: int      # Number of requests
    window: int        # Time window in seconds
    burst: int = 0     # Additional burst allowance

class DistributedRateLimiter:
    """
    Token bucket rate limiter with Redis backend.

    Handles distributed deployments and provides consistent limiting
    across multiple bot instances.
    """

    def __init__(self, redis_client: redis.Redis, prefix: str = "ratelimit"):
        self.redis = redis_client
        self.prefix = prefix

    async def is_allowed(self, key: str, config: RateLimitConfig) -> tuple[bool, float]:
        """
        Check if request is allowed under rate limit.

        Returns: (allowed: bool, retry_after: float)

        Uses sliding window log algorithm for accuracy.
        """
        full_key = f"{self.prefix}:{key}"
        now = time.time()
        window_start = now - config.window

        async with self.redis.pipeline(transaction=True) as pipe:
            # Remove old entries
            await pipe.zremrangebyscore(full_key, 0, window_start)
            # Count current entries
            await pipe.zcard(full_key)
            # Add new entry
            await pipe.zadd(full_key, {str(now): now})
            # Set expiry
            await pipe.expire(full_key, config.window + 1)

            results = await pipe.execute()

        current_count = results[1]
        max_allowed = config.requests + config.burst

        if current_count < max_allowed:
            return True, 0

        # Calculate retry time
        oldest = await self.redis.zrange(full_key, 0, 0, withscores=True)
        if oldest:
            retry_after = oldest[0][1] + config.window - now
            return False, max(0, retry_after)

        return False, config.window


class AdaptiveRateLimiter:
    """
    Rate limiter that adapts to API responses.

    Handles Discord's dynamic rate limits, 429s, and global limits.
    """

    def __init__(self):
        self.buckets: dict[str, dict] = defaultdict(lambda: {
            'remaining': float('inf'),
            'reset_at': 0,
            'limit': float('inf')
        })
        self.global_lock = asyncio.Lock()
        self.global_reset_at = 0

    async def acquire(self, bucket: str) -> None:
        """Wait until we can make a request to this bucket."""
        # Check global limit first
        if self.global_reset_at > time.time():
            await asyncio.sleep(self.global_reset_at - time.time())

        bucket_info = self.buckets[bucket]

        if bucket_info['remaining'] <= 0:
            wait_time = bucket_info['reset_at'] - time.time()
            if wait_time > 0:
                await asyncio.sleep(wait_time)

        bucket_info['remaining'] -= 1

    def update_from_headers(self, bucket: str, headers: dict) -> None:
        """Update rate limit info from API response headers."""
        if 'X-RateLimit-Remaining' in headers:
            self.buckets[bucket]['remaining'] = int(headers['X-RateLimit-Remaining'])
        if 'X-RateLimit-Reset' in headers:
            self.buckets[bucket]['reset_at'] = float(headers['X-RateLimit-Reset'])
        if 'X-RateLimit-Limit' in headers:
            self.buckets[bucket]['limit'] = int(headers['X-RateLimit-Limit'])

        # Handle global rate limit
        if headers.get('X-RateLimit-Global'):
            retry_after = float(headers.get('Retry-After', 1))
            self.global_reset_at = time.time() + retry_after
```

## Moderation System

```python
from datetime import datetime, timedelta
from enum import IntEnum
from typing import Optional
import asyncpg

class ActionSeverity(IntEnum):
    NOTE = 0        # Just a record, no action
    WARNING = 1     # Formal warning
    MUTE = 2        # Temporary mute
    KICK = 3        # Remove from server
    TEMP_BAN = 4    # Temporary ban
    BAN = 5         # Permanent ban

class ModerationService:
    """
    Production moderation system with:
    - Point-based escalation
    - Automatic decay
    - Appeal system
    - Audit logging
    """

    POINT_CONFIG = {
        ActionSeverity.NOTE: 0,
        ActionSeverity.WARNING: 1,
        ActionSeverity.MUTE: 2,
        ActionSeverity.KICK: 3,
        ActionSeverity.TEMP_BAN: 5,
        ActionSeverity.BAN: 10,
    }

    DECAY_RATE = 0.1  # Points per day

    def __init__(self, db: asyncpg.Pool):
        self.db = db

    async def add_infraction(
        self,
        guild_id: int,
        user_id: int,
        moderator_id: int,
        action: ActionSeverity,
        reason: str,
        duration: Optional[timedelta] = None
    ) -> dict:
        """Record an infraction and return recommended action."""

        # Get current points (with decay applied)
        current_points = await self._get_user_points(guild_id, user_id)
        new_points = current_points + self.POINT_CONFIG[action]

        # Record infraction
        infraction_id = await self.db.fetchval("""
            INSERT INTO infractions (guild_id, user_id, moderator_id, action, reason, duration, points)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        """, guild_id, user_id, moderator_id, action.value, reason, duration, self.POINT_CONFIG[action])

        # Check escalation thresholds
        recommended_action = self._get_recommended_action(new_points)

        # Log to audit
        await self._audit_log(guild_id, {
            'type': 'INFRACTION_ADDED',
            'infraction_id': infraction_id,
            'user_id': user_id,
            'action': action.name,
            'new_total_points': new_points,
            'recommended_escalation': recommended_action.name if recommended_action else None
        })

        return {
            'infraction_id': infraction_id,
            'current_points': new_points,
            'recommended_action': recommended_action,
            'history_count': await self._get_infraction_count(guild_id, user_id)
        }

    async def _get_user_points(self, guild_id: int, user_id: int) -> float:
        """Get current points with time decay applied."""
        rows = await self.db.fetch("""
            SELECT points, created_at FROM infractions
            WHERE guild_id = $1 AND user_id = $2 AND pardoned = FALSE
        """, guild_id, user_id)

        total = 0.0
        now = datetime.utcnow()

        for row in rows:
            age_days = (now - row['created_at']).days
            decayed_points = max(0, row['points'] - (age_days * self.DECAY_RATE))
            total += decayed_points

        return total

    def _get_recommended_action(self, points: float) -> Optional[ActionSeverity]:
        """Get recommended escalation based on point total."""
        if points >= 15:
            return ActionSeverity.BAN
        elif points >= 10:
            return ActionSeverity.TEMP_BAN
        elif points >= 6:
            return ActionSeverity.KICK
        elif points >= 3:
            return ActionSeverity.MUTE
        return None


class AutoMod:
    """
    Automatic moderation with configurable rules.
    """

    def __init__(self, config: dict):
        self.rules = config.get('rules', {})

    async def check_message(self, message) -> list[dict]:
        """Check message against all rules, return violations."""
        violations = []

        # Spam detection (message frequency)
        if self.rules.get('spam_enabled'):
            if await self._check_spam(message):
                violations.append({
                    'rule': 'spam',
                    'action': self.rules['spam_action'],
                    'reason': 'Message spam detected'
                })

        # Caps lock abuse
        if self.rules.get('caps_enabled'):
            caps_ratio = sum(1 for c in message.content if c.isupper()) / max(len(message.content), 1)
            if caps_ratio > self.rules.get('caps_threshold', 0.7) and len(message.content) > 10:
                violations.append({
                    'rule': 'caps',
                    'action': self.rules['caps_action'],
                    'reason': 'Excessive caps lock'
                })

        # Link filtering
        if self.rules.get('links_enabled'):
            import re
            urls = re.findall(r'https?://\S+', message.content)
            for url in urls:
                if not any(allowed in url for allowed in self.rules.get('link_whitelist', [])):
                    violations.append({
                        'rule': 'links',
                        'action': self.rules['links_action'],
                        'reason': f'Unauthorized link: {url}'
                    })

        # Word filter (with Levenshtein for bypass attempts)
        if self.rules.get('words_enabled'):
            from rapidfuzz import fuzz
            words = message.content.lower().split()
            for word in words:
                for banned in self.rules.get('banned_words', []):
                    if fuzz.ratio(word, banned) > 85:  # Catches l33t speak, typos
                        violations.append({
                            'rule': 'banned_word',
                            'action': self.rules['words_action'],
                            'reason': f'Banned word detected'
                        })
                        break

        return violations
```

## Discord.py Production Template

```python
import discord
from discord import app_commands
from discord.ext import commands, tasks
import asyncpg
import redis.asyncio as redis
import logging
import sys
from typing import Optional

# Proper logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('bot.log')
    ]
)
logger = logging.getLogger('bot')

class ProductionBot(commands.Bot):
    """Production-ready Discord bot with proper resource management."""

    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        super().__init__(
            command_prefix=commands.when_mentioned_or('!'),
            intents=intents,
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="for /help"
            )
        )

        self.db: Optional[asyncpg.Pool] = None
        self.redis: Optional[redis.Redis] = None

    async def setup_hook(self) -> None:
        """Called when bot is starting up."""
        # Database connection pool
        self.db = await asyncpg.create_pool(
            'postgresql://user:pass@localhost/botdb',
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info("Database pool created")

        # Redis connection
        self.redis = redis.Redis.from_url(
            'redis://localhost:6379',
            decode_responses=True
        )
        logger.info("Redis connected")

        # Load cogs
        for cog in ['moderation', 'economy', 'fun', 'admin']:
            try:
                await self.load_extension(f'cogs.{cog}')
                logger.info(f"Loaded cog: {cog}")
            except Exception as e:
                logger.error(f"Failed to load cog {cog}: {e}")

        # Sync commands
        await self.tree.sync()
        logger.info("Commands synced")

        # Start background tasks
        self.cleanup_task.start()

    async def close(self) -> None:
        """Cleanup on shutdown."""
        logger.info("Shutting down...")

        self.cleanup_task.cancel()

        if self.db:
            await self.db.close()
        if self.redis:
            await self.redis.close()

        await super().close()

    @tasks.loop(hours=1)
    async def cleanup_task(self):
        """Periodic cleanup of expired data."""
        async with self.db.acquire() as conn:
            # Remove expired mutes
            await conn.execute("""
                DELETE FROM mutes WHERE expires_at < NOW()
            """)
            # Clean old audit logs
            await conn.execute("""
                DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'
            """)

    async def on_error(self, event: str, *args, **kwargs):
        """Global error handler."""
        logger.exception(f"Error in {event}")

        # Notify developers
        if self.redis:
            await self.redis.publish('bot_errors', f"Error in {event}")
```

## Telegram Bot with Webhooks

```python
from fastapi import FastAPI, Request
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters
import hmac
import hashlib

app = FastAPI()

# Telegram app (don't use polling in production!)
telegram_app = Application.builder().token(BOT_TOKEN).build()

@app.post("/webhook/{token}")
async def telegram_webhook(token: str, request: Request):
    """Receive Telegram updates via webhook."""

    # Verify token matches (simple security)
    if token != WEBHOOK_TOKEN:
        return {"error": "Invalid token"}

    # Verify Telegram signature if using secret_token
    secret_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if secret_token != TELEGRAM_SECRET:
        return {"error": "Invalid signature"}

    data = await request.json()
    update = Update.de_json(data, telegram_app.bot)

    await telegram_app.process_update(update)

    return {"ok": True}

# Set webhook on startup
@app.on_event("startup")
async def setup_webhook():
    await telegram_app.bot.set_webhook(
        url=f"https://mybot.com/webhook/{WEBHOOK_TOKEN}",
        secret_token=TELEGRAM_SECRET,
        allowed_updates=["message", "callback_query"],
        drop_pending_updates=True
    )
```

## Security Checklist

```
TOKEN SECURITY
├── Never commit tokens to git
├── Use environment variables or secret manager
├── Rotate tokens if exposed
└── Use separate tokens for dev/staging/prod

PERMISSION CHECKS
├── Always verify user has permission before action
├── Use Discord's permission system, don't roll your own
├── Check bot's permissions before attempting actions
└── Fail safely if permissions missing

INPUT VALIDATION
├── Sanitize all user input
├── Validate command arguments
├── Use parameterized queries (no SQL injection)
├── Rate limit user-triggered actions

AUDIT LOGGING
├── Log all moderation actions
├── Log permission changes
├── Log configuration changes
└── Retain logs for compliance period
```
