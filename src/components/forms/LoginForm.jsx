"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Mail, Lock, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const fieldSx = {
  mb: 2.5,
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    letterSpacing: "0.04em",
    color: "#c8d8ff",
    transition: "box-shadow 0.2s",
    "& fieldset": {
      borderColor: "rgba(100,140,255,0.15)",
      borderWidth: "1px",
    },
    "&:hover fieldset": { borderColor: "rgba(100,140,255,0.35)" },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(120,160,255,0.6)",
      borderWidth: "1px",
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(80,120,255,0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(160,185,255,0.45)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    letterSpacing: "0.06em",
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(140,175,255,0.8)" },
  "& .MuiFormHelperText-root": {
    color: "rgba(255,120,120,0.8)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
  },
};

export function LoginForm({ onSubmit, loading, error, onGoogleLogin }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: "100%" }}
    >
      {/* Heading inside card */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: "#ddeaff",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Secure Access
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(140,165,255,0.45)",
            mt: 0.75,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.06em",
          }}
        >
          Authenticate to enter the control panel
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: "rgba(255,60,60,0.08)",
            border: "1px solid rgba(255,60,60,0.2)",
            color: "#ffaaaa",
            borderRadius: "10px",
            "& .MuiAlert-icon": { color: "#ff8888" },
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
          }}
        >
          {error}
        </Alert>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Email address"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <Mail
                  size={15}
                  style={{
                    marginRight: 10,
                    color: "rgba(120,160,255,0.5)",
                    flexShrink: 0,
                  }}
                />
              ),
            }}
            sx={fieldSx}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Password"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <Lock
                  size={15}
                  style={{
                    marginRight: 10,
                    color: "rgba(120,160,255,0.5)",
                    flexShrink: 0,
                  }}
                />
              ),
            }}
            sx={{ ...fieldSx, mb: 3.5 }}
          />
        )}
      />

      {/* Primary CTA */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        endIcon={loading ? null : <ArrowRight size={16} />}
        sx={{
          mb: 3,
          height: 48,
          borderRadius: "10px",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, #3356d4 0%, #5577ff 100%)",
          boxShadow:
            "0 4px 24px rgba(60,90,220,0.35), 0 0 0 1px rgba(120,160,255,0.15) inset",
          transition: "all 0.25s",
          "&:hover": {
            background: "linear-gradient(135deg, #3d65e8 0%, #6688ff 100%)",
            boxShadow:
              "0 6px 32px rgba(60,90,220,0.5), 0 0 0 1px rgba(140,175,255,0.2) inset",
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
          "&.Mui-disabled": {
            background: "rgba(60,80,160,0.25)",
            color: "rgba(180,200,255,0.3)",
          },
        }}
      >
        {loading ? (
          <CircularProgress size={18} sx={{ color: "rgba(180,210,255,0.6)" }} />
        ) : (
          "Sign In"
        )}
      </Button>

      <Divider
        sx={{
          mb: 3,
          "&::before, &::after": { borderColor: "rgba(100,140,255,0.1)" },
          "& .MuiDivider-wrapper": { px: 1.5 },
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            letterSpacing: "0.25em",
            color: "rgba(140,165,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            textTransform: "uppercase",
          }}
        >
          or
        </Typography>
      </Divider>

      {/* Google SSO */}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        onClick={onGoogleLogin}
        disabled={loading}
        startIcon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
        sx={{
          height: 48,
          borderRadius: "10px",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 500,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "none",
          color: "rgba(200,220,255,0.7)",
          borderColor: "rgba(100,140,255,0.15)",
          background: "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "rgba(100,140,255,0.35)",
            background: "rgba(100,140,255,0.06)",
            color: "rgba(200,220,255,0.9)",
          },
        }}
      >
        Continue with Google
      </Button>
    </Box>
  );
}
