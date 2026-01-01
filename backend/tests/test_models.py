"""Tests for Pydantic models."""

import pytest
from datetime import datetime
from uuid import UUID, uuid4

from pydantic import ValidationError

from app.models.templates import (
    Template,
    TemplateCreate,
    TemplateUpdate,
    TemplateType,
    TemplateVariable,
)
from app.models.notes import (
    AnalysisResult,
    ClinicalEntity,
    ClinicalNote,
    NoteCreate,
    NoteUpdate,
    NoteStatus,
)
from app.models.base import BaseSchema, TimestampMixin, BaseDBModel


class TestTemplateType:
    """Tests for TemplateType enum."""

    def test_all_types_are_strings(self):
        """Test all template types are string values."""
        assert TemplateType.SOAP == "soap"
        assert TemplateType.DAP == "dap"
        assert TemplateType.NARRATIVE == "narrative"
        assert TemplateType.CUSTOM == "custom"

    def test_enum_members(self):
        """Test all expected enum members exist."""
        types = list(TemplateType)
        assert len(types) == 4
        assert TemplateType.SOAP in types
        assert TemplateType.DAP in types
        assert TemplateType.NARRATIVE in types
        assert TemplateType.CUSTOM in types


class TestTemplateVariable:
    """Tests for TemplateVariable model."""

    def test_create_minimal(self):
        """Test creating variable with minimal fields."""
        var = TemplateVariable(name="test_var", description="A test variable")
        assert var.name == "test_var"
        assert var.description == "A test variable"
        assert var.required is False
        assert var.default_value is None

    def test_create_with_all_fields(self):
        """Test creating variable with all fields."""
        var = TemplateVariable(
            name="patient_name",
            description="Patient's full name",
            required=True,
            default_value="Unknown",
        )
        assert var.name == "patient_name"
        assert var.required is True
        assert var.default_value == "Unknown"

    def test_model_dump(self):
        """Test model serialization."""
        var = TemplateVariable(name="var", description="desc", required=True)
        dumped = var.model_dump()
        assert dumped == {
            "name": "var",
            "description": "desc",
            "required": True,
            "default_value": None,
        }


class TestTemplateCreate:
    """Tests for TemplateCreate schema."""

    def test_create_minimal(self):
        """Test creating with minimal required fields."""
        template = TemplateCreate(name="Test Template", content="{{ name }}")
        assert template.name == "Test Template"
        assert template.content == "{{ name }}"
        assert template.practice_id is None
        assert template.description is None
        assert template.template_type == TemplateType.CUSTOM
        assert template.variables == []

    def test_create_with_all_fields(self):
        """Test creating with all fields."""
        practice_id = uuid4()
        template = TemplateCreate(
            practice_id=practice_id,
            name="Full Template",
            description="A complete template",
            template_type=TemplateType.SOAP,
            content="{{ chief_complaint }}",
            variables=[TemplateVariable(name="chief_complaint", description="The complaint")],
        )
        assert template.practice_id == practice_id
        assert template.template_type == TemplateType.SOAP
        assert len(template.variables) == 1

    def test_missing_required_field_name(self):
        """Test that missing name raises validation error."""
        with pytest.raises(ValidationError):
            TemplateCreate(content="{{ test }}")

    def test_missing_required_field_content(self):
        """Test that missing content raises validation error."""
        with pytest.raises(ValidationError):
            TemplateCreate(name="Test")


class TestTemplateUpdate:
    """Tests for TemplateUpdate schema."""

    def test_update_empty(self):
        """Test creating update with no fields set."""
        update = TemplateUpdate()
        assert update.name is None
        assert update.description is None
        assert update.content is None
        assert update.variables is None
        assert update.is_active is None

    def test_update_partial(self):
        """Test partial update with some fields."""
        update = TemplateUpdate(name="New Name", is_active=False)
        assert update.name == "New Name"
        assert update.is_active is False
        assert update.content is None

    def test_model_dump_exclude_unset(self):
        """Test that unset fields are excluded when dumping."""
        update = TemplateUpdate(name="Updated")
        dumped = update.model_dump(exclude_unset=True)
        assert dumped == {"name": "Updated"}
        assert "content" not in dumped
        assert "is_active" not in dumped


class TestTemplate:
    """Tests for Template model."""

    def test_create_template(self):
        """Test creating a full template model."""
        now = datetime.now()
        template = Template(
            id=uuid4(),
            name="SOAP Note",
            template_type=TemplateType.SOAP,
            content="{{ chief_complaint }}",
            created_at=now,
        )
        assert template.name == "SOAP Note"
        assert template.is_default is False
        assert template.is_active is True
        assert template.version == 1

    def test_default_values(self):
        """Test default field values."""
        template = Template(
            id=uuid4(),
            name="Test",
            template_type=TemplateType.CUSTOM,
            content="Content",
            created_at=datetime.now(),
        )
        assert template.practice_id is None
        assert template.description is None
        assert template.variables == []
        assert template.is_default is False
        assert template.is_active is True
        assert template.version == 1


class TestNoteStatus:
    """Tests for NoteStatus enum."""

    def test_all_statuses(self):
        """Test all note statuses exist."""
        assert NoteStatus.DRAFT == "draft"
        assert NoteStatus.GENERATED == "generated"
        assert NoteStatus.REVIEWED == "reviewed"
        assert NoteStatus.FINALIZED == "finalized"
        assert NoteStatus.EXPORTED == "exported"

    def test_status_count(self):
        """Test expected number of statuses."""
        assert len(list(NoteStatus)) == 5


