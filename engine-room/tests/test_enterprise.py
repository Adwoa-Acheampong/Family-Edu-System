"""Tests for enterprise-grade features."""

import pytest
from services.orchestrator import (
    AgentRole,
    WorkflowState,
    WorkflowContext,
    create_enterprise_agents,
    OrchestratorAgent,
)
from services.task_queue import (
    TaskStatus,
    TaskPriority,
    task_registry,
    AsyncTaskQueue,
    submit_curriculum_generation,
)
from services.vector_db import (
    VectorStoreConfig,
    create_vector_store,
    Document,
    InMemoryVectorStore,
)


class TestAgentOrchestrator:
    """Test multi-agent orchestration system."""
    
    def test_create_agents(self):
        """Verify all agents are created correctly."""
        agents = create_enterprise_agents()
        
        assert len(agents) == 6  # 5 specialized + 1 orchestrator
        assert AgentRole.PLANNER in agents
        assert AgentRole.RESEARCHER in agents
        assert AgentRole.CURRICULUM_ARCHITECT in agents
        assert AgentRole.GRADER in agents
        assert AgentRole.QUALITY_ASSURANCE in agents
        assert AgentRole.ORCHESTRATOR in agents
    
    def test_workflow_context_creation(self):
        """Test workflow context initialization."""
        context = WorkflowContext(
            input_data={
                "certificationName": "Test Certification",
                "prompt": "Test prompt",
            }
        )
        
        assert context.state == WorkflowState.PENDING
        assert context.current_agent is None
        assert len(context.errors) == 0
        assert context.input_data["certificationName"] == "Test Certification"
    
    def test_workflow_state_transitions(self):
        """Test state machine transitions."""
        context = WorkflowContext()
        
        context.transition_to(WorkflowState.PLANNING)
        assert context.state == WorkflowState.PLANNING
        
        context.transition_to(WorkflowState.RESEARCHING)
        assert context.state == WorkflowState.RESEARCHING
        
        context.transition_to(WorkflowState.COMPLETED)
        assert context.state == WorkflowState.COMPLETED
    
    def test_add_result_to_context(self):
        """Test adding intermediate results."""
        context = WorkflowContext()
        
        context.add_result(
            AgentRole.PLANNER,
            {"plan": {"steps": 5}}
        )
        
        assert len(context.intermediate_results) == 1
        assert context.intermediate_results[0]["agent"] == "planner"
        assert "plan" in context.output_data
    
    def test_error_handling(self):
        """Test error recording in workflow."""
        context = WorkflowContext()
        
        context.add_error("Test error occurred")
        
        assert context.state == WorkflowState.FAILED
        assert len(context.errors) == 1
        assert context.errors[0] == "Test error occurred"
    
    @pytest.mark.asyncio
    async def test_planner_agent_execution(self):
        """Test planner agent generates valid plan."""
        agents = create_enterprise_agents()
        planner = agents[AgentRole.PLANNER]
        
        context = WorkflowContext(
            input_data={
                "certificationName": "AWS Solutions Architect",
                "sourceType": "text_prompt",
                "prompt": "Create AWS SA curriculum",
            }
        )
        
        result = await planner.execute(context)
        
        assert "plan" in result
        assert "steps" in result["plan"]
        assert len(result["plan"]["steps"]) > 0


