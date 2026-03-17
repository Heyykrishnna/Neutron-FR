"use client";

import { Controller, useFieldArray } from "react-hook-form";
import { Box } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { FieldGroup, inputCss } from "./CompetitionBasicInfoStep";

export default function CompetitionScheduleVenueStep({ control, errors }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subVenues",
  });

  const dateInputCss = {
    ...inputCss,
    colorScheme: "dark",
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
      {/* Start Time */}
      <FieldGroup label="Start Time" error={errors.startTime}>
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <input type="datetime-local" {...field} style={dateInputCss} />
          )}
        />
      </FieldGroup>

      {/* End Time */}
      <FieldGroup label="End Time" error={errors.endTime}>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <input type="datetime-local" {...field} style={dateInputCss} />
          )}
        />
      </FieldGroup>

      {/* Registration Deadline — spans full width */}
      <FieldGroup
        label="Registration Deadline"
        error={errors.registrationDeadline}
        span={2}
      >
        <Controller
          name="registrationDeadline"
          control={control}
          render={({ field }) => (
            <input type="datetime-local" {...field} style={dateInputCss} />
          )}
        />
      </FieldGroup>

      {/* Venue Name — full width */}
      <FieldGroup label="Venue Name" error={errors.venueName} span={2}>
        <Controller
          name="venueName"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="e.g. Main Auditorium"
              style={inputCss}
            />
          )}
        />
      </FieldGroup>

      {/* Room */}
      <FieldGroup label="Room" error={errors.venueRoom}>
        <Controller
          name="venueRoom"
          control={control}
          render={({ field }) => (
            <input {...field} placeholder="e.g. Room 201" style={inputCss} />
          )}
        />
      </FieldGroup>

      {/* Floor */}
      <FieldGroup label="Floor" error={errors.venueFloor}>
        <Controller
          name="venueFloor"
          control={control}
          render={({ field }) => (
            <input {...field} placeholder="e.g. 2nd Floor" style={inputCss} />
          )}
        />
      </FieldGroup>

      <Box sx={{ gridColumn: "1 / -1", mt: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.8)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 500,
            }}
          >
            Sub Venues
          </Box>
          <button
            type="button"
            onClick={() =>
              append({
                name: "",
                room: "",
                floor: "",
                capacity: "",
                notes: "",
              })
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
            Add Sub Venue
          </button>
        </Box>

        {fields.length === 0 && (
          <Box
            sx={{
              borderRadius: "10px",
              border: "1px dashed rgba(255,255,255,0.08)",
              p: 2,
              textAlign: "center",
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            No sub venues added yet
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  fontSize: 11,
                  color: "rgba(168,85,247,0.7)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                }}
              >
                SUB VENUE #{index + 1}
              </Box>
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

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              <FieldGroup
                label="Name *"
                error={errors.subVenues?.[index]?.name}
              >
                <Controller
                  name={`subVenues.${index}.name`}
                  control={control}
                  render={({ field: f }) => (
                    <input {...f} placeholder="e.g. Stage A" style={inputCss} />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Room">
                <Controller
                  name={`subVenues.${index}.room`}
                  control={control}
                  render={({ field: f }) => (
                    <input {...f} placeholder="e.g. Lab 3" style={inputCss} />
                  )}
                />
              </FieldGroup>
            </Box>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              <FieldGroup label="Floor">
                <Controller
                  name={`subVenues.${index}.floor`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      placeholder="e.g. 1st Floor"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup label="Capacity">
                <Controller
                  name={`subVenues.${index}.capacity`}
                  control={control}
                  render={({ field: f }) => (
                    <input
                      {...f}
                      type="number"
                      min="1"
                      placeholder="e.g. 120"
                      style={inputCss}
                    />
                  )}
                />
              </FieldGroup>
            </Box>

            <FieldGroup label="Notes">
              <Controller
                name={`subVenues.${index}.notes`}
                control={control}
                render={({ field: f }) => (
                  <input
                    {...f}
                    placeholder="Anything important for this sub venue"
                    style={inputCss}
                  />
                )}
              />
            </FieldGroup>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
