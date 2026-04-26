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
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";

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
  return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
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
      <Alert severity="info">
        This room streams live snapshots from the backend. The workspace switch
        is demo-only and does not change your account.
      </Alert>

      <div>
        <Typography variant="h2">Request room</Typography>
        <Typography color="text.secondary">Request ID: {requestId}</Typography>
        {request && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip
              label={`Status: ${status}`}
              color={request._tag === "OpenRequest" ? "success" : "default"}
            />
            {request._tag === "AwardedRequest" && (
              <Chip label={`Awarded bid: ${request.awardedBidId}`} />
            )}
          </Stack>
        )}
      </div>

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6" fontWeight={700}>
              Demo workspace
            </Typography>
            <Typography color="text.secondary">
              Switch how this room is rendered without changing backend session
              state.
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={workspace}
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
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Current leaderboard
            </Typography>
            {request && (
              <Typography color="text.secondary">{request.title}</Typography>
            )}
            <Divider />
            {roomQuery.isLoading && <Skeleton variant="rounded" height={180} />}
            <List disablePadding>
              {bids.map((entry, index) => (
                <ListItem key={entry.id} disablePadding sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={`${index + 1}. ${formatProviderDisplayName(entry.providerDisplayName)}`}
                    secondary={`ETA: ${formatETADate(entry.availableDate)}${entry.notes ? ` · ${entry.notes}` : ""}`}
                  />
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    alignItems={{ md: "center" }}
                  >
                    <Typography fontWeight={700}>
                      {formatBidAmount(entry.amount)}
                    </Typography>
                    {request?._tag === "AwardedRequest" &&
                      request.awardedBidId === entry.id && (
                        <Chip label="Accepted" color="success" />
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
              <Alert severity="warning">No bids in this room yet.</Alert>
            )}

            {controls?.canOpenRequest && (
              <Button
                variant="contained"
                disabled={openRequest.isPending}
                onClick={() => openRequest.mutate(requestId)}
              >
                {openRequest.isPending
                  ? "Opening..."
                  : "Open request for bidding"}
              </Button>
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
