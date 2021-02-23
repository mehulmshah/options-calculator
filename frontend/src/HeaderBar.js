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
import moment from "moment";
import mtz from "moment-timezone";
import Countdown from "react-countdown";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    overflow: "hidden",
    backgroundColor: theme.palette.type === "dark" ? "gray" : "white",
  },
  close: {
    padding: theme.spacing(0.5),
  },
  appBar: {
    width: "96vw",
    height: 100,
    color: theme.palette.primary.contrastText,
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
  marketCountdown: {
    marginLeft: "auto",
    border: '2px black',
  },
  timeBox: {
    padding: 10,
    marginRight: 10,
    fontSize: 16,
    border: ({ marketOpen }) => marketOpen ? "1px solid green" : "1px solid black",
    borderRadius: 10,
  },
}));

function HeaderBar() {
  const theme = useTheme();
  const [currTime, setCurrTime] = React.useState(mtz.tz(moment(), "America/New_York"));

  setInterval(() => {
    setCurrTime(mtz.tz(moment(), "America/New_York"));
  }, 1000);

  const marketOpen = currTime.day() > 0 && currTime.day() < 6 &&
                     (currTime.format('a')==='am' && currTime.hour() > 6 && currTime.minutes() > 29) ||
                     (currTime.format('a')==='pm' && currTime.hour() < 16);

  const classes = useStyles({ marketOpen });


  return (
    <Grid className={classes.root} container direction="column" wrap="nowrap">
      <Grid item>
        <Toolbar className={classes.appBar}>
          <img alt={"logo"} src={logo} className={classes.logo}/>
          <div className={classes.signInButton} style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
          }}>
            <div className={classes.timeBox}>
              {marketOpen ? (
              <span>
                Market closes in 0{15-currTime.hours()}:
                {currTime.minutes()>50 && '0'}{60-currTime.minutes()}:
                {currTime.seconds()>50 && '0'}{60-currTime.seconds()}
              </span>
              ) : (
              <span>
                Market Closed
              </span>
              )}
            </div>
            <Button variant="contained" color="primary">
              Sign In
            </Button>
          </div>

        </Toolbar>
      </Grid>
    </Grid>
  );
}

export default HeaderBar;
