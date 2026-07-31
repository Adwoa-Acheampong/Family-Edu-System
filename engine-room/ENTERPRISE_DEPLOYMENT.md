# Enterprise Deployment Guide

## Overview

This guide covers the enterprise-grade enhancements made to the Family Edu Engine Room, including:

- **Multi-Agent Orchestration** - LangGraph-style stateful workflows
- **Async Task Queue** - Background processing for long-running operations  
- **Vector Database (RAG)** - Semantic search and knowledge retrieval
- **Qwen API Integration** - Cost-effective alternative to Gemini

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
├─────────────────────────────────────────────────────────────┤
│  /v1/curriculum/generate  →  Agent Orchestrator             │
│  /v1/grade-submission     →  Grader Agent                   │
│  /v1/tasks/{id}           →  Task Queue Status              │
│  /v1/search               →  Vector Store (RAG)             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Task Queue  │  │   Agents      │  │  Vector DB    │
│   (Redis/Celery)│  │ (Planner,     │  │  (ChromaDB/   │
│               │  │  Researcher,  │  │   Qdrant)     │
│               │  │  Architect,   │  │               │
│               │  │  Grader, QA)  │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Configuration

### Environment Variables

Add these to your `engine-room/.env` file:

```bash
# AI Model Configuration
GEMINI_API_KEY=your_gemini_key_here
QWEN_API_KEY=your_qwen_key_here  # Optional: enables Qwen for cost savings

# Vector Database Configuration
VECTOR_BACKEND=chromadb  # Options: memory, chromadb, qdrant, pinecone
QDRANT_URL=http://localhost:6333  # If using Qdrant
QDRANT_API_KEY=  # Optional
PINECONE_API_KEY=  # Optional
PINECONE_ENVIRONMENT=us-east-1  # Optional

# Task Queue Configuration (for production)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

## New Services

### 1. Agent Orchestrator (`services/orchestrator.py`)

Implements a multi-agent system with specialized roles:

- **Planner**: Breaks down curriculum requests into execution steps
- **Researcher**: Fetches web resources and validates quality
- **CurriculumArchitect**: Structures learning paths from source material
- **Grader**: Evaluates submissions against rubrics
- **QualityAssurance**: Validates outputs before delivery
- **Orchestrator**: Coordinates workflow execution

**Usage Example:**

```python
from services.orchestrator import create_enterprise_agents, WorkflowContext, WorkflowState

# Initialize agents
agents = create_enterprise_agents(qwen_api_key="your-key")
orchestrator = agents[AgentRole.ORCHESTRATOR]

# Create workflow context
context = WorkflowContext(
    input_data={
        "certificationName": "Business Analyst Certification",
        "sourceType": "text_prompt",
        "prompt": "Create comprehensive BA curriculum based on BABOK",
    }
)

# Execute workflow
result = await orchestrator.execute_workflow(context)
print(f"Workflow completed: {result.state}")
print(f"Generated modules: {len(result.output_data.get('modules', []))}")
```

### 2. Task Queue (`services/task_queue.py`)

Provides async task processing with retry logic and priority queues:

**Features:**
- Priority-based task scheduling (LOW, NORMAL, HIGH, CRITICAL)
- Automatic retry with exponential backoff
- In-memory queue (development) or Celery+Redis (production)
- Task status polling

**Usage Example:**

```python
from services.task_queue import (
    submit_curriculum_generation,
    get_task_result,
    TaskStatus,
)

# Submit curriculum generation as background task
task_id = await submit_curriculum_generation(
    prompt="Project Management Professional (PMP) Certification",
    certification_name="PMP",
    persona="Master",
)

# Poll for completion
result = await get_task_result(task_id, wait=True, timeout=300)

if result["status"] == TaskStatus.COMPLETED:
    curriculum = result["result"]["curriculum"]
    print(f"Generated {len(curriculum['modules'])} modules")
elif result["status"] == TaskStatus.FAILED:
    print(f"Task failed: {result['error']}")
```

### 3. Vector Database (`services/vector_db.py`)

Enables RAG (Retrieval-Augmented Generation) for semantic search:

**Supported Backends:**
- **InMemory**: Development/testing (no dependencies)
- **ChromaDB**: Local embedded database (recommended for dev)
- **Qdrant**: Production-ready vector database
- **Pinecone**: Managed cloud service

**Usage Example:**

```python
from services.vector_db import (
    create_vector_store,
    VectorStoreConfig,
    Document,
    index_curriculum_module,
    search_curriculum_knowledge,
)

# Initialize vector store
config = VectorStoreConfig(backend="chromadb")
vector_store = create_vector_store(config)
await vector_store.initialize()

# Index curriculum content
module = {"id": "mod-1", "title": "Requirements Analysis", ...}
doc_ids = await index_curriculum_module(vector_store, module, "curr-123")

# Search for relevant content
results = await search_curriculum_knowledge(
    vector_store,
    query="How do I gather stakeholder requirements?",
    curriculum_id="curr-123",
    top_k=5,
)

for result in results:
    print(f"Score: {result.score:.2f} - {result.document.content[:100]}...")
