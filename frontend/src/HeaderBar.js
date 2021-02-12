/* QuoteView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  Grid,
  makeStyles,
  useTheme,
  Theme,
  Toolbar,
} from "@material-ui/core";
import logo from "./logo.svg";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    overflow: "hidden",
    backgroundColor: theme.palette.type === "dark" ? "gray" : "white",
  },
  close: {
    padding: theme.spacing(0.5),
  },
  dashboardHeader: {
    fontSize: 35,
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: "bold",
  },
  appBar: {
    width: "95vw",
    color: theme.palette.primary.contrastText,
  },
  leftSide: {
    marginLeft: "auto",
  },
  logo: {
    width: 250,
    height: 187.5,
    marginBottom: -30,
    marginTop: -30
  },
  signInButton: {
    marginLeft: "auto",
    color: "black",
  },
}));

function HeaderBar() {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <Grid className={classes.root} container direction="column" wrap="nowrap">
      <Grid item>
        <Toolbar className={classes.appBar}>
          <img alt={"logo"} src={logo} className={classes.logo}/>
          <Button variant="contained" color="primary" className={classes.signInButton}>
            Sign In
          </Button>
        </Toolbar>
      </Grid>
    </Grid>
  );
}

export default HeaderBar;
