import React from "react"
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  Skeleton,
} from "@mui/material"
import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { primaryNavigation } from "../contants"

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const value = useMemo(() => {
    const matched = primaryNavigation.find((item) =>
      item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to),
    )

    return matched?.to ?? "/"
  }, [location.pathname])

  return (
    <Paper
      elevation={0}
      sx={{
        position: "sticky",
        bottom: 0,
        borderTop: 1,
        borderColor: "divider",
        display: { xs: "block", md: "none" },
      }}
    >
      <MuiBottomNavigation value={value} onChange={(_, nextValue) => navigate(nextValue)} showLabels>
        {primaryNavigation.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} value={item.to} />
        ))}
      </MuiBottomNavigation>
    </Paper>
  )
}

export function BottomNavigationSkeleton() {
  return (
    <Box sx={{ display: { xs: "block", md: "none" }, px: 2, py: 1.5 }}>
      <Skeleton variant="rounded" height={56} />
    </Box>
  )
}
