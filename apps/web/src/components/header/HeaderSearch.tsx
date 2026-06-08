"use client";
import React from "react";
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useHeader } from "@/context/HeaderContext";

interface HeaderSearchProps {
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  disabled?: boolean;
}

export default function HeaderSearch({
  isExpanded,
  onExpand,
  onCollapse,
  disabled = false,
}: HeaderSearchProps) {
  const { searchQuery, setSearchQuery } = useHeader();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isExpanded ? "flex-start" : "center",
        position: "relative",
        width: "100%",
      }}
    >
      {isExpanded ? (
        <>
          <IconButton
            onClick={onCollapse}
            sx={{
              mr: 1,
              backgroundColor: (theme) => theme.palette.grey[200],
              "&:hover": {
                backgroundColor: (theme) => theme.palette.grey[300],
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <TextField
            placeholder="Search by name, company, or wallet"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: "100%",
              backgroundColor: (theme) => theme.palette.common.white,
              borderRadius: (theme) => theme.shape.borderRadius,
            }}
          />
        </>
      ) : (
        <Tooltip title={disabled ? "Coming soon" : ""}>
          <span>
            <IconButton
              onClick={onExpand}
              disabled={disabled}
              sx={{
                backgroundColor: (theme) => theme.palette.header.main,
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
                "&.Mui-disabled": {
                  backgroundColor: (theme) =>
                    theme.palette.action.disabledBackground,
                },
              }}
            >
              <SearchIcon
                sx={{ color: (theme) => theme.palette.common.white }}
              />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
