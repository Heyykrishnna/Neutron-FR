"use client";

import { TextField, InputAdornment } from "@mui/material";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  fullWidth = false,
  sx = {},
}) {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  return (
    <TextField
      fullWidth={fullWidth}
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      placeholder={placeholder}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search size={20} />
          </InputAdornment>
        ),
      }}
      sx={sx}
    />
  );
}
