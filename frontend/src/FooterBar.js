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
  Theme,
  Toolbar,
  Typography,
} from "@material-ui/core";
import TwitterIcon from "@material-ui/icons/Twitter";
import logo from "./logo.svg";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: "lightgray",
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "5rem",
    overflow: "hidden",
  },
  close: {
    padding: theme.spacing(0.5),
  },
  dashboardHeader: {
    fontSize: 35,
    fontWeight: "bold",
  },
  header: {
    marginBottom: 100,
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: "bold",
  },
  appBar: {
    width: "100vw",
    color: theme.palette.primary.contrastText,
    margin: theme.spacing(1),
  },
  leftSide: {
    marginLeft: "auto",
  },
  logo: {
    width: 50,
    height: 50,
  },
  signInButton: {
    marginLeft: "auto",
    color: "black",
  },
}));

function FooterBar() {
  const classes = useStyles();

  return (
    <Grid className={classes.root} container justify="center">
      <Toolbar className={classes.appBar}>
        <Grid item xs>
          <Typography>
            Copyright © 2021 JQuant | <a href="/">Terms & Conditions</a>
          </Typography>
        </Grid>
      </Toolbar>
    </Grid>
  );
}

export default FooterBar;
