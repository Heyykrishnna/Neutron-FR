"use client";

import { useEffect, useRef } from "react";
import { Controller, useWatch, useFieldArray } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import {
  FieldGroup,
  FieldLabel,
  FieldError,
  inputCss,
  selectCss,
} from "./CompetitionBasicInfoStep";

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.22)",
            fontFamily: "'DM Mono', monospace",
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange, disabled, error }) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          "&:hover": { background: "rgba(255,255,255,0.015)" },
          borderRadius: "6px",
          cursor: disabled ? "not-allowed" : "default",
          opacity: disabled ? 0.5 : 1,
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
            {label}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.28)",
                fontFamily: "'DM Mono', monospace",
                mt: 0.2,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            border: "none",
            background: checked
              ? "rgba(168,85,247,0.75)"
              : "rgba(255,255,255,0.1)",
            position: "relative",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            flexShrink: 0,
            padding: 0,
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
      </Box>
      {error && <FieldError message={error.message} />}
    </Box>
  );
}

// ─── Add button ──────────────────────────────────────────────────────────────

function AddBtn({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(168,85,247,0.1)",
        border: "1px solid rgba(168,85,247,0.25)",
        borderRadius: 7,
        color: disabled ? "rgba(168,85,247,0.35)" : "#c084fc",
        fontSize: 12,
        fontFamily: "'Syne', sans-serif",
        padding: "6px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children }) {
  return (
    <Box
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
      {children}
    </Box>
  );
}

function CardHeader({ label, index, onRemove, extra }) {
  return (
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
        {label} #{index + 1}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {extra}
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(239,68,68,0.55)",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={13} />
        </button>
      </Box>
    </Box>
  );
}

// ─── Promo code generator ─────────────────────────────────────────────────────

const generatePromoCode = () =>
  `NEUTRON-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;

// ─── Main step ────────────────────────────────────────────────────────────────

export default function CompetitionRegistrationConfigStep({
  control,
  errors,
  setValue,
}) {
  const competitionType = useWatch({ control, name: "type" });
  const registrationFee = useWatch({ control, name: "registrationFee" });
  const isPaid = useWatch({ control, name: "isPaid" });
  const requiresApproval = useWatch({ control, name: "requiresApproval" });
  const autoApproveTeams = useWatch({ control, name: "autoApproveTeams" });

  const isTeam = competitionType === "TEAM";
  const normalizedFee = Number(registrationFee || 0);
  const promoDisabled =
    !isPaid || !Number.isFinite(normalizedFee) || normalizedFee <= 0;
  const perPersonDisabled = !isPaid || !isTeam;

  const {
    fields: prizeFields,
    append: appendPrize,
    remove: removePrize,
  } = useFieldArray({ control, name: "prizePool" });
  const {
    fields: promoFields,
    append: appendPromo,
    remove: removePromo,
    update: updatePromo,
  } = useFieldArray({ control, name: "promoCodes" });

  // Auto-sync: fee > 0 → isPaid
  useEffect(() => {
    if (Number.isFinite(normalizedFee) && normalizedFee > 0 && !isPaid) {
      setValue("isPaid", true, { shouldDirty: true, shouldValidate: true });
    }
  }, [normalizedFee, isPaid, setValue]);

  // Auto-sync: isPaid false → clear perPerson + promoCodes
  useEffect(() => {
    if (!isPaid) {
      setValue("perPerson", false, { shouldDirty: true, shouldValidate: true });
      setValue("promoCodes", [], { shouldDirty: true, shouldValidate: true });
    }
  }, [isPaid, setValue]);

  // Auto-sync: not team → clear perPerson
  useEffect(() => {
    if (!isTeam) {
      setValue("perPerson", false, { shouldDirty: true, shouldValidate: true });
    }
  }, [isTeam, setValue]);

  // Keep requiresApproval / autoApproveTeams mutually exclusive
  // Only sync when they are equal (invalid state) — don't flip on every render
  const prevRequiresApproval = useRef(requiresApproval);
  useEffect(() => {
    if (requiresApproval === autoApproveTeams) {
      // Flip the one that changed
      if (requiresApproval !== prevRequiresApproval.current) {
        setValue("autoApproveTeams", !requiresApproval, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else {
        setValue("requiresApproval", !autoApproveTeams, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
    prevRequiresApproval.current = requiresApproval;
  }, [requiresApproval, autoApproveTeams, setValue]);

  const prizePoolError =
    typeof errors?.prizePool?.message === "string"
      ? errors.prizePool.message
      : null;
  const promoCodesError =
    typeof errors?.promoCodes?.message === "string"
      ? errors.promoCodes.message
      : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* ── Limits ─────────────────────────────────────────────────────────── */}
      <Box>
        <SectionHeading title="Limits & Caps" />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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
                  step="1"
                  placeholder="0"
                  style={{
                    ...inputCss,
                    borderColor: errors.registrationFee
                      ? "rgba(248,113,113,0.5)"
                      : undefined,
                  }}
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

          <FieldGroup
            label="Max Teams Per College"
            error={errors.maxTeamsPerCollege}
          >
            <Controller
              name="maxTeamsPerCollege"
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
              <FieldGroup label="Min Team Size *" error={errors.minTeamSize}>
                <Controller
                  name="minTeamSize"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="e.g. 2"
                      style={{
                        ...inputCss,
                        borderColor: errors.minTeamSize
                          ? "rgba(248,113,113,0.5)"
                          : undefined,
                      }}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Max Team Size *" error={errors.maxTeamSize}>
                <Controller
                  name="maxTeamSize"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      style={{
                        ...inputCss,
                        borderColor: errors.maxTeamSize
                          ? "rgba(248,113,113,0.5)"
                          : undefined,
                      }}
                    />
                  )}
                />
              </FieldGroup>
            </>
          )}
        </Box>
      </Box>

      {/* ── Toggles ─────────────────────────────────────────────────────────── */}
      <Box>
        <SectionHeading
          title="Settings"
          subtitle="Control registration behavior and access"
        />
        <Box
          sx={{
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <Controller
            name="registrationsOpen"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Registrations Open"
                description="Allow new participants to register"
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Box
            sx={{ height: "1px", background: "rgba(255,255,255,0.04)", mx: 2 }}
          />

          <Controller
            name="requiresApproval"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Requires Approval"
                description="Registrations need manual DH sign-off before confirming"
                checked={!!field.value}
                onChange={(v) => {
                  field.onChange(v);
                  setValue("autoApproveTeams", !v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                error={errors.requiresApproval}
              />
            )}
          />
          <Box
            sx={{ height: "1px", background: "rgba(255,255,255,0.04)", mx: 2 }}
          />

          <Controller
            name="autoApproveTeams"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Auto-Approve Registrations"
                description="Skip manual review — approve all registrations instantly"
                checked={!!field.value}
                onChange={(v) => {
                  field.onChange(v);
                  setValue("requiresApproval", !v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            )}
          />
          <Box
            sx={{ height: "1px", background: "rgba(255,255,255,0.04)", mx: 2 }}
          />

          <Controller
            name="isPaid"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Paid Event"
                description="Participants must pay the registration fee"
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Box
            sx={{ height: "1px", background: "rgba(255,255,255,0.04)", mx: 2 }}
          />

          <Controller
            name="perPerson"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Charge Per Person"
                description={
                  !isTeam
                    ? "Only applicable for team competitions"
                    : !isPaid
                      ? "Enable paid event first"
                      : "Fee is charged per team member, not per team"
                }
                checked={!!field.value}
                onChange={field.onChange}
                disabled={perPersonDisabled}
              />
            )}
          />
          <Box
            sx={{ height: "1px", background: "rgba(255,255,255,0.04)", mx: 2 }}
          />

          <Controller
            name="attendanceRequired"
            control={control}
            render={({ field }) => (
              <ToggleRow
                label="Attendance Required"
                description="Track participant check-in on event day"
                checked={!!field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Box>
      </Box>

      {/* ── Prize Pool ──────────────────────────────────────────────────────── */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box>
            <SectionHeading
              title="Prize Pool *"
              subtitle="At least one prize entry is required"
            />
            {prizePoolError && <FieldError message={prizePoolError} />}
          </Box>
          <AddBtn
            onClick={() =>
              appendPrize({ rank: "", label: "", cash: "", inkind: "" })
            }
          >
            <Plus size={12} />
            Add Prize
          </AddBtn>
        </Box>

        {prizeFields.length === 0 ? (
          <Box
            sx={{
              borderRadius: "10px",
              border: `1px dashed ${prizePoolError ? "rgba(248,113,113,0.35)" : "rgba(255,255,255,0.08)"}`,
              p: 2.5,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: prizePoolError ? "#fca5a5" : "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              No prizes added — click "Add Prize" to start
            </Typography>
          </Box>
        ) : (
          prizeFields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader
                label="Prize"
                index={index}
                onRemove={() => removePrize(index)}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr",
                  gap: 1.5,
                }}
              >
                <FieldGroup label="Rank">
                  <Controller
                    name={`prizePool.${index}.rank`}
                    control={control}
                    render={({ field: f }) => (
                      <input {...f} placeholder="1st, 2nd…" style={inputCss} />
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
                        placeholder="e.g. First Place, Best UI Design…"
                        style={{
                          ...inputCss,
                          borderColor: errors.prizePool?.[index]?.label
                            ? "rgba(248,113,113,0.5)"
                            : undefined,
                        }}
                      />
                    )}
                  />
                </FieldGroup>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                }}
              >
                <FieldGroup
                  label="Cash Prize (₹)"
                  error={errors.prizePool?.[index]?.cash}
                >
                  <Controller
                    name={`prizePool.${index}.cash`}
                    control={control}
                    render={({ field: f }) => (
                      <input
                        {...f}
                        type="number"
                        min="0"
                        placeholder="e.g. 5000"
                        style={{
                          ...inputCss,
                          borderColor: errors.prizePool?.[index]?.cash
                            ? "rgba(248,113,113,0.5)"
                            : undefined,
                        }}
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

              {/* Cash or in-kind required error */}
              {errors.prizePool?.[index]?.cash?.message && (
                <FieldError message={errors.prizePool[index].cash.message} />
              )}
            </Card>
          ))
        )}
      </Box>

      {/* ── Promo Codes ─────────────────────────────────────────────────────── */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box>
            <SectionHeading
              title="Promo Codes"
              subtitle={
                promoDisabled
                  ? !isPaid
                    ? "Enable Paid Event to add promo codes"
                    : "Set a registration fee > 0 to add promo codes"
                  : "Discount codes for registrations"
              }
            />
            {promoCodesError && <FieldError message={promoCodesError} />}
          </Box>
          <AddBtn
            disabled={promoDisabled}
            onClick={() =>
              !promoDisabled &&
              appendPromo({
                code: generatePromoCode(),
                discountType: "PERCENT",
                discountValue: 10,
                maxUses: "",
                isActive: true,
                description: "",
              })
            }
          >
            <Plus size={12} />
            Add Promo Code
          </AddBtn>
        </Box>

        {promoFields.length === 0 && (
          <Box
            sx={{
              borderRadius: "10px",
              border: "1px dashed rgba(255,255,255,0.07)",
              p: 2.5,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.18)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {promoDisabled
                ? "Promo codes require a paid event with a fee"
                : "No promo codes added yet"}
            </Typography>
          </Box>
        )}

        {promoFields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader
              label="Promo"
              index={index}
              onRemove={() => removePromo(index)}
              extra={
                <button
                  type="button"
                  title="Regenerate code"
                  onClick={() =>
                    updatePromo(index, {
                      ...promoFields[index],
                      code: generatePromoCode(),
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 5,
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    padding: "3px 7px",
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  <RefreshCw size={10} />
                  Regen
                </button>
              }
            />

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
                      style={{
                        ...inputCss,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        borderColor: errors.promoCodes?.[index]?.code
                          ? "rgba(248,113,113,0.5)"
                          : undefined,
                      }}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Type">
                <Controller
                  name={`promoCodes.${index}.discountType`}
                  control={control}
                  render={({ field: f }) => (
                    <select {...f} style={selectCss}>
                      <option value="PERCENT" style={{ background: "#0e0e0e" }}>
                        % Percent
                      </option>
                      <option value="FLAT" style={{ background: "#0e0e0e" }}>
                        ₹ Flat
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
                      style={{
                        ...inputCss,
                        borderColor: errors.promoCodes?.[index]?.discountValue
                          ? "rgba(248,113,113,0.5)"
                          : undefined,
                      }}
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
                      placeholder="Early bird, Ambassador…"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 0.5,
              }}
            >
              <FieldLabel>Active</FieldLabel>
              <Controller
                name={`promoCodes.${index}.isActive`}
                control={control}
                render={({ field: f }) => (
                  <button
                    type="button"
                    onClick={() => f.onChange(!f.value)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: "none",
                      background: f.value
                        ? "rgba(168,85,247,0.75)"
                        : "rgba(255,255,255,0.1)",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: f.value ? 21 : 3,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                )}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
