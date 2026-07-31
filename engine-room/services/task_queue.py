"""Async Task Queue Infrastructure.

Provides Celery-based task queuing for long-running operations like
curriculum generation, web scraping, and batch grading.

For production deployment with Redis broker.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Optional

logger = logging.getLogger("engine_room.tasks")


class TaskStatus(str, Enum):
    """Task execution statuses."""
    PENDING = "pending"
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class TaskPriority(int, Enum):
    """Task priority levels."""
    LOW = 0
    NORMAL = 5
    HIGH = 10
    CRITICAL = 15


class TaskRegistry:
    """In-memory task registry (Redis-backed in production)."""
    
    def __init__(self):
        self._tasks: dict[str, dict[str, Any]] = {}
        self._handlers: dict[str, Callable] = {}
    
    def register_task(self, name: str) -> Callable:
        """Decorator to register a task handler."""
        def decorator(func: Callable) -> Callable:
            self._handlers[name] = func
            logger.info("Registered task handler: %s", name)
            return func
        return decorator
    
    def create_task(
        self,
        name: str,
        args: tuple = (),
        kwargs: dict | None = None,
        priority: TaskPriority = TaskPriority.NORMAL,
        delay_seconds: int = 0,
    ) -> str:
        """Create a new task in the registry."""
        task_id = str(uuid.uuid4())
        scheduled_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
        
        self._tasks[task_id] = {
            "id": task_id,
            "name": name,
            "status": TaskStatus.PENDING,
            "priority": priority.value,
            "args": args,
            "kwargs": kwargs or {},
            "result": None,
            "error": None,
            "created_at": datetime.utcnow(),
            "started_at": None,
            "completed_at": None,
            "scheduled_at": scheduled_at,
            "retries": 0,
            "max_retries": 3,
        }
        
        logger.info("Created task %s: %s (priority=%d)", task_id, name, priority.value)
        return task_id
    
    def get_task(self, task_id: str) -> dict[str, Any] | None:
        """Get task status and result."""
        return self._tasks.get(task_id)
    
    def update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        result: Any = None,
        error: str | None = None,
    ) -> None:
        """Update task status and optionally set result/error."""
        if task_id not in self._tasks:
            raise ValueError(f"Task {task_id} not found")
        
        task = self._tasks[task_id]
        task["status"] = status
        
        if status == TaskStatus.STARTED or status == TaskStatus.IN_PROGRESS:
            task["started_at"] = datetime.utcnow()
        
        if status == TaskStatus.COMPLETED:
            task["completed_at"] = datetime.utcnow()
            task["result"] = result
        
        if status == TaskStatus.FAILED:
            task["completed_at"] = datetime.utcnow()
            task["error"] = error
        
        logger.debug("Task %s status updated to %s", task_id, status.value)
    
    async def execute_task(self, task_id: str) -> Any:
        """Execute a registered task."""
        if task_id not in self._tasks:
            raise ValueError(f"Task {task_id} not found")
        
        task = self._tasks[task_id]
        handler = self._handlers.get(task["name"])
        
        if not handler:
            raise ValueError(f"No handler registered for task: {task['name']}")
        
        try:
            self.update_task_status(task_id, TaskStatus.IN_PROGRESS)
            
            # Execute the handler
            result = await handler(*task["args"], **task["kwargs"])
            
            self.update_task_status(task_id, TaskStatus.COMPLETED, result=result)
            logger.info("Task %s completed successfully", task_id)
            return result
            
        except Exception as e:
            logger.exception("Task %s failed: %s", task_id, e)
            
            # Retry logic
            if task["retries"] < task["max_retries"]:
                task["retries"] += 1
                self.update_task_status(task_id, TaskStatus.RETRYING)
                
                # Exponential backoff
                delay = 2 ** task["retries"]
                logger.info("Retrying task %s in %d seconds (attempt %d/%d)", 
                           task_id, delay, task["retries"], task["max_retries"])
                
                await asyncio.sleep(delay)
                return await self.execute_task(task_id)
            else:
                self.update_task_status(task_id, TaskStatus.FAILED, error=str(e))
                raise


# Global task registry instance
task_registry = TaskRegistry()


# Task decorators for easy registration
def curriculum_task(name: str = ""):
    """Decorator for curriculum generation tasks."""
    return task_registry.register_task(name or "curriculum.generate")


def grading_task(name: str = ""):
    """Decorator for grading tasks."""
    return task_registry.register_task(name or "grading.evaluate")


def scraper_task(name: str = ""):
    """Decorator for web scraping tasks."""
    return task_registry.register_task(name or "scraper.fetch")


# Example task implementations
@curriculum_task("curriculum.generate_from_prompt")
async def generate_curriculum_from_prompt_task(
    prompt: str,
    certification_name: str,
    persona: str = "Master",
) -> dict[str, Any]:
    """Background task for curriculum generation from text prompt."""
    from services.curriculum_generator import generate_curriculum_from_prompt
    from models.schemas import GenerateCurriculumRequest
    
    request = GenerateCurriculumRequest(
        prompt=prompt,
        certificationName=certification_name,
        persona=persona,
    )
    
    result = await generate_curriculum_from_prompt(request)
    
    return {
        "curriculum": result.curriculum.model_dump(),
        "message": result.message,
    }


@curriculum_task("curriculum.generate_from_pdf")
async def generate_curriculum_from_pdf_task(
    pdf_base64: str,
    filename: str,
    prompt: str = "",
    certification_name: str = "",
    persona: str = "Master",
) -> dict[str, Any]:
    """Background task for curriculum generation from PDF upload."""
    import base64
    
    from models.schemas import GenerateCurriculumRequest
    from services.curriculum_generator import generate_curriculum_from_pdf
    
    pdf_content = base64.b64decode(pdf_base64)
    
    request = GenerateCurriculumRequest(
        prompt=prompt,
        certificationName=certification_name,
        persona=persona,
    )
    
    result = await generate_curriculum_from_pdf(
        pdf_content=pdf_content,
        filename=filename,
        request=request,
    )
    
    return {
        "curriculum": result.curriculum.model_dump(),
        "message": result.message,
    }


@grading_task("grading.submit_assignment")
async def grade_submission_task(
    assignment_id: str,
    course_id: str,
    submission_type: str,
    submission_content: str,
    rubric: dict[str, int],
    assignment_description: str,
) -> dict[str, Any]:
    """Background task for auto-grading submissions."""
    from models.schemas import GradeSubmissionRequest
    from services.grader import grade_submission
    
    request = GradeSubmissionRequest(
        assignmentId=assignment_id,
        courseId=course_id,
        submissionType=submission_type,
        submissionContent=submission_content,
    )
    
    result = await grade_submission(
        request=request,
        rubric=rubric,
        assignment_description=assignment_description,
    )
    
    return {
        "submissionId": result.submissionId,
        "grading": result.grading.model_dump(),
        "pushedToClassroom": result.pushedToClassroom,
        "xpUpdated": result.xpUpdated,
    }


@scraper_task("scraper.enrich_module")
async def enrich_module_task(
    module_title: str,
    topics: list[dict[str, Any]],
) -> dict[str, Any]:
    """Background task for enriching curriculum modules with web resources."""
    from services.scraper import enrich_curriculum_modules
    
    enriched_topics = await enrich_curriculum_modules(topics)
    
    return {
        "moduleTitle": module_title,
        "enrichedTopics": enriched_topics,
        "resourcesAdded": sum(len(t.get("webResources", [])) for t in enriched_topics),
    }


# Async queue processor for development (Celery in production)
class AsyncTaskQueue:
    """Simple async task queue for development/testing."""
    
    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._workers: list[asyncio.Task] = []
        self._running = False
    
    async def start(self, num_workers: int = 3) -> None:
        """Start the task queue workers."""
        self._running = True
        
        for i in range(num_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self._workers.append(worker)
        
        logger.info("Started %d task queue workers", num_workers)
    
    async def stop(self) -> None:
        """Stop all task queue workers."""
        self._running = False
        
        # Wait for current tasks to complete
        if self._workers:
            await asyncio.gather(*self._workers, return_exceptions=True)
        
        logger.info("Stopped task queue workers")
    
    async def enqueue(
        self,
        task_name: str,
        args: tuple = (),
        kwargs: dict | None = None,
        priority: TaskPriority = TaskPriority.NORMAL,
    ) -> str:
        """Add a task to the queue."""
        task_id = task_registry.create_task(
            name=task_name,
            args=args,
            kwargs=kwargs,
            priority=priority,
        )
        
        await self._queue.put((priority.value, task_id))
        logger.debug("Enqueued task %s with priority %d", task_id, priority.value)
        
        return task_id
    
    async def _worker(self, worker_name: str) -> None:
        """Worker coroutine that processes tasks from the queue."""
        logger.info("%s started", worker_name)
        
        while self._running:
            try:
                # Get task from queue with timeout
                try:
                    _, task_id = await asyncio.wait_for(
                        self._queue.get(),
                        timeout=1.0,
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Execute the task
                try:
                    await task_registry.execute_task(task_id)
                except Exception as e:
                    logger.error("%s failed task %s: %s", worker_name, task_id, e)
                
                self._queue.task_done()
                
            except Exception as e:
                logger.exception("%s error: %s", worker_name, e)
        
        logger.info("%s stopped", worker_name)
    
    def get_task_status(self, task_id: str) -> dict[str, Any] | None:
        """Get current status of a task."""
        return task_registry.get_task(task_id)


# Global task queue instance
task_queue = AsyncTaskQueue()


# Context manager for lifecycle management
class TaskQueueManager:
    """Manages task queue lifecycle."""
    
    def __init__(self, num_workers: int = 3):
        self.num_workers = num_workers
    
    async def __aenter__(self):
        await task_queue.start(num_workers=self.num_workers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await task_queue.stop()


# Utility functions for API integration
async def submit_curriculum_generation(
    prompt: str | None = None,
    pdf_base64: str | None = None,
    filename: str | None = None,
    certification_name: str = "",
    persona: str = "Master",
) -> str:
    """Submit a curriculum generation task to the queue.
    
    Returns task ID for status polling.
    """
    if pdf_base64 and filename:
        task_id = await task_queue.enqueue(
            task_name="curriculum.generate_from_pdf",
            args=(pdf_base64, filename, prompt or "", certification_name, persona),
            priority=TaskPriority.HIGH,
        )
    elif prompt:
        task_id = await task_queue.enqueue(
            task_name="curriculum.generate_from_prompt",
            args=(prompt, certification_name, persona),
            priority=TaskPriority.NORMAL,
        )
    else:
        raise ValueError("Either prompt or PDF file must be provided")
    
    return task_id


async def submit_grading_task(
    assignment_id: str,
    course_id: str,
    submission_type: str,
    submission_content: str,
    rubric: dict[str, int],
    assignment_description: str,
) -> str:
    """Submit a grading task to the queue.
    
    Returns task ID for status polling.
    """
    task_id = await task_queue.enqueue(
        task_name="grading.evaluate",
        args=(
            assignment_id,
            course_id,
            submission_type,
            submission_content,
            rubric,
            assignment_description,
        ),
        priority=TaskPriority.NORMAL,
    )
    
    return task_id


async def get_task_result(task_id: str, wait: bool = False, timeout: int = 300) -> dict[str, Any]:
    """Get task result, optionally waiting for completion.
    
    Args:
        task_id: The task ID to check
        wait: If True, wait for task completion
        timeout: Maximum seconds to wait
    
    Returns:
        Task status dictionary with result or error
    """
    if wait:
        start_time = datetime.utcnow()
        while (datetime.utcnow() - start_time).total_seconds() < timeout:
            task = task_registry.get_task(task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            if task["status"] in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                break
            
            await asyncio.sleep(1)
    
    task = task_registry.get_task(task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    
    return task
