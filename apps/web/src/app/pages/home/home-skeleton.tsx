import { Grid, Skeleton, Stack } from "@mui/material"

export function HomeSkeleton() {
  return (
    <Stack spacing={3} sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 4 }}>
      <Skeleton variant="text" width={160} height={24} />
      <Skeleton variant="text" width="70%" height={72} />
      <Skeleton variant="text" width="55%" height={36} />
      <Stack direction="row" spacing={2}>
        <Skeleton variant="rounded" width={180} height={44} />
        <Skeleton variant="rounded" width={180} height={44} />
      </Stack>
      <Grid container spacing={3}>
        {[0, 1].map((item) => (
          <Grid key={item} size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" height={220} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
