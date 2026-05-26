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
          <Typography variant="h2">Patient dashboard</Typography>
          <Typography color="text.secondary">
            Review active requests and jump into bidding rooms.
          </Typography>
        </div>

        <Button component={RouterLink} to="/" variant="outlined">
          Switch workspace
        </Button>
      </Stack>

      <Alert severity="info">
        Request creation, opening, bidding, and award state are backed by the demo API and persisted in Postgres.
      </Alert>

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
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h3">
                      {request.title}
                    </Typography>
                    <Chip
                      label={requestStatus(request._tag)}
                      color={request._tag === "OpenRequest" ? "success" : "default"}
                      variant={request._tag === "DraftRequest" ? "outlined" : "filled"}
                    />
                  </Stack>
                  <Box>
                    <Chip
                      label={request.category.replaceAll("_", " ")}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2">
                    {request.description}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
