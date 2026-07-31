"""Enterprise Agentic Orchestration Layer.

Implements a stateful multi-agent system using LangGraph-style state machines
for autonomous curriculum generation, research, and grading workflows.

Agents:
- Planner: Breaks down complex tasks into steps
- Researcher: Fetches and validates web resources  
- CurriculumArchitect: Structures learning paths
- Grader: Evaluates submissions with rubrics
- QualityAssurance: Validates outputs before delivery
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional

logger = logging.getLogger("engine_room.agents")


class AgentRole(str, Enum):
    """Available agent roles in the orchestration system."""
    PLANNER = "planner"
    RESEARCHER = "researcher"
    CURRICULUM_ARCHITECT = "curriculum_architect"
    GRADER = "grader"
    QUALITY_ASSURANCE = "quality_assurance"
    ORCHESTRATOR = "orchestrator"


class WorkflowState(str, Enum):
    """Workflow execution states."""
    PENDING = "pending"
    PLANNING = "planning"
    RESEARCHING = "researching"
    GENERATING = "generating"
    GRADING = "grading"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class WorkflowContext:
    """Stateful context for workflow execution."""
    workflow_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    state: WorkflowState = WorkflowState.PENDING
    current_agent: Optional[AgentRole] = None
    input_data: dict[str, Any] = field(default_factory=dict)
    output_data: dict[str, Any] = field(default_factory=dict)
    intermediate_results: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    
    def add_result(self, agent: AgentRole, result: dict[str, Any]) -> None:
        """Record an intermediate result from an agent."""
        self.intermediate_results.append({
            "agent": agent.value,
            "result": result,
        })
        self.output_data.update(result)
    
    def add_error(self, error: str) -> None:
        """Record an error in the workflow."""
        self.errors.append(error)
        self.state = WorkflowState.FAILED
    
    def transition_to(self, new_state: WorkflowState) -> None:
        """Transition workflow to a new state."""
        self.state = new_state


@dataclass
class AgentConfig:
    """Configuration for an individual agent."""
    role: AgentRole
    model: str
    system_prompt: str
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout_seconds: int = 120


class BaseAgent:
    """Base class for all agents in the orchestration system."""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.logger = logging.getLogger(f"engine_room.agents.{config.role.value}")
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Execute the agent's task. Override in subclasses."""
        raise NotImplementedError
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        """Build the prompt for this agent based on context."""
        raise NotImplementedError


class PlannerAgent(BaseAgent):
    """Breaks down complex curriculum requests into structured plans."""
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Generate a step-by-step plan for curriculum creation."""
        prompt = self._build_prompt(context)
        
        # In production, this would call Qwen/Gemini API
        # For now, return a structured plan template
        plan = {
            "steps": [
                {"step": 1, "action": "parse_requirements", "agent": "curriculum_architect"},
                {"step": 2, "action": "fetch_resources", "agent": "researcher", "parallel": True},
                {"step": 3, "action": "structure_modules", "agent": "curriculum_architect"},
                {"step": 4, "action": "generate_projects", "agent": "curriculum_architect"},
                {"step": 5, "action": "create_quizzes", "agent": "curriculum_architect"},
                {"step": 6, "action": "validate_output", "agent": "quality_assurance"},
            ],
            "estimated_steps": 6,
            "parallelizable": ["fetch_resources"],
        }
        
        self.logger.info("Generated plan with %d steps", len(plan["steps"]))
        return {"plan": plan}
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        input_data = context.input_data
        return f"""
Analyze this curriculum request and create a detailed execution plan:

Certification/Topic: {input_data.get('certificationName', 'Unknown')}
Source Type: {input_data.get('sourceType', 'text_prompt')}
Description: {input_data.get('prompt', input_data.get('sourceDescription', 'N/A'))}

Create a step-by-step plan covering:
1. Content analysis and domain mapping
2. Resource gathering (web enrichment)
3. Module structure design
4. Practical project creation
5. Quiz question generation
6. Quality validation

Output a JSON plan with ordered steps and parallelization opportunities.
"""


class ResearcherAgent(BaseAgent):
    """Fetches and validates web resources for curriculum enrichment."""
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Search for and validate web resources."""
        prompt = self._build_prompt(context)
        
        # In production, this would use scraper.py with caching
        topics = context.input_data.get("topics", [])
        resources = []
        
        for topic in topics[:5]:  # Limit for demo
            resources.append({
                "topic": topic.get("title"),
                "webResources": [
                    {"title": f"Industry Guide: {topic.get('title')}", "url": "#"},
                ],
                "caseStudies": [
                    {"title": f"Case Study: {topic.get('title')} in Practice", "url": "#", "summary": "..."},
                ],
            })
        
        return {"enrichedTopics": resources}
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        return f"""
Research current, high-quality web resources for these curriculum topics:

{context.input_data.get('topics', [])}

For each topic, find:
- Tutorial guides and documentation
- Real-world case studies
- Industry best practices (2024-2025)
- Video tutorials or talks

Validate that URLs are accessible and content is relevant.
"""


