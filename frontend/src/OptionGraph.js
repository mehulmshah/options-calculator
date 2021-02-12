/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  makeStyles,
  Slider,
  Tooltip,
  useTheme,
  Theme,
  Typography,
} from "@material-ui/core";
import moment from "moment";
import blackScholes from "black-scholes";
import { ResponsiveLine } from '@nivo/line';

const GainColor = "#00C805";
const LossColor = "#FF5000";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
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
    width: 1000,
    height: 650,
  },
  halfWidth: {
    width: "30%",
  },
  cardHeader: {
    fontSize: 16,
  }
}));

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
  const theme = useTheme();
  const [stockRange, setStockRange] = React.useState(9);
  const [daysInFutureSlider, setDaysInFutureSlider] = React.useState(0);
  const [daysInFuture, setDaysInFuture] = React.useState(0);
  const [clickEvent, setClickEvent] = React.useState({});
  const daysUntilExpiration = Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;

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

    const chartTheme = {
      textColor: theme.palette.type === "light" ? "black" : "white",
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
            fontSize: 16,
            fill: theme.palette.type === "light" ? "black" : "white",
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
                lineStyle: { stroke: '#0CB0E6', strokeWidth: 2 },
                legend: 'Live Stock Price: $' + currPrice,
                legendPosition: 'top',
                itemTextColor: '#add8e6',
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
          margin={{ top: 50, right: 110, bottom: 70, left: 80 }}
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
              legendOffset: 50,
              legendPosition: 'middle',
              format: (values) => `$${values}`,
          }}
          axisLeft={{
              orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'profit',
              legendOffset: -65,
              legendPosition: 'middle',
              format: (values) => `$${values}`,
          }}
          enableArea={true}
          enablePoints={false}
          useMesh={true}
          theme={chartTheme}
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

  return (
    <>
      <Grid container justify="center" spacing={3}>
        <Grid item>{generateChart()}</Grid>
        <Grid container direction="column" className={classes.root}>
          <Grid container direction="row" spacing={4}>
            <Grid item xs>
              <Tooltip title="Adjust the range of stock prices shown in the graph" placement="top-start">
              <Typography id="range-slider" gutterBottom>
                Stock Price Axis Range: ± {stockRange}%
              </Typography>
              </Tooltip>
              <Slider
                value={stockRange}
                min={0}
                step={0.5}
                max={50}
                onChange={(e, nV) => setStockRange(nV)}
                aria-labelledby="non-range-slider"
              />
            </Grid>
            <Grid item xs>
              <Tooltip title="Adjust the date" placement="top-start">
                <Typography id="date-slider" gutterBottom>
                  Date: {daysInFuture < 1 && "Today"} ({moment().add(Math.floor(daysInFuture), "days").format("MMM Do")})
                </Typography>
              </Tooltip>
              <Slider
                value={daysInFutureSlider}
                onChange={(e, nV) => {
                  setDaysInFutureSlider(nV);
                  setDaysInFuture((daysUntilExpiration*(nV)/100));
                }}
                aria-labelledby="date-slider"
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Card className={classes.table}>
            <CardHeader
              classes={{
                title: classes.CardHeader,
              }}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title={clickEvent.data ? (`Exercise ${symbol}
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
