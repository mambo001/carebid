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

import { useOpenRequestMutation, useRequestsQuery } from "../../../lib/queries"
import { PatientRequestFormCard } from "./request-form-card"

const requestStatus = (tag: string) => tag.replace("Request", "").toLowerCase()

export function PatientDashboardPage() {
  const requestsQuery = useRequestsQuery()
  const openRequest = useOpenRequestMutation()
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
            Patient workspace
          </Typography>
          <Typography variant="h2">Your requests</Typography>
          <Typography color="text.secondary">
            Create, open, and award bids on care requests.
          </Typography>
        </div>

        <Button component={RouterLink} to="/" variant="outlined">
          Switch workspace
        </Button>
      </Stack>

      <PatientRequestFormCard />

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
                    <Chip
                      label={requestStatus(request._tag)}
                      color={request._tag === "OpenRequest" ? "success" : "default"}
                      variant={request._tag === "DraftRequest" ? "outlined" : "filled"}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineClamp: 2 }}>
                    {request.description}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {request._tag === "DraftRequest" && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => openRequest.mutate(request.id)}
                      >
                        Open for bidding
                      </Button>
                    )}
                    <Button
                      component={RouterLink}
                      to={`/requests/${request.id}`}
                      variant="outlined"
                      size="small"
                    >
                      View room
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {requestsQuery.isSuccess && requests.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning">No requests yet. Create one above.</Alert>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}
