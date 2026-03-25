"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";
import {
  useCompetitionForms,
  useCompetitionForm,
  useCreateCompetitionForm,
  useUpdateCompetitionForm,
  useDeleteCompetitionForm,
  useCreateCompetitionFormField,
  useUpdateCompetitionFormField,
  useDeleteCompetitionFormField,
  useReorderCompetitionFormFields,
} from "@/src/hooks/api/useCompetitionForms";
import { useAuth } from "@/contexts/AuthContext";

const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "URL",
  "SELECT",
  "MULTI_SELECT",
  "RADIO",
  "CHECKBOX",
  "DATE",
  "FILE",
  "IMAGE",
];

const FIELD_SCOPES = ["ALL_MEMBERS", "LEADER_ONLY", "TEAM"];

const OPTIONS_FIELD_TYPES = new Set(["SELECT", "MULTI_SELECT", "RADIO"]);
const TEXT_CONSTRAINT_TYPES = new Set([
  "TEXT",
  "TEXTAREA",
  "EMAIL",
  "PHONE",
  "URL",
]);
const NUMBER_CONSTRAINT_TYPES = new Set(["NUMBER"]);

const boxPanelSx = {
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "#0c0c0c",
  p: 2,
};

const dialogPaperSx = {
  background: "#0e0e0e",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.75)" },
    "& input, & textarea": {
      color: "rgba(255,255,255,0.9)",
      fontFamily: "'Syne', sans-serif",
      fontSize: 13,
    },
    "& svg": { color: "rgba(255,255,255,0.45)" },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.38)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    "&.Mui-focused": { color: "rgba(192,132,252,0.95)" },
  },
};

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

function GhostBtn({
  onClick,
  children,
  disabled,
  loading = false,
  small = false,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        padding: small ? "7px 12px" : "9px 16px",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.5)",
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
      {loading ? (
        <CircularProgress size={12} sx={{ color: "rgba(255,255,255,0.7)" }} />
      ) : null}
    </button>
  );
}

function PurpleBtn({
  onClick,
  children,
  disabled,
  loading = false,
  small = false,
  type = "button",
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        padding: small ? "7px 12px" : "9px 18px",
        background: isDisabled
          ? "rgba(168,85,247,0.25)"
          : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.4)",
        color: isDisabled ? "rgba(255,255,255,0.4)" : "#fff",
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
      {loading ? (
        <CircularProgress size={12} sx={{ color: "rgba(255,255,255,0.8)" }} />
      ) : null}
    </button>
  );
}

function DangerBtn({
  onClick,
  children,
  disabled,
  loading = false,
  small = false,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        padding: small ? "7px 12px" : "9px 16px",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#f87171",
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
      {loading ? (
        <CircularProgress size={12} sx={{ color: "#f87171" }} />
      ) : null}
    </button>
  );
}

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const createEmptyField = (index = 0) => ({
  tempId: `new-${Date.now()}-${index}`,
  id: null,
  label: "",
  fieldType: "TEXT",
  scope: "ALL_MEMBERS",
  placeholder: "",
  helpText: "",
  isRequired: false,
  minLength: "",
  maxLength: "",
  minValue: "",
  maxValue: "",
  pattern: "",
  optionsText: "",
});

const fieldFromApi = (field) => ({
  tempId: field.id,
  id: field.id,
  label: field.label || "",
  fieldType: field.fieldType || "TEXT",
  scope: field.scope || "ALL_MEMBERS",
  placeholder: field.placeholder || "",
  helpText: field.helpText || "",
  isRequired: Boolean(field.isRequired),
  minLength: field.minLength ?? "",
  maxLength: field.maxLength ?? "",
  minValue: field.minValue ?? "",
  maxValue: field.maxValue ?? "",
  pattern: field.pattern || "",
  optionsText: Array.isArray(field.options)
    ? field.options
        .map((option) => option?.label || option?.value)
        .filter(Boolean)
        .join("\n")
    : "",
});

const fieldToApi = (field) => {
  const options = field.optionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => ({ value, label: value }));

  return {
    label: field.label.trim(),
    fieldType: field.fieldType,
    scope: field.scope,
    placeholder: field.placeholder.trim() || null,
    helpText: field.helpText.trim() || null,
    isRequired: field.isRequired,
    minLength:
      field.minLength === "" || field.minLength === null
        ? null
        : Number(field.minLength),
    maxLength:
      field.maxLength === "" || field.maxLength === null
        ? null
        : Number(field.maxLength),
    minValue:
      field.minValue === "" || field.minValue === null
        ? null
        : Number(field.minValue),
    maxValue:
      field.maxValue === "" || field.maxValue === null
        ? null
        : Number(field.maxValue),
    pattern: field.pattern.trim() || null,
    options: OPTIONS_FIELD_TYPES.has(field.fieldType) ? options : null,
  };
};