class TestClinicalEntity:
    """Tests for ClinicalEntity model."""

    def test_create_entity(self):
        """Test creating a clinical entity."""
        entity = ClinicalEntity(entity_type="procedure", value="Crown placement")
        assert entity.entity_type == "procedure"
        assert entity.value == "Crown placement"
        assert entity.confidence is None

    def test_create_with_confidence(self):
        """Test creating entity with confidence score."""
        entity = ClinicalEntity(
            entity_type="finding", value="Gingivitis", confidence=0.95
        )
        assert entity.confidence == 0.95


class TestAnalysisResult:
    """Tests for AnalysisResult model."""

    def test_empty_analysis(self):
        """Test creating empty analysis result."""
        analysis = AnalysisResult()
        assert analysis.chief_complaint is None
        assert analysis.procedures == []
        assert analysis.findings == []
        assert analysis.recommendations == []
        assert analysis.entities == []
        assert analysis.summary is None

    def test_full_analysis(self):
        """Test creating complete analysis result."""
        analysis = AnalysisResult(
            chief_complaint="Tooth pain",
            procedures=["Examination", "X-ray"],
            findings=["Cavity", "Plaque buildup"],
            recommendations=["Filling", "Professional cleaning"],
            entities=[
                ClinicalEntity(entity_type="procedure", value="X-ray"),
            ],
            summary="Patient requires filling and cleaning.",
        )
        assert analysis.chief_complaint == "Tooth pain"
        assert len(analysis.procedures) == 2
        assert len(analysis.findings) == 2
        assert len(analysis.recommendations) == 2
        assert len(analysis.entities) == 1
        assert analysis.summary is not None

    def test_model_dump(self):
        """Test serialization of analysis result."""
        analysis = AnalysisResult(
            chief_complaint="Pain",
            procedures=["Exam"],
            entities=[ClinicalEntity(entity_type="procedure", value="Exam")],
        )
        dumped = analysis.model_dump()
        assert dumped["chief_complaint"] == "Pain"
        assert dumped["procedures"] == ["Exam"]
        assert len(dumped["entities"]) == 1
        assert dumped["entities"][0]["value"] == "Exam"


class TestNoteCreate:
    """Tests for NoteCreate schema."""

    def test_create_note_request(self):
        """Test creating a note creation request."""
        transcript_id = uuid4()
        template_id = uuid4()
        note_create = NoteCreate(transcript_id=transcript_id, template_id=template_id)
        assert note_create.transcript_id == transcript_id
        assert note_create.template_id == template_id

    def test_missing_fields_raises_error(self):
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValidationError):
            NoteCreate(transcript_id=uuid4())  # Missing template_id


class TestNoteUpdate:
    """Tests for NoteUpdate schema."""

    def test_update_content(self):
        """Test updating final content."""
        update = NoteUpdate(final_content="Updated note content")
        assert update.final_content == "Updated note content"
        assert update.status is None

    def test_update_status(self):
        """Test updating status."""
        update = NoteUpdate(status=NoteStatus.REVIEWED)
        assert update.status == NoteStatus.REVIEWED

    def test_update_both(self):
        """Test updating both fields."""
        update = NoteUpdate(
            final_content="Content", status=NoteStatus.FINALIZED
        )
        assert update.final_content == "Content"
        assert update.status == NoteStatus.FINALIZED


class TestClinicalNote:
    """Tests for ClinicalNote model."""

    def test_create_minimal_note(self):
        """Test creating note with minimal fields."""
        now = datetime.now()
        note = ClinicalNote(
            id=uuid4(),
            transcript_id=uuid4(),
            template_id=uuid4(),
            generated_content="The generated note content",
            created_at=now,
        )
        assert note.generated_content == "The generated note content"
        assert note.final_content is None
        assert note.analysis is None
        assert note.status == NoteStatus.DRAFT
        assert note.reviewed_at is None
        assert note.reviewed_by is None
        assert note.finalized_at is None
        assert note.finalized_by is None

    def test_create_with_analysis(self):
        """Test creating note with analysis."""
        analysis = AnalysisResult(chief_complaint="Test complaint")
        note = ClinicalNote(
            id=uuid4(),
            transcript_id=uuid4(),
            template_id=uuid4(),
            generated_content="Content",
            analysis=analysis,
            created_at=datetime.now(),
        )
        assert note.analysis is not None
        assert note.analysis.chief_complaint == "Test complaint"

    def test_create_reviewed_note(self):
        """Test creating a reviewed note."""
        now = datetime.now()
        reviewer_id = uuid4()
        note = ClinicalNote(
            id=uuid4(),
            transcript_id=uuid4(),
            template_id=uuid4(),
            generated_content="Content",
            final_content="Reviewed content",
            status=NoteStatus.REVIEWED,
            reviewed_at=now,
            reviewed_by=reviewer_id,
            created_at=now,
        )
        assert note.status == NoteStatus.REVIEWED
        assert note.reviewed_at == now
        assert note.reviewed_by == reviewer_id


class TestBaseModels:
    """Tests for base model functionality."""

    def test_base_schema_config(self):
        """Test that BaseSchema has correct config."""

        class TestSchema(BaseSchema):
            name: str

        schema = TestSchema(name="test")
        assert schema.name == "test"

    def test_timestamp_mixin(self):
        """Test TimestampMixin fields."""

        class TestModel(TimestampMixin):
            pass

        now = datetime.now()
        model = TestModel(created_at=now)
        assert model.created_at == now
        assert model.updated_at is None

    def test_base_db_model(self):
        """Test BaseDBModel has id and timestamps."""

        class TestEntity(BaseDBModel):
            name: str

        now = datetime.now()
        entity_id = uuid4()
        entity = TestEntity(id=entity_id, name="Test", created_at=now)
        assert entity.id == entity_id
        assert entity.created_at == now
        assert entity.name == "Test"