class TestTaskQueue:
    """Test async task queue system."""
    
    def test_task_status_enum(self):
        """Verify task status values."""
        assert TaskStatus.PENDING.value == "pending"
        assert TaskStatus.COMPLETED.value == "completed"
        assert TaskStatus.FAILED.value == "failed"
    
    def test_task_priority_enum(self):
        """Verify priority levels."""
        assert TaskPriority.LOW.value == 0
        assert TaskPriority.NORMAL.value == 5
        assert TaskPriority.HIGH.value == 10
        assert TaskPriority.CRITICAL.value == 15
    
    def test_task_registry_creation(self):
        """Test task creation in registry."""
        task_id = task_registry.create_task(
            name="test.task",
            args=("arg1",),
            kwargs={"key": "value"},
            priority=TaskPriority.HIGH,
        )
        
        task = task_registry.get_task(task_id)
        
        assert task is not None
        assert task["name"] == "test.task"
        assert task["status"] == TaskStatus.PENDING
        assert task["priority"] == 10
        assert task["args"] == ("arg1",)
    
    def test_task_status_updates(self):
        """Test task status transitions."""
        task_id = task_registry.create_task(name="test.status_task")
        
        task_registry.update_task_status(task_id, TaskStatus.IN_PROGRESS)
        task = task_registry.get_task(task_id)
        assert task["status"] == TaskStatus.IN_PROGRESS
        assert task["started_at"] is not None
        
        task_registry.update_task_status(task_id, TaskStatus.COMPLETED, result={"data": "test"})
        task = task_registry.get_task(task_id)
        assert task["status"] == TaskStatus.COMPLETED
        assert task["completed_at"] is not None
        assert task["result"] == {"data": "test"}


class TestVectorDatabase:
    """Test vector store and RAG functionality."""
    
    def test_vector_store_config(self):
        """Test configuration initialization."""
        config = VectorStoreConfig(backend="memory")
        
        assert config.backend == "memory"
        assert config.collection_name == "curriculum_knowledge"
    
    def test_in_memory_vector_store_creation(self):
        """Test in-memory vector store initialization."""
        config = VectorStoreConfig(backend="memory")
        vs = create_vector_store(config)
        
        assert isinstance(vs, InMemoryVectorStore)
    
    @pytest.mark.asyncio
    async def test_add_documents(self):
        """Test adding documents to vector store."""
        config = VectorStoreConfig(backend="memory")
        vs = create_vector_store(config)
        await vs.initialize()
        
        docs = [
            Document(
                id="doc-1",
                content="Requirements gathering is the first step",
                metadata={"type": "topic", "module": "BA Fundamentals"},
            ),
            Document(
                id="doc-2",
                content="Stakeholder analysis helps identify key participants",
                metadata={"type": "topic", "module": "BA Fundamentals"},
            ),
        ]
        
        ids = await vs.add_documents(docs)
        
        assert len(ids) == 2
        assert "doc-1" in ids
        assert "doc-2" in ids
    
    @pytest.mark.asyncio
    async def test_vector_search(self):
        """Test semantic search functionality."""
        config = VectorStoreConfig(backend="memory")
        vs = create_vector_store(config)
        await vs.initialize()
        
        # Add test documents
        docs = [
            Document(
                id="doc-1",
                content="Agile methodology uses sprints and iterative development",
                metadata={"type": "topic"},
            ),
            Document(
                id="doc-2",
                content="Waterfall approach follows sequential phases",
                metadata={"type": "topic"},
            ),
        ]
        await vs.add_documents(docs)
        
        # Search
        results = await vs.search(query="agile sprints", top_k=1)
        
        assert len(results) >= 1
        assert results[0].rank == 1
        assert results[0].score > 0
    
    @pytest.mark.asyncio
    async def test_document_deletion(self):
        """Test deleting documents from vector store."""
        config = VectorStoreConfig(backend="memory")
        vs = create_vector_store(config)
        await vs.initialize()
        
        doc = Document(
            id="doc-to-delete",
            content="This document will be deleted",
            metadata={},
        )
        await vs.add_documents([doc])
        
        # Verify exists
        retrieved = await vs.get_document("doc-to-delete")
        assert retrieved is not None
        
        # Delete
        count = await vs.delete_documents(["doc-to-delete"])
        assert count == 1
        
        # Verify deleted
        retrieved = await vs.get_document("doc-to-delete")
        assert retrieved is None


@pytest.mark.asyncio
async def test_integration_workflow():
    """Integration test: full workflow from task submission to result."""
    # Submit a curriculum generation task
    task_id = await submit_curriculum_generation(
        prompt="Test Integration Certification",
        certification_name="TIC-101",
        persona="Master",
    )
    
    assert task_id is not None
    
    # Get task status
    from services.task_queue import get_task_result
    result = await get_task_result(task_id)
    
    assert result is not None
    assert result["id"] == task_id
    # Note: Task may be pending/failed without API key, but structure should be correct
