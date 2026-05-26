import React from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

import { useOpenRequestsQuery } from "../../../lib/queries"

export function ProviderDashboardPage() {
  const requestsQuery = useOpenRequestsQuery()
  const requests = requestsQuery.data?.items ?? []

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <div>
          <Typography variant="overline" color="primary.main">
            Provider workspace
          </Typography>
          <Typography variant="h2">Open requests</Typography>
          <Typography color="text.secondary">
            Place bids on open requests and track live room updates.
          </Typography>
        </div>

        <Button component={RouterLink} to="/" variant="outlined">
          Switch workspace
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {requestsQuery.isLoading &&
          [0, 1].map((item) => (
            <Grid key={item} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}

        {requests.map((request) => (
          <Grid key={request.id} size={{ xs: 12, md: 6 }}>
            <Card elevation={0}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h3">{request.title}</Typography>
                    <Chip label="open" color="success" size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineClamp: 2 }}>
                    {request.description}
                  </Typography>
                  <Box>
                    <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined" size="small">
                      Join room
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {requestsQuery.isSuccess && requests.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning">No eligible requests available yet.</Alert>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}
