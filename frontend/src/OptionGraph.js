/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  InputLabel,
  Grid,
  makeStyles,
  withStyles,
  Paper,
  Slider,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import CloseIcon from '@material-ui/icons/Close';
import moment from "moment";
import blackScholes from "black-scholes";
import greeks from "greeks";
import { ResponsiveLine } from '@nivo/line';
import { linearGradientDef } from '@nivo/core';

const GainColor = "#00C805";
const LossColor = "#FF5000";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  bold: {
    fontWeight: "bold",
  },
  dialog: {
    margin: theme.spacing(1),
  },
  table: {
    width: "100%",
    maxHeight: 230,
  },
  spacing: {
    margin: theme.spacing(1),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  underlined: {
    textDecoration: "underline",
    color: "#ffa500",
  },
  italics: {
    fontStyle: "italic",
  },
  testContainer: {
    width: 800,
    height: 600,
  },
  halfWidth: {
    width: "30%",
  },
  cardHeader: {
    fontSize: 16,
  }
}));

const IOSSlider = withStyles((theme: Theme) => ({
  root: {
    color: "#3880ff",
    height: 2,
    padding: "15px 0",
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: "#fff",
    marginTop: -14,
    marginLeft: -14,
    "&:focus, &:hover, &$active": {
      boxShadow:
        "0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)",
    },
  },
  active: {},
  valueLabel: {
    left: "calc(-50% + 12px)",
    top: -22,
    "& *": {
      background: "transparent",
      color: theme.palette.type === "light" ? "#000" : "#fff",
    },
  },
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: "#bfbfbf",
  },
  mark: {
    backgroundColor: "#bfbfbf",
    height: 8,
    width: 1,
    marginTop: -3,
  },
  markActive: {
    opacity: 1,
    backgroundColor: "currentColor",
  },
}))(Slider);

interface OptionGraphProps {
  symbol: string;
  currPrice: number;
  selectedOption: any;
  callsOrPuts: string;
  expiration: string;
  config: any;
}

