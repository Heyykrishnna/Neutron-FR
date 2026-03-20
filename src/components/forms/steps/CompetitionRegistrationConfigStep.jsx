"use client";

import { useEffect } from "react";
import { Controller, useWatch, useFieldArray } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { FieldGroup, FieldLabel, inputCss } from "./CompetitionBasicInfoStep";

const TOGGLE_LABELS = [
  {
    name: "registrationsOpen",
    label: "Registrations Open",
    description: "Allow new participants to register",
  },
  {
    name: "requiresApproval",
    label: "Requires Approval",
    description: "Teams need DH sign-off before joining",
  },
  {
    name: "autoApproveTeams",
    label: "Auto-Approve Teams",
    description: "Skip manual review, approve instantly",
  },
  {
    name: "isPaid",
    label: "Paid Event",
    description: "Participants must pay the registration fee",
  },
  {
    name: "perPerson",
    label: "Fee Per Person",
    description: "Charge fee per team member (not per team)",
  },
  {
    name: "attendanceRequired",
    label: "Attendance Required",
    description: "Track participant check-in on event day",
  },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: checked ? "rgba(168,85,247,0.7)" : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export default function CompetitionRegistrationConfigStep({
  control,
  errors,
  setValue,
}) {
  const competitionType = useWatch({ control, name: "type" });
  const registrationFee = useWatch({ control, name: "registrationFee" });
  const isPaid = useWatch({ control, name: "isPaid" });
  const isTeam = competitionType === "TEAM";
  const normalizedFee = Number(registrationFee || 0);
  const promoCodesDisabled =
    !Number.isFinite(normalizedFee) || normalizedFee <= 0;
  const perPersonDisabled = !isPaid;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prizePool",
  });

  const {
    fields: promoFields,
    append: appendPromo,
    remove: removePromo,
    update: updatePromo,
  } = useFieldArray({
    control,
    name: "promoCodes",
  });

  const generatePromoCode = () => {
    const token = Math.random().toString(36).toUpperCase().slice(2, 8);
    return `NEUTRON-${token}`;
  };

  useEffect(() => {
    if (perPersonDisabled) {
      setValue("perPerson", false, { shouldDirty: true, shouldValidate: true });
    }
  }, [perPersonDisabled, setValue]);

  useEffect(() => {
    if (promoCodesDisabled) {
      setValue("promoCodes", [], { shouldDirty: true, shouldValidate: true });
    }
  }, [promoCodesDisabled, setValue]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        pr: 0.5,
      }}
    >
      {/* Numeric limits */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
        <FieldGroup
          label="Registration Fee (₹)"
          error={errors.registrationFee}
          span={2}
        >
          <Controller
            name="registrationFee"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="0"
                placeholder="0"
                style={inputCss}
              />
            )}
          />
        </FieldGroup>

        <FieldGroup label="Max Registrations" error={errors.maxRegistrations}>
          <Controller
            name="maxRegistrations"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="1"
                placeholder="Unlimited"
                style={inputCss}
              />
            )}
          />
        </FieldGroup>

        {isTeam && (
          <>
            <FieldGroup label="Min Team Size" error={errors.minTeamSize}>
              <Controller
                name="minTeamSize"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    style={inputCss}
                  />
                )}
              />
            </FieldGroup>

            <FieldGroup label="Max Team Size" error={errors.maxTeamSize}>
              <Controller
                name="maxTeamSize"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    style={inputCss}
                  />
                )}
              />
            </FieldGroup>
          </>
        )}
      </Box>

      {/* Boolean toggles */}
      <Box
        sx={{
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "visible",
        }}
      >
        {TOGGLE_LABELS.map((item, i) => (
          <Controller
            key={item.name}
            name={item.name}
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 1.75,
                  borderBottom:
                    i < TOGGLE_LABELS.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  "&:hover": { background: "rgba(255,255,255,0.02)" },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'DM Mono', monospace",
                      mt: 0.25,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
                <Toggle
                  checked={!!field.value}
                  onChange={field.onChange}
                  disabled={
                    item.name === "perPerson" ? perPersonDisabled : false
                  }
                />
              </Box>
            )}
          />
        ))}
      </Box>

      {/* Prize Pool Builder */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 500,
              }}
            >
              Prize Pool
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace",
                mt: 0.25,
              }}
            >
              Add prizes — cash, in-kind, or both
            </Typography>
          </Box>
          <button
            type="button"
            onClick={() =>
              append({ rank: "", label: "", cash: "", inkind: "" })
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 7,
              color: "#c084fc",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            <Plus size={13} />
            Add Prize
          </button>
        </Box>

        {fields.length === 0 && (
          <Box
            sx={{
              borderRadius: "10px",
              border: "1px dashed rgba(255,255,255,0.08)",
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              No prizes added yet
            </Typography>
          </Box>
        )}

        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              p: 2,
              mb: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {/* Row header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "rgba(168,85,247,0.7)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                }}
              >
                PRIZE #{index + 1}
              </Typography>
              <button
                type="button"
                onClick={() => remove(index)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(239,68,68,0.5)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Trash2 size={13} />
              </button>
            </Box>

            {/* Rank + Label */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 1.5 }}
            >
              <FieldGroup label="Rank (optional)">
                <Controller
                  name={`prizePool.${index}.rank`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="1st, 2nd, Winner…"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
              <FieldGroup
                label="Label *"
                error={errors.prizePool?.[index]?.label}
              >
                <Controller
                  name={`prizePool.${index}.label`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="First Place, Best Innovation…"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>

            {/* Cash + In-kind */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              <FieldGroup label="Cash Prize (₹)">
                <Controller
                  name={`prizePool.${index}.cash`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="0"
                      placeholder="e.g. 5000"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
              <FieldGroup label="In-Kind (comma-separated)">
                <Controller
                  name={`prizePool.${index}.inkind`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="Trophy, Certificate, Goodies…"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Promo Code Generator */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 500,
              }}
            >
              Promo Codes
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace",
                mt: 0.25,
              }}
            >
              Generate discount codes for registrations
            </Typography>
          </Box>
          <button
            type="button"
            onClick={() => {
              if (promoCodesDisabled) return;
              appendPromo({
                code: generatePromoCode(),
                discountType: "PERCENT",
                discountValue: "",
                maxUses: "",
                isActive: true,
                description: "",
              });
            }}
            disabled={promoCodesDisabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 7,
              color: "#c084fc",
              fontSize: 12,
              fontFamily: "'Syne', sans-serif",
              padding: "6px 12px",
              cursor: promoCodesDisabled ? "not-allowed" : "pointer",
              opacity: promoCodesDisabled ? 0.45 : 1,
            }}
          >
            <Plus size={13} />
            Add Promo Code
          </button>
        </Box>

        {promoFields.length === 0 && (
          <Box
            sx={{
              borderRadius: "10px",
              border: "1px dashed rgba(255,255,255,0.08)",
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {promoCodesDisabled
                ? "Promo codes are disabled when registration fee is 0"
                : "No promo codes added yet"}
            </Typography>
          </Box>
        )}

        {promoFields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              p: 2,
              mb: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "rgba(168,85,247,0.7)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                }}
              >
                PROMO #{index + 1}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <button
                  type="button"
                  onClick={() =>
                    !promoCodesDisabled &&
                    updatePromo(index, {
                      ...promoFields[index],
                      code: generatePromoCode(),
                    })
                  }
                  disabled={promoCodesDisabled}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    cursor: promoCodesDisabled ? "not-allowed" : "pointer",
                    color: "rgba(255,255,255,0.6)",
                    padding: "4px 8px",
                    fontSize: 11,
                    opacity: promoCodesDisabled ? 0.45 : 1,
                  }}
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => removePromo(index)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(239,68,68,0.5)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 1.5,
              }}
            >
              <FieldGroup
                label="Code *"
                error={errors.promoCodes?.[index]?.code}
              >
                <Controller
                  name={`promoCodes.${index}.code`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="NEUTRON-ABC123"
                      disabled={promoCodesDisabled}
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Type">
                <Controller
                  name={`promoCodes.${index}.discountType`}
                  control={control}
                  render={({ field: f }) => (
                    <select
                      {...f}
                      disabled={promoCodesDisabled}
                      style={inputCss}
                    >
                      <option value="PERCENT" style={{ background: "#0e0e0e" }}>
                        Percent
                      </option>
                      <option value="FLAT" style={{ background: "#0e0e0e" }}>
                        Flat
                      </option>
                    </select>
                  )}
                />
              </FieldGroup>

              <FieldGroup
                label="Value *"
                error={errors.promoCodes?.[index]?.discountValue}
              >
                <Controller
                  name={`promoCodes.${index}.discountValue`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="0"
                      placeholder="e.g. 20"
                      disabled={promoCodesDisabled}
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              <FieldGroup label="Max Uses">
                <Controller
                  name={`promoCodes.${index}.maxUses`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      disabled={promoCodesDisabled}
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Description">
                <Controller
                  name={`promoCodes.${index}.description`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="Early bird, Campus ambassador..."
                      disabled={promoCodesDisabled}
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>

            <Controller
              name={`promoCodes.${index}.isActive`}
              control={control}
              render={({ field: f }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1,
                  }}
                >
                  <FieldLabel>Active</FieldLabel>
                  <Toggle
                    checked={!!f.value}
                    onChange={f.onChange}
                    disabled={promoCodesDisabled}
                  />
                </Box>
              )}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
