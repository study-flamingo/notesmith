"""Base LLM provider interface."""

from abc import ABC, abstractmethod
from typing import Literal

from app.core.config import settings
from app.models.notes import AnalysisResult


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def analyze_transcript(
        self,
        transcript: str,
        context: dict | None = None,
    ) -> AnalysisResult:
        """
        Extract clinical entities and insights from transcript.
        
        Args:
            transcript: The full transcript text
            context: Optional context (patient info, appointment type, etc.)
            
        Returns:
            AnalysisResult with extracted information
        """
        pass

    @abstractmethod
    async def generate_note(
        self,
        transcript: str,
        template: str,
        analysis: AnalysisResult | None = None,
    ) -> str:
        """
        Generate clinical note from transcript using template.
        
        Args:
            transcript: The full transcript text
            template: Template with placeholders
            analysis: Optional pre-computed analysis
            
        Returns:
            Generated clinical note content
        """
        pass

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """
        Generic completion for custom prompts.
        """
        pass


class LLMProviderFactory:
    """Factory for creating LLM provider instances."""

    _providers: dict[str, type[BaseLLMProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_class: type[BaseLLMProvider]) -> None:
        """Register a provider class."""
        cls._providers[name] = provider_class

    @classmethod
    def get_provider(
        cls,
        provider_name: Literal["openai", "anthropic", "azure", "ollama"] | None = None,
    ) -> BaseLLMProvider:
        """
        Get an instance of the specified LLM provider.
        
        Args:
            provider_name: Name of provider. If None, uses default from settings.
            
        Returns:
            Configured LLM provider instance
        """
        name = provider_name or settings.default_llm_provider

        if name not in cls._providers:
            # Lazy import and register providers
            if name == "openai":
                from app.services.llm.openai_provider import OpenAIProvider
                cls.register("openai", OpenAIProvider)
            elif name == "anthropic":
                from app.services.llm.anthropic_provider import AnthropicProvider
                cls.register("anthropic", AnthropicProvider)
            elif name == "ollama":
                from app.services.llm.ollama_provider import OllamaProvider
                cls.register("ollama", OllamaProvider)
            else:
                raise ValueError(f"Unknown LLM provider: {name}")

        return cls._providers[name]()

    @classmethod
    def list_providers(cls) -> list[str]:
        """List available provider names."""
        return ["openai", "anthropic", "ollama"]