```

## API Endpoints

### New Endpoints Added

#### POST /v1/curriculum/generate (Enhanced)

Now supports async task submission:

```bash
curl -X POST http://localhost:8000/v1/curriculum/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "AWS Solutions Architect Certification",
    "certificationName": "AWS SAA-C03",
    "persona": "Master"
  }'
```

Response includes `taskId` for polling if processed asynchronously.

#### GET /v1/tasks/{task_id}

Check status of background tasks:

```bash
curl http://localhost:8000/v1/tasks/abc123-def456
```

Response:
```json
{
  "id": "abc123-def456",
  "name": "curriculum.generate_from_prompt",
  "status": "completed",
  "priority": 5,
  "created_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:32:15Z",
  "result": {...},
  "error": null
}
```

#### POST /v1/search

Semantic search across curriculum knowledge base:

```bash
curl -X POST http://localhost:8000/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "agile methodology sprint planning",
    "curriculum_id": "curr-123",
    "content_type": "topic",
    "top_k": 5
  }'
```

## Production Deployment

### Docker Compose Setup

```yaml
version: '3.8'

services:
  engine-room:
    build: ./engine-room
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - QWEN_API_KEY=${QWEN_API_KEY}
      - VECTOR_BACKEND=chromadb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - chromadb
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chroma_data:/chroma

volumes:
  redis_data:
  chroma_data:
```

### Celery Worker Setup

For production task processing:

```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    'engine_room',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
```

Run workers:
```bash
celery -A celery_app worker --loglevel=info --concurrency=4
```

## Performance Optimization

### 1. Parallel Agent Execution

The orchestrator supports parallel execution for independent tasks:

```python
# In orchestrator.py, research phase can run in parallel
async def _execute_research(self, context):
    tasks = [
        researcher.execute(topic) 
        for topic in context.input_data.get("topics", [])
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
```

### 2. Vector Store Indexing

Batch index entire curricula efficiently:

```python
# Index all modules in parallel
async def index_full_curriculum(vector_store, curriculum):
    tasks = [
        index_curriculum_module(vector_store, module, curriculum.id)
        for module in curriculum.modules
    ]
    await asyncio.gather(*tasks)
```

### 3. Caching Strategy

Implement Redis caching for frequent queries:

```python
import redis
import json

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))

async def cached_search(query, curriculum_id):
    cache_key = f"search:{curriculum_id}:{hashlib.md5(query.encode()).hexdigest()}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Perform search
    results = await search_curriculum_knowledge(...)
    
    # Cache for 1 hour
    redis_client.setex(cache_key, 3600, json.dumps(results))
    return results
```

## Monitoring & Observability

### Health Checks

```bash
# Basic health
curl http://localhost:8000/health

# Detailed health with service status
curl http://localhost:8000/health/detail
```

### Metrics to Track

1. **Task Queue Metrics**
   - Tasks pending/processing/completed/failed
   - Average task duration
   - Retry rates

2. **Agent Performance**
   - Time per agent step
   - Success rate per agent type
   - Token usage per workflow

3. **Vector Store Metrics**
   - Index size (documents)
   - Query latency
   - Cache hit rate

### Logging Configuration

```python
# Structured JSON logging for production
{
    "timestamp": "2025-01-15T10:30:00Z",
    "level": "INFO",
    "service": "engine_room",
    "component": "orchestrator",
    "workflow_id": "wf-123",
    "message": "Workflow completed successfully",
    "duration_ms": 15230,
    "agent_steps": 6
}
```

## Security Considerations

1. **API Key Management**
   - Use environment variables or secret managers
   - Rotate keys regularly
   - Never commit keys to version control

2. **Input Validation**
   - All user inputs validated via Pydantic models
   - File uploads scanned and size-limited
   - Rate limiting recommended for public endpoints

3. **Data Privacy**
   - Student submissions encrypted at rest
   - PII stripped from logs
   - GDPR compliance for EU users

## Troubleshooting

### Common Issues

**Issue: Task queue not processing**
```bash
# Check if workers are running
ps aux | grep celery

# Restart task queue
pkill -f celery && celery -A celery_app worker --loglevel=info &
```

**Issue: Vector store connection failed**
```bash
# For ChromaDB
ls -la ./data/vectordb

# For Qdrant
curl http://localhost:6333/api/v1/collections
```

**Issue: Agent timeouts**
```bash
# Increase timeout in agent config
AgentConfig(
    role=AgentRole.CURRICULUM_ARCHITECT,
    timeout_seconds=300,  # Increase from default 120
)
```

## Migration Path

### From Current Implementation

1. **Phase 1**: Enable task queue (backward compatible)
   - Set `VECTOR_BACKEND=memory`
   - Existing endpoints continue working
   - New async endpoints available

2. **Phase 2**: Add vector search
   - Deploy ChromaDB
   - Index existing curricula
   - Enable `/v1/search` endpoint

3. **Phase 3**: Full agent orchestration
   - Set `QWEN_API_KEY` for cost optimization
   - Migrate curriculum generation to use agents
   - Enable quality assurance checks

## Next Steps

1. Configure environment variables in `.env`
2. Start with in-memory vector store for testing
3. Deploy ChromaDB for persistent storage
4. Set up Redis + Celery for production task queue
5. Monitor performance and scale horizontally as needed

---

For questions or issues, check the main repository issues or contact the development team.