function OptionGraph({
  symbol,
  currPrice,
  selectedOption,
  callsOrPuts,
  expiration,
  config,
}: OptionGraphProps) {
  const classes = useStyles();
  const tableRef = React.createRef();
  const selectedRef = React.createRef();
  const [selected, setSelected] = React.useState({});
  const [quantity, setQuantity] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [stockRange, setStockRange] = React.useState(9);
  const [daysInFuture, setDaysInFuture] = React.useState(0.0);
  const [clickEvent, setClickEvent] = React.useState({});

  const generateChart = () => {
    let timeDiffInYears = (
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1 + daysInFuture) /
      365;
    let chartPosData = [];
    let chartNegData = [];
    for (let i = currPrice*(1-stockRange/100); i < currPrice*(1+stockRange/100); i+= 0.1) {
      let tempObj = {};
      let output = blackScholes.blackScholes(
        i,
        selectedOption.strike,
        timeDiffInYears,
        selectedOption.impliedVolatility,
        0.056,
        callsOrPuts
      );
      tempObj.x = i;
      tempObj.y = 100*(output - (config.avgCost ? config.avgCost : selectedOption.lastPrice));
      if (tempObj.y >= 0) {
        chartPosData.push(tempObj);
      } else {
        chartNegData.push(tempObj);
      }
    };

    var data = [
      {
        id: 'positive',
        data: chartPosData
      },
      {
        id: 'negative',
        data: chartNegData
      }
    ];

    const theme = {
      textColor: 'white',
      fontSize: 14,
      grid: {
          line: {
            stroke: "gray",
            strokeWidth: 1,
            strokeDasharray: "8 8"
          }
      },
      axis: {
        legend: {
          text: {
            fill: '#fff'
          }
        }
      },
    };

    return (
      <div className={classes.testContainer}>
        <ResponsiveLine
          data={data}
          markers={[
            {
                axis: 'y',
                value: clickEvent.data && clickEvent.data.y,
                lineStyle: { stroke: 'black', strokeWidth: 2 },
            },
            {
                axis: 'x',
                value: clickEvent.data && clickEvent.data.x,
                lineStyle: { stroke: 'black', strokeWidth: 2 },
            },
            {
                axis: 'x',
                value: currPrice,
                lineStyle: { stroke: '#add8e6', strokeWidth: 1 },
                legend: 'Live Stock Price: $' + currPrice,
                legendPosition: 'top',
                itemTextColor: '#fff',
            },
          ]}
          defs={[
            {
                id: 'gradientLoss',
                type: 'linearGradient',
                colors: [
                    { offset: 0, color: LossColor },
                    { offset: 100, color: LossColor },
                ],
            },
            {
                id: 'gradientGain',
                type: 'linearGradient',
                colors: [
                    { offset: 0, color: GainColor },
                    { offset: 100, color: GainColor },
                ],
            },
          ]}
          fill={[
            // match using function
            { match: d => d.id === 'negative', id: 'gradientLoss' },
            // match all, will only affect 'elm', because once a rule match,
            // others are skipped, so now it acts as a fallback
            { match: '*', id: 'gradientGain' },
          ]}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'linear', min: 'auto', max: 'auto'}}
          xFormat=">-$.2f"
          yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
          yFormat=" >-$.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
              orient: 'bottom',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'stock price',
              legendOffset: 40,
              legendPosition: 'middle'
          }}
          axisLeft={{
              orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'profit',
              legendOffset: -50,
              legendPosition: 'middle'
          }}
          enableArea={true}
          enablePoints={false}
          useMesh={true}
          theme={theme}
          tooltip={(input) => {
              return (
              <div>
                {input.point.data.yFormatted}
              </div>
            )}}
          colors={d=>d.id === 'positive' ? GainColor : LossColor}
          onClick={(p, e)=> setClickEvent(p)}

        />
      </div>
    );
  };

  const calcDaysUntilExpiration = () => {
    let days = Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;
    return days;
  }

  return (
    <>
      <Grid container direction="column">
        <Grid item>
          <Typography id="non-linear-slider" gutterBottom>
            Chart Range: {stockRange}%
          </Typography>
          <Slider
            value={stockRange}
            min={0}
            step={0.5}
            max={50}
            onChange={(e, nV) => setStockRange(nV)}
            aria-labelledby="non-linear-slider"
          />
        </Grid>
        <Grid item>
          <Typography id="date-slider" gutterBottom>
            Days In Future: {daysInFuture} ({moment().add(daysInFuture, "days").format("MMM Do")})
          </Typography>
          <Slider
            value={daysInFuture}
            min={0}
            step={1}
            max={calcDaysUntilExpiration()}
            onChange={(e, nV) => setDaysInFuture(nV)}
            aria-labelledby="date-slider"
          />
        </Grid>
      </Grid>
      <Grid container justify="center" spacing={2}>
        <Grid item>{generateChart()}</Grid>
          <Grid item xs={6}>
            <Card className={classes.table}>
              <CardHeader
                classes={{
                  title: classes.CardHeader,
                }}
                titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
                title={clickEvent.data ? (`Exercise ${quantity} ${symbol}
                        ${moment.unix(expiration).add(1, 'day').format('M/D')}
                        $${selectedOption.strike}c @ ${clickEvent.data.xFormatted}
                        on ${moment().add(daysInFuture, 'days').format("MMM D")}`) :
                      ('Click on the graph to view your potential exits')}
                subheader="What Does This Mean?"
              />
              <CardContent>
                {clickEvent.data && (
                  <>
                    <Typography className={classes.dialog}>
                      Cost: <span className={classes.underlined}>
                      ${((config.avgCost ? config.avgCost*100 : selectedOption.lastPrice*100) + 100*selectedOption.strike)
                        .toFixed(2).toLocaleString()}</span> (${config.avgCost ? config.avgCost*100 : selectedOption.lastPrice * 100} contract +
                        ${100*selectedOption.strike} for 100 shares
                        @ ${selectedOption.strike})
                    </Typography>
                    <Typography className={classes.dialog}>
                      Get: 100 {symbol} shares @ ${selectedOption.strike}/ea
                      (now worth ${clickEvent.data.x.toFixed(2)}/ea for a total
                      of <span className={classes.underlined}>
                      ${100*clickEvent.data.x.toFixed(2)}</span>)
                    </Typography>
                    <Typography className={classes.dialog}>
                      Return: <span className={classes.underlined}>
                      ${100*clickEvent.data.x.toFixed(2) - (
                        (config.avgCost ? config.avgCost*100 : selectedOption.lastPrice*100) +
                        100*selectedOption.strike)}</span> (<span className={classes.underlined}>
                          ${100*clickEvent.data.x.toFixed(2)}</span> - <span className={classes.underlined}>
                          ${((config.avgCost ? config.avgCost*100 : selectedOption.lastPrice*100) + 100*selectedOption.strike)
                            .toFixed(2).toLocaleString()}</span>)
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card className={classes.table}>
              <CardHeader
                className={classes.cardHeader}
                titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
                title={clickEvent.data ? (`Sell ${symbol}
                        ${moment.unix(expiration).add(1, 'day').format('M/D')}
                        $${selectedOption.strike}c @ ${clickEvent.data.xFormatted}
                        on ${moment().add(daysInFuture, 'days').format("MMM D")}`) :
                      ('Click on the graph to view your potential exits')}
                subheader="What Does This Mean?"
              />
              <CardContent>
                {clickEvent.data && (
                  <>
                    <Typography className={classes.dialog}>
                      Cost: <span className={classes.underlined}>
                      ${(config.avgCost ? config.avgCost*100 : selectedOption.lastPrice*100)
                        .toFixed(2).toLocaleString()}</span> (${(config.avgCost ? config.avgCost*100 : selectedOption.lastPrice*100)} contract)
                    </Typography>
                    <Typography className={classes.dialog}>
                      Get: N/A, you are just selling the contract
                    </Typography>
                    <Typography className={classes.dialog}>
                      Return: <span className={classes.underlined}>
                          ${clickEvent.data.y.toFixed(2)}</span> (
                          {(clickEvent.data.y / (config.avgCost ? config.avgCost : selectedOption.lastPrice*100)).toFixed(2)}%)
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
      </Grid>

    </>
  );
}

export default OptionGraph;
