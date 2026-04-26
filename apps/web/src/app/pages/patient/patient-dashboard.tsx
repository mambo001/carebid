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
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { useOpenRequestMutation, useRequestsQuery } from "../../../lib/queries";
import { PatientRequestFormCard } from "./request-form-card";

const requestStatus = (tag: string) => tag.replace("Request", "").toLowerCase()

export function PatientDashboardPage() {
  const requestsQuery = useRequestsQuery();
  const openRequest = useOpenRequestMutation();
  const requests = requestsQuery.data?.items ?? [];

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        Patient flow is scaffolded. Request creation is running through the demo
        API.
      </Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h2">Patient dashboard</Typography>
          <Typography color="text.secondary">
            Review active requests and jump into bidding rooms.
          </Typography>
        </div>

        <Button component={RouterLink} to="/" variant="outlined">
          Switch workspace
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={12}>
          <PatientRequestFormCard />
        </Grid>

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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6" fontWeight={700}>
                      {request.title}
                    </Typography>
                    <Chip label={requestStatus(request._tag)} color={request._tag === "OpenRequest" ? "success" : "default"} />
                  </Stack>
                  <Typography color="text.secondary">
                    {request.category.replaceAll("_", " ")}
                  </Typography>
                  <Typography variant="body2">
                    {request.description}
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    {request._tag === "DraftRequest" && (
                      <Button
                        variant="contained"
                        onClick={() => openRequest.mutate(request.id)}
                      >
                        Open request
                      </Button>
                    )}
                    <Button
                      component={RouterLink}
                      to={`/requests/${request.id}`}
                      variant="outlined"
                    >
                      Open room
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {requestsQuery.isSuccess && requests.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning">No requests available yet.</Alert>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}
