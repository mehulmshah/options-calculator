/* Loading.tsx
 * This component renders a spinning circle to indicate something is loading.
 */

import React from "react";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles, Theme } from "@material-ui/core/styles/";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    zIndex: theme.zIndex.modal + 10,
  },
}));

function Loading() {
  const classes = useStyles();

  return (
    <Backdrop className={classes.root} open={true}>
      <Grid container direction="column" alignItems="center" spacing={1}>
        <Grid item>
          <CircularProgress variant="indeterminate" disableShrink={true} />
        </Grid>
        <Grid item>
          <Typography variant="h6">Loading...</Typography>
        </Grid>
      </Grid>
    </Backdrop>
  );
}

export default Loading;