class CurriculumArchitectAgent(BaseAgent):
    """Structures comprehensive learning paths from source material."""
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Generate structured curriculum from parsed content."""
        prompt = self._build_prompt(context)
        
        # This integrates with curriculum_generator.py logic
        # Returns structured modules with topics, projects, quizzes
        return {
            "modules": context.output_data.get("modules", []),
            "totalEstimatedHours": sum(m.get("estimatedHours", 0) for m in context.output_data.get("modules", [])),
        }
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        return f"""
Design a comprehensive curriculum structure based on:

Source Material: {context.input_data.get('sourceDescription', 'N/A')}
Certification: {context.input_data.get('certificationName', 'Unknown')}

Create modules that:
1. Map to certification domains/knowledge areas
2. Include practical, real-world projects
3. Have exam-style quiz questions
4. Provide reading guides with key concepts
5. Link to enriched web resources

Ensure progressive difficulty and logical flow between topics.
"""


class GraderAgent(BaseAgent):
    """Evaluates student submissions against rubrics."""
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Grade a submission using AI evaluation."""
        prompt = self._build_prompt(context)
        
        # Integrates with grader.py logic
        submission = context.input_data.get("submissionContent", "")
        rubric = context.input_data.get("rubric", {})
        
        max_score = sum(rubric.values()) if rubric else 100
        
        return {
            "score": int(max_score * 0.85),  # Placeholder
            "maxScore": max_score,
            "feedback": "Detailed constructive feedback...",
            "strengths": ["Strong understanding of core concepts"],
            "areasForImprovement": ["Could improve practical application"],
            "xpEarned": int(max_score * 0.85),
        }
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        return f"""
Evaluate this student submission fairly against the rubric:

Assignment: {context.input_data.get('assignmentId', 'Unknown')}
Rubric: {context.input_data.get('rubric', {})}

Submission:
{context.input_data.get('submissionContent', 'N/A')}

Provide:
1. Score for each rubric criterion
2. Overall constructive feedback
3. Specific strengths identified
4. Actionable areas for improvement
5. XP earned (equal to score)

Be encouraging but honest. Focus on learning outcomes.
"""


class QualityAssuranceAgent(BaseAgent):
    """Validates generated curriculum for completeness and quality."""
    
    async def execute(self, context: WorkflowContext) -> dict[str, Any]:
        """Validate curriculum output meets quality standards."""
        curriculum = context.output_data
        
        issues = []
        
        # Validation checks
        if not curriculum.get("modules"):
            issues.append("Missing modules")
        
        for module in curriculum.get("modules", []):
            if not module.get("topics"):
                issues.append(f"Module '{module.get('title')}' has no topics")
            
            for topic in module.get("topics", []):
                if not topic.get("practicalProjects"):
                    issues.append(f"Topic '{topic.get('title')}' lacks practical projects")
                if not topic.get("quizzes"):
                    issues.append(f"Topic '{topic.get('title')}' lacks quiz questions")
        
        return {
            "isValid": len(issues) == 0,
            "issues": issues,
            "qualityScore": max(0, 100 - len(issues) * 10),
        }
    
    def _build_prompt(self, context: WorkflowContext) -> str:
        return f"""
Validate this generated curriculum for quality and completeness:

Certification: {context.input_data.get('certificationName', 'Unknown')}
Modules: {len(context.output_data.get('modules', []))}

Check for:
1. All certification domains covered
2. Each topic has practical projects
3. Quiz questions align with learning objectives
4. Web resources are relevant and accessible
5. Estimated hours are realistic
6. Progressive difficulty throughout

Report any gaps or quality issues found.
"""


