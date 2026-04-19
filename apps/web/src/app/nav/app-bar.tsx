import { AppBar as MuiAppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material"
import { NavLink } from "react-router-dom"

import { APP_NAME, primaryNavigation } from "../contants"

export function AppBar() {
  return (
    <MuiAppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
        <Typography variant="h6" fontWeight={800} color="primary.main">
          {APP_NAME}
        </Typography>

        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Stack direction="row" spacing={1}>
            {primaryNavigation.map((item) => (
              <Button key={item.to} component={NavLink} to={item.to} color="inherit">
                {item.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Toolbar>
    </MuiAppBar>
  )
}
