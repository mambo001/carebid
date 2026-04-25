import React from "react"
import {
  Alert,
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

import { useRequestsQuery } from "../../../lib/queries"
import { useAppState } from "../../context"

export function ProviderDashboardPage() {
  const setActiveRole = useAppState((state) => state.setActiveRole)
  const requestsQuery = useRequestsQuery()
  const requests = (requestsQuery.data?.items ?? []).filter((request) => request.status === "open")

  return (
    <Stack spacing={3}>
      <Alert severity="info">Provider filtering is scaffolded. Eligibility and bidding now run through the room Durable Object.</Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h2">Provider dashboard</Typography>
          <Typography color="text.secondary">
            Review eligible requests and join the live bidding room.
          </Typography>
        </div>

        <Button variant="contained" onClick={() => setActiveRole("provider")}>
          Use provider role
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {requestsQuery.isLoading &&
          [0, 1].map((item) => (
            <Grid key={item} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}

        {requests.map((request) => (
          <Grid key={request.id} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                      {request.title}
                    </Typography>
                    <Chip label={request.urgency} color={request.urgency === "urgent" ? "error" : "default"} />
                  </Stack>
                  <Typography color="text.secondary">
                    {request.category.replaceAll("_", " ")} · {request.locationCity}
                  </Typography>
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