function ImageFieldPreview() {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Box sx={{ mt: 1.25 }}>
      <Box
        sx={{
          borderRadius: "10px",
          border: "1px dashed rgba(168,85,247,0.45)",
          background: "rgba(168,85,247,0.06)",
          p: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <ImageIcon size={14} color="rgba(192,132,252,0.95)" />
          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(192,132,252,0.95)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
            }}
          >
            Image Upload Field
          </Typography>
        </Box>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 12,
            borderRadius: 8,
            padding: "7px 12px",
            border: "1px solid rgba(168,85,247,0.35)",
            background: "rgba(168,85,247,0.14)",
            color: "rgba(233,213,255,0.95)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <Upload size={13} />
          Choose Image
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              setPreviewUrl((current) => {
                if (current) {
                  URL.revokeObjectURL(current);
                }
                return URL.createObjectURL(file);
              });
            }}
          />
        </label>

        <Box
          sx={{
            mt: 1.25,
            height: 160,
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Image preview appears here
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function PreviewDialog({ open, onClose, formTitle, fields }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: dialogPaperSx }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            color: "#f4f4f5",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
          }}
        >
          {formTitle || "Form Preview"}
        </Typography>
      </Box>
      <DialogContent>
        {fields.length === 0 ? (
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            No fields yet. Add fields to preview this form.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            {fields.map((field) => (
              <Box key={field.id || field.tempId} sx={boxPanelSx}>
                <Typography sx={{ fontWeight: 600, mb: 0.75, fontSize: 14 }}>
                  {field.label || "Untitled field"}
                  {field.isRequired ? " *" : ""}
                </Typography>
                {field.helpText ? (
                  <Typography
                    sx={{ color: "text.secondary", mb: 1, fontSize: 12 }}
                  >
                    {field.helpText}
                  </Typography>
                ) : null}

                {field.fieldType === "IMAGE" ? (
                  <ImageFieldPreview />
                ) : (
                  <TextField
                    fullWidth
                    disabled
                    size="small"
                    placeholder={field.placeholder || "Response"}
                    multiline={field.fieldType === "TEXTAREA"}
                    minRows={field.fieldType === "TEXTAREA" ? 3 : undefined}
                    select={OPTIONS_FIELD_TYPES.has(field.fieldType)}
                    value=""
                    sx={{ ...inputSx, mt: 1 }}
                  >
                    {OPTIONS_FIELD_TYPES.has(field.fieldType)
                      ? field.optionsText
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((optionValue) => (
                            <MenuItem key={optionValue} value={optionValue}>
                              {optionValue}
                            </MenuItem>
                          ))
                      : null}
                  </TextField>
                )}
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    size="small"
                    label={field.fieldType}
                    sx={{
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Chip
                    size="small"
                    label={field.scope}
                    sx={{
                      background: "rgba(168,85,247,0.12)",
                      color: "rgba(192,132,252,0.95)",
                      border: "1px solid rgba(168,85,247,0.3)",
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <GhostBtn onClick={onClose}>Close</GhostBtn>
      </Box>
    </Dialog>
  );
}

function FormBuilderDialog({
  open,
  onClose,
  formId,
  competitions,
  competitionNameById,
  preselectedCompetitionId,
  currentUserRole,
  enqueueSnackbar,
}) {
  const isEdit = Boolean(formId);
  const { data: formDetails, isLoading: loadingForm } = useCompetitionForm(
    formId,
    open && isEdit,
  );

  const createFormMutation = useCreateCompetitionForm();
  const updateFormMutation = useUpdateCompetitionForm();
  const createFieldMutation = useCreateCompetitionFormField();
  const updateFieldMutation = useUpdateCompetitionFormField();
  const deleteFieldMutation = useDeleteCompetitionFormField();
  const reorderFieldsMutation = useReorderCompetitionFormFields();

  const [step, setStep] = useState(1);
  const [competitionId, setCompetitionId] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [fields, setFields] = useState([createEmptyField(0)]);
  const [deletedFieldIds, setDeletedFieldIds] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      setErrorText("");
      setStep(1);

      if (isEdit && formDetails) {
        setCompetitionId(formDetails.competitionId || "");
        setOpensAt(toDateTimeLocal(formDetails.opensAt));
        setClosesAt(toDateTimeLocal(formDetails.closesAt));
        setFields(
          Array.isArray(formDetails.fields) && formDetails.fields.length > 0
            ? formDetails.fields.map(fieldFromApi)
            : [createEmptyField(0)],
        );
        setDeletedFieldIds([]);
        setHasUnsavedChanges(false);
      }

      if (!isEdit) {
        setCompetitionId(preselectedCompetitionId || "");
        setOpensAt("");
        setClosesAt("");
        setFields([createEmptyField(0)]);
        setDeletedFieldIds([]);
        setHasUnsavedChanges(false);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [open, isEdit, formDetails, preselectedCompetitionId]);

  const isStepOneValid = useMemo(() => {
    if (!competitionId || !opensAt || !closesAt) {
      return false;
    }

    const opens = new Date(opensAt);
    const closes = new Date(closesAt);
    return opens < closes;
  }, [competitionId, opensAt, closesAt]);

  const isSaving =
    createFormMutation.isPending ||
    updateFormMutation.isPending ||
    createFieldMutation.isPending ||
    updateFieldMutation.isPending ||
    deleteFieldMutation.isPending ||
    reorderFieldsMutation.isPending;

  const handleFieldChange = (index, key, value) => {
    setFields((previous) => {
      const next = [...previous];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const addField = () => {
    setFields((previous) => [...previous, createEmptyField(previous.length)]);
    setHasUnsavedChanges(true);
  };

  const moveField = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    setFields((previous) => {
      const next = [...previous];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const removeField = (index) => {
    const targetField = fields[index];
    setFields((previous) => previous.filter((_, i) => i !== index));
    if (targetField?.id) {
      setDeletedFieldIds((previous) => [...previous, targetField.id]);
    }
    setHasUnsavedChanges(true);
  };

  const requestClose = () => {
    if (isSaving) return;
    if (hasUnsavedChanges) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const saveBuilder = async () => {
    try {
      setErrorText("");

      if (!isStepOneValid) {
        setErrorText(
          "Step 1 is incomplete. Select competition and valid opening/closing time.",
        );
        return;
      }

      const cleanedFields = fields.filter((field) => field.label.trim());

      if (cleanedFields.length === 0) {
        setErrorText("Add at least one labeled field before saving.");
        return;
      }

      let currentFormId = formId;

      if (currentUserRole === "DH") {
        const dhPayload = {
          opensAt: toIsoOrNull(opensAt),
          closesAt: toIsoOrNull(closesAt),
          status: "PUBLISHED",
          fields: cleanedFields.map((field, index) => ({
            ...fieldToApi(field),
            displayOrder: index + 1,
          })),
        };

        const response = isEdit
          ? await updateFormMutation.mutateAsync({
              formId,
              ...dhPayload,
            })
          : await createFormMutation.mutateAsync({
              competitionId,
              ...dhPayload,
            });

        if (response?.pendingApproval) {
          enqueueSnackbar(
            response?.message ||
              "Form changes submitted for SA approval successfully.",
            { variant: "info" },
          );
        }

        onClose();
        return;
      }

      if (isEdit) {
        await updateFormMutation.mutateAsync({
          formId,
          opensAt: toIsoOrNull(opensAt),
          closesAt: toIsoOrNull(closesAt),
          status: "PUBLISHED",
        });
      } else {
        const created = await createFormMutation.mutateAsync({
          competitionId,
          opensAt: toIsoOrNull(opensAt),
          closesAt: toIsoOrNull(closesAt),
          status: "PUBLISHED",
        });
        currentFormId = created?.id;
      }

      for (const deletedFieldId of deletedFieldIds) {
        await deleteFieldMutation.mutateAsync({
          formId: currentFormId,
          fieldId: deletedFieldId,
        });
      }

      const orderedFieldIds = [];

      for (const field of cleanedFields) {
        const payload = fieldToApi(field);

        if (field.id) {
          await updateFieldMutation.mutateAsync({
            formId: currentFormId,
            fieldId: field.id,
            ...payload,
          });
          orderedFieldIds.push(field.id);
        } else {
          const createdField = await createFieldMutation.mutateAsync({
            formId: currentFormId,
            ...payload,
          });
          if (createdField?.id) {
            orderedFieldIds.push(createdField.id);
          }
        }
      }

      if (orderedFieldIds.length > 0) {
        await reorderFieldsMutation.mutateAsync({
          formId: currentFormId,
          fieldIds: orderedFieldIds,
        });
      }

      onClose();
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to save form");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            ...dialogPaperSx,
            height: "90vh",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={15} color="#a855f7" />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 16,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {isEdit ? "Edit Competition Form" : "Create Competition Form"}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.28)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Step {step} of 2
            </Typography>
          </Box>
        </Box>
        <DialogContent>
          {loadingForm && isEdit ? (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} sx={{ color: "#a855f7" }} />
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip
                  label="Step 1 · Link + Window"
                  onClick={() => setStep(1)}
                  sx={{
                    background:
                      step === 1
                        ? "rgba(168,85,247,0.15)"
                        : "rgba(255,255,255,0.06)",
                    color:
                      step === 1
                        ? "rgba(192,132,252,0.95)"
                        : "rgba(255,255,255,0.6)",
                    border:
                      step === 1
                        ? "1px solid rgba(168,85,247,0.4)"
                        : "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Chip
                  label="Step 2 · Field Builder"
                  onClick={() => {
                    if (isStepOneValid) setStep(2);
                  }}
                  sx={{
                    background:
                      step === 2
                        ? "rgba(168,85,247,0.15)"
                        : "rgba(255,255,255,0.06)",
                    color:
                      step === 2
                        ? "rgba(192,132,252,0.95)"
                        : "rgba(255,255,255,0.6)",
                    border:
                      step === 2
                        ? "1px solid rgba(168,85,247,0.4)"
                        : "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Box sx={{ ml: "auto" }}>
                  <GhostBtn
                    onClick={() => setPreviewOpen(true)}
                    disabled={!isStepOneValid}
                    small
                  >
                    <Eye size={14} />
                    Preview
                  </GhostBtn>
                </Box>
              </Box>

              {step === 1 ? (
                <Box sx={{ ...boxPanelSx, display: "grid", gap: 2 }}>
                  <TextField
                    select
                    label="Linked Competition"
                    fullWidth
                    size="small"
                    value={competitionId}
                    disabled={isEdit}
                    onChange={(event) => {
                      setCompetitionId(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    sx={inputSx}
                  >
                    {competitions.map((competition) => (
                      <MenuItem key={competition.id} value={competition.id}>
                        {competition.title}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Opens At"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={opensAt}
                    onChange={(event) => {
                      setOpensAt(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                  />

                  <TextField
                    label="Closes At"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={closesAt}
                    onChange={(event) => {
                      setClosesAt(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                  />
                </Box>
              ) : (
                <Box sx={{ display: "grid", gap: 2 }}>
                  {fields.length === 0 ? (
                    <Box sx={boxPanelSx}>
                      <Typography
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      >
                        No fields left. Click Add Field.
                      </Typography>
                    </Box>
                  ) : (
                    fields.map((field, index) => (
                      <Box key={field.id || field.tempId} sx={boxPanelSx}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                            Field {index + 1}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <GhostBtn
                              onClick={() => moveField(index, -1)}
                              disabled={index === 0}
                              small
                            >
                              <ArrowUp size={13} />
                              Up
                            </GhostBtn>
                            <GhostBtn
                              onClick={() => moveField(index, 1)}
                              disabled={index === fields.length - 1}
                              small
                            >
                              <ArrowDown size={13} />
                              Down
                            </GhostBtn>
                            <DangerBtn onClick={() => removeField(index)} small>
                              <Trash2 size={13} />
                              Delete
                            </DangerBtn>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gap: 1.25,
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                          }}
                        >
                          <TextField
                            label="Label"
                            size="small"
                            fullWidth
                            value={field.label}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                            sx={inputSx}
                          />

                          <TextField
                            select
                            label="Field Type"
                            size="small"
                            fullWidth
                            value={field.fieldType}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "fieldType",
                                event.target.value,
                              )
                            }
                            sx={inputSx}
                          >
                            {FIELD_TYPES.map((fieldType) => (
                              <MenuItem key={fieldType} value={fieldType}>
                                {fieldType}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            select
                            label="Scope"
                            size="small"
                            fullWidth
                            value={field.scope}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "scope",
                                event.target.value,
                              )
                            }
                            sx={inputSx}
                          >
                            {FIELD_SCOPES.map((scope) => (
                              <MenuItem key={scope} value={scope}>
                                {scope}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            select
                            label="Required"
                            size="small"
                            fullWidth
                            value={field.isRequired ? "YES" : "NO"}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "isRequired",
                                event.target.value === "YES",
                              )
                            }
                            sx={inputSx}
                          >
                            <MenuItem value="YES">Yes</MenuItem>
                            <MenuItem value="NO">No</MenuItem>
                          </TextField>

                          <TextField
                            label="Placeholder"
                            size="small"
                            fullWidth
                            value={field.placeholder}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "placeholder",
                                event.target.value,
                              )
                            }
                            sx={inputSx}
                          />

                          <TextField
                            label="Help Text"
                            size="small"
                            fullWidth
                            value={field.helpText}
                            onChange={(event) =>
                              handleFieldChange(
                                index,
                                "helpText",
                                event.target.value,
                              )
                            }
                            sx={inputSx}
                          />

                          {TEXT_CONSTRAINT_TYPES.has(field.fieldType) ? (
                            <>
                              <TextField
                                label="Min Length"
                                size="small"
                                fullWidth
                                type="number"
                                value={field.minLength}
                                onChange={(event) =>
                                  handleFieldChange(
                                    index,
                                    "minLength",
                                    event.target.value,
                                  )
                                }
                                sx={inputSx}
                              />
                              <TextField
                                label="Max Length"
                                size="small"
                                fullWidth
                                type="number"
                                value={field.maxLength}
                                onChange={(event) =>
                                  handleFieldChange(
                                    index,
                                    "maxLength",
                                    event.target.value,
                                  )
                                }
                                sx={inputSx}
                              />
                              <TextField
                                label="Pattern (Regex)"
                                size="small"
                                fullWidth
                                value={field.pattern}
                                onChange={(event) =>
                                  handleFieldChange(
                                    index,
                                    "pattern",
                                    event.target.value,
                                  )
                                }
                                sx={inputSx}
                              />
                            </>
                          ) : null}

                          {NUMBER_CONSTRAINT_TYPES.has(field.fieldType) ? (
                            <>
                              <TextField
                                label="Min Value"
                                size="small"
                                fullWidth
                                type="number"
                                value={field.minValue}
                                onChange={(event) =>
                                  handleFieldChange(
                                    index,
                                    "minValue",
                                    event.target.value,
                                  )
                                }
                                sx={inputSx}
                              />
                              <TextField
                                label="Max Value"
                                size="small"
                                fullWidth
                                type="number"
                                value={field.maxValue}
                                onChange={(event) =>
                                  handleFieldChange(
                                    index,
                                    "maxValue",
                                    event.target.value,
                                  )
                                }
                                sx={inputSx}
                              />
                            </>
                          ) : null}

                          {OPTIONS_FIELD_TYPES.has(field.fieldType) ? (
                            <TextField
                              label="Options (one per line)"
                              size="small"
                              fullWidth
                              multiline
                              minRows={3}
                              value={field.optionsText}
                              onChange={(event) =>
                                handleFieldChange(
                                  index,
                                  "optionsText",
                                  event.target.value,
                                )
                              }
                              sx={{
                                ...inputSx,
                                gridColumn: { xs: "1", md: "1 / span 2" },
                              }}
                            />
                          ) : null}
                        </Box>
                      </Box>
                    ))
                  )}

                  <Box sx={{ ...boxPanelSx, display: "flex", gap: 1 }}>
                    <PurpleBtn onClick={addField}>
                      <Plus size={14} />
                      Add Field
                    </PurpleBtn>
                    <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                      Build form questions with type, validation and visibility.
                    </Typography>
                  </Box>
                </Box>
              )}

              {errorText ? (
                <Typography
                  sx={{
                    color: "#f87171",
                    fontSize: 12,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {errorText}
                </Typography>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <GhostBtn onClick={requestClose} disabled={isSaving}>
            Cancel
          </GhostBtn>
          {step === 1 ? (
            <PurpleBtn
              disabled={!isStepOneValid || isSaving}
              onClick={() => setStep(2)}
            >
              Next: Field Builder
              <ChevronRight size={14} />
            </PurpleBtn>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <GhostBtn onClick={() => setStep(1)} disabled={isSaving}>
                <ChevronLeft size={14} />
                Back
              </GhostBtn>
              <PurpleBtn
                onClick={saveBuilder}
                disabled={isSaving}
                loading={isSaving}
              >
                Save Form
              </PurpleBtn>
            </Box>
          )}
        </Box>
      </Dialog>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        formTitle={
          competitionNameById[competitionId]
            ? `${competitionNameById[competitionId]} · Preview`
            : "Form Preview"
        }
        fields={fields}
      />

      <ConfirmDialog
        open={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          onClose();
        }}
        title="Discard unsaved changes?"
        message="You have unsaved changes in this form builder. Close without saving?"
        confirmText="Discard"
        severity="warning"
      />
    </>
  );
}

export default function CompetitionFormsPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: forms = [], isLoading: formsLoading } = useCompetitionForms();
  const { data: competitions = [] } = useCompetitions();
  const deleteFormMutation = useDeleteCompetitionForm();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeFormId, setActiveFormId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewFormId, setPreviewFormId] = useState(null);

  const preselectedCompetitionId = searchParams.get("competitionId") || "";
  const shouldOpenBuilderFromQuery = searchParams.get("openForm") === "true";

  useEffect(() => {
    if (!shouldOpenBuilderFromQuery || !preselectedCompetitionId) return;
    setActiveFormId(null);
    setBuilderOpen(true);
  }, [preselectedCompetitionId, shouldOpenBuilderFromQuery]);

  const closeBuilderDialog = () => {
    setBuilderOpen(false);
    setActiveFormId(null);
    if (shouldOpenBuilderFromQuery) {
      router.replace("/admin/dh/competitions/forms");
    }
  };

  const { data: previewForm } = useCompetitionForm(
    previewFormId,
    !!previewFormId,
  );

  const competitionNameById = useMemo(() => {
    const map = {};
    competitions.forEach((competition) => {
      map[competition.id] = competition.title;
    });
    return map;
  }, [competitions]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "9px",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={15} color="rgba(255,255,255,0.7)" />
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Competition Forms
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Syne', sans-serif",
              ml: 0.5,
            }}
          >
            Create, edit, preview and manage registration form fields.
          </Typography>
        </Box>

        <PurpleBtn
          onClick={() => {
            setActiveFormId(null);
            setBuilderOpen(true);
          }}
        >
          <Plus size={14} />
          Create Form
        </PurpleBtn>
      </Box>

      {formsLoading ? (
        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : forms.length === 0 ? (
        <Box sx={boxPanelSx}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            No forms yet. Click Create Form to start building one.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {forms.map((form) => (
            <Box key={form.id} sx={boxPanelSx}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.5 }}>
                    {form.competitionTitle || "Untitled competition"}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Opens: {new Date(form.opensAt).toLocaleString()} · Closes:{" "}
                    {new Date(form.closesAt).toLocaleString()}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Chip
                      size="small"
                      label={form.status || "DRAFT"}
                      sx={{
                        background: "rgba(168,85,247,0.12)",
                        color: "rgba(192,132,252,0.95)",
                        border: "1px solid rgba(168,85,247,0.3)",
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${form.fieldsCount || 0} fields`}
                      sx={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <GhostBtn small onClick={() => setPreviewFormId(form.id)}>
                    <Eye size={14} />
                    Preview
                  </GhostBtn>
                  <GhostBtn
                    small
                    onClick={() => {
                      setActiveFormId(form.id);
                      setBuilderOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </GhostBtn>
                  <DangerBtn small onClick={() => setDeleteTarget(form)}>
                    <Trash2 size={14} />
                    Delete
                  </DangerBtn>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <FormBuilderDialog
        open={builderOpen}
        onClose={closeBuilderDialog}
        formId={activeFormId}
        competitions={competitions}
        competitionNameById={competitionNameById}
        preselectedCompetitionId={preselectedCompetitionId}
        currentUserRole={user?.role}
        enqueueSnackbar={enqueueSnackbar}
      />

      <PreviewDialog
        open={Boolean(previewFormId)}
        onClose={() => setPreviewFormId(null)}
        formTitle={previewForm?.competition?.title || "Form Preview"}
        fields={
          Array.isArray(previewForm?.fields)
            ? previewForm.fields.map(fieldFromApi)
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget?.id) return;
          const response = await deleteFormMutation.mutateAsync(
            deleteTarget.id,
          );
          if (response?.pendingApproval) {
            enqueueSnackbar(
              response?.message ||
                "Form deletion submitted for SA approval successfully.",
              { variant: "info" },
            );
          }
          setDeleteTarget(null);
        }}
        loading={deleteFormMutation.isPending}
        title="Delete form?"
        message={`This will permanently delete the form linked to ${deleteTarget?.competitionTitle || "this competition"}.`}
        confirmText="Delete"
        severity="danger"
      />
    </Box>
  );
}
