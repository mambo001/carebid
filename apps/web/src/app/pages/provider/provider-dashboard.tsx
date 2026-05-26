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
          <Typography variant="h2">Provider dashboard</Typography>
          <Typography color="text.secondary">
            Review eligible requests and join the live bidding room.
          </Typography>
        </div>

        <Button component={RouterLink} to="/" variant="outlined">
          Switch workspace
        </Button>
      </Stack>

      <Alert severity="info">Providers see open requests, place bids through the API, and receive room changes via server-sent events.</Alert>

      <Grid container spacing={3}>
        {requestsQuery.isLoading &&
          [0, 1].map((item) => (
            <Grid key={item} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}

        {requests.map((request) => (
          <Grid key={request.id} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h3">
                      {request.title}
                    </Typography>
                    <Chip label="open" color="success" />
                  </Stack>
                  <Box>
                    <Chip
                      label={request.category.replaceAll("_", " ")}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2">{request.description}</Typography>
                  <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined">
                    Join room
                  </Button>
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
