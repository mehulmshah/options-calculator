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
  withStyles,
  Slider,
  Tooltip,
  useTheme,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import moment from "moment";
import blackScholes from "black-scholes";
import { ResponsiveLine } from '@nivo/line';
import { linearGradientDef } from '@nivo/core'

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
  underlined: {
    textDecoration: "underline",
    color: "#FFA500",
  },
  underlinedLiability: {
    textDecoration: "underline",
    color: "#FF5000",
  },
  underlinedAsset: {
    textDecoration: "underline",
    color: "#00C805",
  },
  italics: {
    fontStyle: "italic",
  },
  testContainer: {
    width: 1000,
    height: 550,
  },
  cardHeader: {
    fontSize: 16,
  },
  card: {
    maxHeight: 600,
  }
}));

const StyledSlider = withStyles({
  root: {
    color: "#52af77",
    height: 5
  },
  thumb: {
    height: 24,
    width: 24,
    backgroundColor: "#fff",
    border: "4px solid currentColor",
    marginTop: -8,
    marginLeft: -12,
    "&:focus,&:hover,&$active": {
      boxShadow: "inherit"
    }
  },
  active: {},
  track: {
    height: 8,
    borderRadius: 0
  },
  rail: {
    height: 8,
    borderRadius: 0,
    opacity: 1
  }
})(Slider);

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
  const [exerciseQuantity, setExerciseQuantity] = React.useState(config.quantity);
  const [sellQuantity, setSellQuantity] = React.useState(config.quantity);
  const daysUntilExpiration = Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;
  const costPerContract = config.avgCost ? config.avgCost : selectedOption.lastPrice;

  const currencyFormat = (num) => {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  };

  const generateChart = () => {
    let timeDiffInYears = (
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1 + daysInFuture) /
      365;
    let chartPosData = [];
    let chartNegData = [];
    let adder = stockRange / 100;
    for (let i = currPrice*(1-stockRange/100); i < currPrice*(1+stockRange/100); i+= adder) {
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
      tempObj.y = config.quantity * 100 *(output - costPerContract);
      tempObj.out = output;
      tempObj.d = 100 * (output - costPerContract);
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
            stroke: "#C6C6C6",
            strokeWidth: 0.5,
            strokeDasharray: "5 5"
          }
      },
      axis: {
        domain: {
          line: {
            strokeWidth: 1,
            stroke: theme.palette.type === "light" ? "black" : "white",
          },
        },
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
              axis: 'x',
              value: clickEvent.data && clickEvent.data.x,
              lineStyle: { stroke: theme.palette.type === "light" ? "black" : "white", strokeWidth: 1, strokeDasharray: "3 3" },
            },
            {
              axis: 'y',
              value: clickEvent.data && clickEvent.data.y,
              lineStyle: { stroke: theme.palette.type === "light" ? "black" : "white", strokeWidth: 1, strokeDasharray: "3 3" },
            },
            {
                axis: 'y',
                value: 0,
                lineStyle: { stroke: theme.palette.type === "light" ? "black" : "white", strokeWidth: 1 },
            },
            {
                axis: 'x',
                value: currPrice,
                lineStyle: { stroke: '#0CB0E6', strokeWidth: 2 },
                legend: 'Live Stock Price: $' + currPrice,
                legendPosition: 'top',
                textStyle: {stroke: '#0CB0E6'},
            },
          ]}
          defs={[
            linearGradientDef('gradientLoss', [
              { offset: 0, color: LossColor, opacity: 0 },
              { offset: 30, color: LossColor, opacity: 0.7 },
              { offset: 100, color: LossColor, opacity: 1 },
            ]),
            linearGradientDef('gradientGain', [
                { offset: 0, color: GainColor },
                { offset: 70, color: GainColor, opacity: 0.7 },
                { offset: 100, color: GainColor, opacity: 0 },
            ])
          ]}
          fill={[
            // match using function
            { match: d => d.id === 'negative', id: 'gradientLoss' },
            { match: d => d.id === 'positive', id: 'gradientGain' },
            // match all, will only affect 'elm', because once a rule match,
            // others are skipped, so now it acts as a fallback
            { match: '*', id: 'gradientGain' },
          ]}
          margin={{ top: 50, right: 110, bottom: 70, left: 80 }}
          xScale={{ type: 'linear', min: 'auto', max: 'auto'}}
          xFormat=">-$.2f"
          yScale={{ type: 'linear', min: 'auto', max: 'auto'}}
          yFormat=" >-$.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
              orient: 'bottom',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Stock Price',
              legendOffset: 50,
              legendPosition: 'middle',
              format: (values) => `$${values}`,
          }}
          axisLeft={{
              axisStyle: {color: 'red'},
              orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Profit',
              legendOffset: -65,
              legendPosition: 'middle',
              format: (values) => `$${values}`,
          }}
          enableArea={true}
          areaOpacity={0.6}
          enablePoints={false}
          useMesh={true}
          crosshairType='cross'
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

  React.useEffect(() => {
    console.log(clickEvent);
  }, [clickEvent]);
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
              <StyledSlider
                value={stockRange}
                min={1}
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
              <StyledSlider
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
          <Card className={classes.card}>
            <CardHeader
              classes={{
                title: classes.CardHeader,
              }}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title={clickEvent.data ? (`Exercise ${exerciseQuantity} ${symbol}
                      ${moment.unix(expiration).add(1, 'day').format('M/D')}
                      $${selectedOption.strike}c`) :
                    ('Click on the graph to view your potential exits')}
              subheader={clickEvent.data && (`@ ${clickEvent.data.xFormatted}
              on ${moment().add(daysInFuture, 'days').format("MMM D")}`)}
            />
            <CardContent>
              {clickEvent.data && (
                <>
                  <TextField
                    label="Quantity"
                    helperText="How many contracts would you like to exercise"
                    value={exerciseQuantity}
                    onChange={(e)=>setExerciseQuantity(e.target.value)}
                    min={1}
                  />
                  {!isNaN(parseInt(exerciseQuantity)) ? (<>
                  <Typography className={classes.dialog}>
                    Cost: <span className={classes.underlinedLiability}>
                    {currencyFormat(exerciseQuantity*(costPerContract*100 + 100*selectedOption.strike))}
                  </span> ({currencyFormat(costPerContract*100)}/ea
                   for {exerciseQuantity} contract{exerciseQuantity>1&&'s'} + {currencyFormat(exerciseQuantity*100*selectedOption.strike)} for {exerciseQuantity*100} shares
                      @ ${selectedOption.strike}/ea)
                  </Typography>
                  <Typography className={classes.dialog}>
                    Get: {exerciseQuantity*100} {symbol} shares @ ${selectedOption.strike}/ea
                    (now worth ${clickEvent.data.x.toFixed(2)}/ea for a total
                    of <span className={classes.underlinedAsset}>
                    {currencyFormat(exerciseQuantity*100*clickEvent.data.x)}</span>)
                  </Typography>
                  <Typography className={classes.dialog}>
                    Return: <span className={classes.underlinedAsset}>
                    {currencyFormat(exerciseQuantity*(100*clickEvent.data.x -
                      (costPerContract*100 + 100*selectedOption.strike)))}
                    </span> (<span className={classes.underlinedAsset}>
                    {currencyFormat(exerciseQuantity*100*clickEvent.data.x)}</span> - <span className={classes.underlinedLiability}>
                    {currencyFormat(exerciseQuantity*(100*costPerContract + 100*selectedOption.strike))}</span>)
                  </Typography>
                  </>)
                  : (
                  <Typography className={classes.dialog}>
                    Please enter a valid quantity!
                  </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6}>
            <Card className={classes.card}>
              <CardHeader
                className={classes.cardHeader}
                titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
                title={clickEvent.data ? (`Sell ${sellQuantity} ${symbol}
                        ${moment.unix(expiration).add(1, 'day').format('M/D')}
                        $${selectedOption.strike}c`) :
                      ('Click on the graph to view your potential exits')}
                subheader={clickEvent.data && (`@ ${clickEvent.data.xFormatted}
                on ${moment().add(daysInFuture, 'days').format("MMM D")}`)}
              />
            <CardContent>
                {clickEvent.data && (
                  <>
                    <TextField
                      label="Quantity"
                      helperText="How many contracts would you like to sell"
                      value={sellQuantity}
                      onChange={(e)=>setSellQuantity(e.target.value)}
                      min={1}
                    />
                  {!isNaN(parseInt(sellQuantity)) ? (<>
                    <Typography className={classes.dialog}>
                      Cost: <span className={classes.underlinedLiability}>
                      {currencyFormat(sellQuantity*costPerContract*100)}
                    </span> ({currencyFormat(costPerContract*100)}/ea for {sellQuantity} contract{sellQuantity>1 && 's'})
                    </Typography>
                    <Typography className={classes.dialog}>
                      Get: N/A, you are just selling the contract
                    </Typography>
                    <Typography className={classes.dialog}>
                      Return: <span className={classes.underlinedAsset}>
                      {currencyFormat(clickEvent.data.d * sellQuantity)}</span> (
                      {(clickEvent.data.d / costPerContract).toFixed(2)}%)
                    </Typography>
                    </>)
                    : (
                    <Typography className={classes.dialog}>
                      Please enter a valid quantity!
                    </Typography>
                    )}
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