class OrchestratorAgent(BaseAgent):
    """Coordinates multi-agent workflow execution."""
    
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.agents: dict[AgentRole, BaseAgent] = {}
    
    def register_agent(self, role: AgentRole, agent: BaseAgent) -> None:
        """Register an agent for workflow execution."""
        self.agents[role] = agent
        self.logger.info("Registered agent: %s", role.value)
    
    async def execute_workflow(self, context: WorkflowContext) -> WorkflowContext:
        """Execute a complete workflow through all required agents."""
        
        workflow_graph = {
            WorkflowState.PENDING: self._plan_workflow,
            WorkflowState.PLANNING: self._execute_planning,
            WorkflowState.RESEARCHING: self._execute_research,
            WorkflowState.GENERATING: self._execute_generation,
            WorkflowState.GRADING: self._execute_grading,
            WorkflowState.VALIDATING: self._execute_validation,
        }
        
        try:
            while context.state != WorkflowState.COMPLETED and context.state != WorkflowState.FAILED:
                handler = workflow_graph.get(context.state)
                if not handler:
                    context.add_error(f"No handler for state: {context.state}")
                    break
                
                context = await handler(context)
                
        except Exception as e:
            self.logger.exception("Workflow execution failed: %s", e)
            context.add_error(str(e))
        
        return context
    
    async def _plan_workflow(self, context: WorkflowContext) -> WorkflowContext:
        """Initialize workflow planning."""
        context.transition_to(WorkflowState.PLANNING)
        context.current_agent = AgentRole.PLANNER
        return context
    
    async def _execute_planning(self, context: WorkflowContext) -> WorkflowContext:
        """Execute planning phase."""
        if AgentRole.PLANNER not in self.agents:
            context.add_error("Planner agent not registered")
            return context
        
        planner = self.agents[AgentRole.PLANNER]
        result = await planner.execute(context)
        context.add_result(AgentRole.PLANNER, result)
        context.transition_to(WorkflowState.RESEARCHING)
        return context
    
    async def _execute_research(self, context: WorkflowContext) -> WorkflowContext:
        """Execute research phase."""
        if AgentRole.RESEARCHER in self.agents:
            researcher = self.agents[AgentRole.RESEARCHER]
            result = await researcher.execute(context)
            context.add_result(AgentRole.RESEARCHER, result)
        
        context.transition_to(WorkflowState.GENERATING)
        return context
    
    async def _execute_generation(self, context: WorkflowContext) -> WorkflowContext:
        """Execute curriculum generation phase."""
        if AgentRole.CURRICULUM_ARCHITECT in self.agents:
            architect = self.agents[AgentRole.CURRICULUM_ARCHITECT]
            result = await architect.execute(context)
            context.add_result(AgentRole.CURRICULUM_ARCHITECT, result)
        
        context.transition_to(WorkflowState.VALIDATING)
        return context
    
    async def _execute_grading(self, context: WorkflowContext) -> WorkflowContext:
        """Execute grading phase (for grade-submission workflows)."""
        if AgentRole.GRADER in self.agents:
            grader = self.agents[AgentRole.GRADER]
            result = await grader.execute(context)
            context.add_result(AgentRole.GRADER, result)
        
        context.transition_to(WorkflowState.COMPLETED)
        return context
    
    async def _execute_validation(self, context: WorkflowContext) -> WorkflowContext:
        """Execute quality validation phase."""
        if AgentRole.QUALITY_ASSURANCE in self.agents:
            qa = self.agents[AgentRole.QUALITY_ASSURANCE]
            result = await qa.execute(context)
            context.add_result(AgentRole.QUALITY_ASSURANCE, result)
            
            if not result.get("isValid", False):
                self.logger.warning("QA found %d issues", len(result.get("issues", [])))
        
        context.transition_to(WorkflowState.COMPLETED)
        return context


def create_enterprise_agents(qwen_api_key: Optional[str] = None) -> dict[AgentRole, BaseAgent]:
    """Factory function to create configured agents.
    
    Args:
        qwen_api_key: Optional Qwen API key (falls back to Gemini if not provided)
    
    Returns:
        Dictionary of configured agents ready for orchestration
    """
    # Model configuration - uses Qwen if available, otherwise Gemini
    if qwen_api_key:
        default_model = "qwen/qwen-2.5-72b-instruct"
        logger.info("Using Qwen API for agent inference")
    else:
        default_model = "gemini-2.0-flash"
        logger.info("Using Gemini API for agent inference (Qwen not configured)")
    
    agents = {
        AgentRole.PLANNER: PlannerAgent(
            AgentConfig(
                role=AgentRole.PLANNER,
                model=default_model,
                system_prompt="You are an expert project planner for educational curriculum design.",
                temperature=0.5,
            )
        ),
        AgentRole.RESEARCHER: ResearcherAgent(
            AgentConfig(
                role=AgentRole.RESEARCHER,
                model=default_model,
                system_prompt="You are a skilled research assistant finding high-quality educational resources.",
                temperature=0.6,
            )
        ),
        AgentRole.CURRICULUM_ARCHITECT: CurriculumArchitectAgent(
            AgentConfig(
                role=AgentRole.CURRICULUM_ARCHITECT,
                model=default_model,
                system_prompt="You are an expert instructional designer creating comprehensive learning paths.",
                temperature=0.7,
            )
        ),
        AgentRole.GRADER: GraderAgent(
            AgentConfig(
                role=AgentRole.GRADER,
                model=default_model,
                system_prompt="You are a fair and constructive educational assessor.",
                temperature=0.3,
            )
        ),
        AgentRole.QUALITY_ASSURANCE: QualityAssuranceAgent(
            AgentConfig(
                role=AgentRole.QUALITY_ASSURANCE,
                model=default_model,
                system_prompt="You are a quality assurance specialist ensuring curriculum excellence.",
                temperature=0.4,
            )
        ),
    }
    
    orchestrator = OrchestratorAgent(
        AgentConfig(
            role=AgentRole.ORCHESTRATOR,
            model=default_model,
            system_prompt="You coordinate multi-agent workflows for educational content generation.",
        )
    )
    
    # Register all agents with orchestrator
    for role, agent in agents.items():
        orchestrator.register_agent(role, agent)
    
    agents[AgentRole.ORCHESTRATOR] = orchestrator
    
    return agents
