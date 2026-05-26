import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  useAcceptBidMutation,
  useOpenRequestMutation,
  useRoomSnapshotQuery,
} from "../../../lib/queries";
import { useRoomSocket } from "../../../lib/use-room-socket";
import { useAppState } from "../../context";
import { ProviderBidCard } from "./provider-bid-card";
import { getProviderExistingBid } from "./provider-bid-card-state";
import {
  formatBidAmount,
  getRoomWorkspaceControls,
  type RoomWorkspace,
} from "./room-workspace";

const requestStatus = (tag: string) => tag.replace("Request", "").toLowerCase();

const formatETADate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatProviderDisplayName = (displayName: string) => {
  const firstLetter = displayName.charAt(0).toUpperCase();
  return `${firstLetter}${displayName.slice(1)}`;
};

export function RequestRoomPage() {
  const { requestId = "unknown" } = useParams();
  const setLastVisitedRequestId = useAppState(
    (state) => state.setLastVisitedRequestId,
  );
  const session = useAppState((state) => state.session);
  const authUser = useAppState((state) => state.authUser);
  const [workspace, setWorkspace] = useState<RoomWorkspace>("provider");
  const roomQuery = useRoomSnapshotQuery(requestId);
  const acceptBid = useAcceptBidMutation(requestId);
  const openRequest = useOpenRequestMutation();

  useRoomSocket(requestId);

  const request = roomQuery.data?.request;
  const bids =
    request?._tag === "OpenRequest" || request?._tag === "AwardedRequest"
      ? request.bids
      : [];
  const status = request ? requestStatus(request._tag) : undefined;
  const controls = request
    ? getRoomWorkspaceControls(workspace, request._tag)
    : undefined;
  const providerId = session?.authUserId ?? authUser?.id;
  const existingProviderBid = getProviderExistingBid(providerId, bids);

  useEffect(() => {
    setLastVisitedRequestId(requestId);
  }, [requestId, setLastVisitedRequestId]);

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Typography variant="overline" color="primary.main">
          Live request room
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h2">{request?.title ?? "Request room"}</Typography>
          {request && (
            <Stack direction="row" spacing={1}>
              <Chip
                label={status}
                color={request._tag === "OpenRequest" ? "success" : "default"}
                variant={request._tag === "DraftRequest" ? "outlined" : "filled"}
                size="small"
              />
              {request._tag === "AwardedRequest" && (
                <Chip label="Awarded" color="success" size="small" />
              )}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Card elevation={0}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h3">Workspace</Typography>
              <ToggleButtonGroup
                exclusive
                value={workspace}
                size="small"
                onChange={(_, nextWorkspace: RoomWorkspace | null) => {
                  if (nextWorkspace) {
                    setWorkspace(nextWorkspace);
                  }
                }}
                aria-label="Room workspace"
              >
                <ToggleButton value="patient">Patient</ToggleButton>
                <ToggleButton value="provider">Provider</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {controls?.canOpenRequest && (
              <Button
                variant="contained"
                disabled={openRequest.isPending}
                onClick={() => openRequest.mutate(requestId)}
                size="small"
              >
                {openRequest.isPending ? "Opening..." : "Open for bidding"}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h3">
              {bids.length > 0 ? "Bids" : "No bids yet"}
            </Typography>
            {roomQuery.isLoading && <Skeleton variant="rounded" height={120} />}
            <List disablePadding>
              {bids.map((entry, index) => (
                <ListItem
                  key={entry.id}
                  sx={{
                    bgcolor: request?._tag === "AwardedRequest" && request.awardedBidId === entry.id ? "rgba(36, 122, 77, 0.08)" : "background.default",
                    border: 1,
                    borderColor: request?._tag === "AwardedRequest" && request.awardedBidId === entry.id ? "success.main" : "divider",
                    mb: 1,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary={formatProviderDisplayName(entry.providerDisplayName)}
                    secondary={
                      <Stack component="span" spacing={0.5} direction="row" flexWrap="wrap" useFlexGap>
                        <Typography component="span" variant="body2" color="text.secondary">
                          Available {formatETADate(entry.availableDate)}
                        </Typography>
                        {entry.notes && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            &middot; Notes: {entry.notes}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography fontWeight={900} color="primary.main">
                      {formatBidAmount(entry.amount)}
                    </Typography>
                    {request?._tag === "AwardedRequest" &&
                      request.awardedBidId === entry.id && (
                        <Chip label="Accepted" color="success" size="small" />
                      )}
                    {controls?.canAcceptBid && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={acceptBid.isPending}
                        onClick={() => acceptBid.mutate({ bidId: entry.id })}
                      >
                        Accept
                      </Button>
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>

            {roomQuery.isSuccess && bids.length === 0 && (
              <Typography color="text.secondary" variant="body2">
                Bids will appear here once providers respond.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {controls?.canPlaceBid && (
        <ProviderBidCard
          requestId={requestId}
          existingBid={existingProviderBid}
        />
      )}
    </Stack>
  );
}
