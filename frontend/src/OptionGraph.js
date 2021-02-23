/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  Grid,
  makeStyles,
  withStyles,
  Slider,
  Tooltip,
  useTheme,
  TextField,
  Theme,
  Typography,
  Paper,
} from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import moment from "moment";
import blackScholes from "black-scholes";
import { ResponsiveLine, Line, ResponsiveLineCanvas, LineCanvas } from '@nivo/line';
import { linearGradientDef } from '@nivo/core'

const GainColor = "#00C805";
const LossColor = "#FF5000";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    marginTop: 20,
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
  spaceAndPad: {
    margin: theme.spacing(1),
    padding: 10,
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
  graphContainer: {
    width: "90%",
    height: 550,
  },
  cardHeader: {
    fontSize: 16,
  },
  topBotSpacing: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
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

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 350,
    fontSize: theme.typography.pxToRem(14),
    border: '1px solid #dadde9',
  },
}))(Tooltip);

interface OptionGraphProps {
  symbol: string;
  currPrice: number;
  selectedOption: any;
  callsOrPuts: string;
  expiration: string;
  config: any;
}

const INFLATION_RATE = 0.014;

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
  const [stockRange, setStockRange] = React.useState(10);
  const [daysInFutureSlider, setDaysInFutureSlider] = React.useState(0);
  const [daysInFuture, setDaysInFuture] = React.useState(0);
  const [clickEvent, setClickEvent] = React.useState({});
  const [exerciseQuantity, setExerciseQuantity] = React.useState(config.quantity);
  const [sellQuantity, setSellQuantity] = React.useState(config.quantity);
  const [expanded, setExpanded] = React.useState(false);
  const daysUntilExpiration = Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;
  const costPerContract = config.avgCost ? config.avgCost : selectedOption.lastPrice;

  const currencyFormat = (num) => {
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  };

  const generateChart = () => {
    let timeDiffInYears = (
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) - (daysInFuture)) /
      365;
    timeDiffInYears = Math.max(0, timeDiffInYears);
    let adder = stockRange / 200;
    let chartPosData = [];
    let chartNegData = [];
    for (let i = currPrice*(1-adder); i < currPrice*(1+adder); i+= adder) {
      let tempObj = {};
      let output = blackScholes.blackScholes(
        i,
        selectedOption.strike,
        timeDiffInYears,
        selectedOption.impliedVolatility,
        INFLATION_RATE,
        callsOrPuts
      );
      tempObj.x = i;
      tempObj.y = config.quantity * 100 *(output - costPerContract);
      tempObj.d = 100 * (output - costPerContract);
      if (tempObj.y >= 0) {
        chartPosData.push(tempObj);
        chartNegData.push({x: tempObj.x, y: null, d: null});
      } else {
        chartNegData.push(tempObj);
        chartPosData.push({x: tempObj.x, y: null, d: null})
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
      },
    ];
    let areaBaseline = data[0].data[0].y > 0 ? data[0].data[0].y : 0;

    const chartTheme = {
      textColor: theme.palette.type === "light" ? "black" : "white",
      fontSize: 11,
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
          }
        },
        legend: {
          text: {
            fontSize: 14,
            fill: theme.palette.type === "light" ? "black" : "white",
          }
        }
      },
    };

    return (
      <ResponsiveLine
        curve="basis"
        animate={false}
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
        margin={{ top: 40, right: 20, bottom: 80, left: 80 }}
        areaBaselineValue={areaBaseline}
        xScale={{ type: 'linear', min: 'auto', max: 'auto'}}
        xFormat=">-$.2f"
        yScale={{ type: 'linear', min: 'auto', max: 'auto'}}
        yFormat=" >-$.2f"
        colors={['rgb(97, 205, 187)', 'rgb(244, 117, 96)']}
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
        areaOpacity={0.2}
        enablePoints={false}
        useMesh={true}
        crosshairType='cross'
        theme={chartTheme}
        tooltip={(input) => {
            let sellProfit = input.point.data.y;
            let exerProfit = 100*config.quantity*(input.point.data.x -
            costPerContract - selectedOption.strike);
            let divOrder = sellProfit > exerProfit ?
              (
                <div
                  style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                  }}
                >
                  <div style={{color: sellProfit > 0 ? GainColor : LossColor}}>
                    Sell Returns: {currencyFormat(sellProfit)}
                  </div>
                  <div style={{color: exerProfit > 0 ? GainColor : LossColor}}>
                    Exercise Returns: {currencyFormat(exerProfit)}
                  </div>
                </div>
              ) :
              (
                <div
                  style={{
                      background: 'white',
                      padding: '9px 12px',
                      border: '1px solid #ccc',
                  }}
                >
                  <div style={{color: exerProfit > 0 ? GainColor : LossColor}}>
                    Exercise Returns: {currencyFormat(exerProfit)}
                  </div>
                  <div style={{color: sellProfit > 0 ? GainColor : LossColor}}>
                    Sell Returns: {currencyFormat(sellProfit)}
                  </div>
                </div>
            );
            return divOrder;
          }}
        colors={d=>d.id === 'positive' ? GainColor : LossColor}
        onClick={(p, e)=> setClickEvent(p)}
      />
    );
  };

  return (
    <>
      <Grid container spacing={3} className={classes.spacing} justify="space-evenly">
        <Grid item xs={12} md={clickEvent.data ? 8 : 12}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className={classes.graphContainer}>
                {generateChart()}
              </div>
            </Grid>
            <Grid item style={{width: "95%"}}>
              <Grid container alignItems="stretch" justify="flex-start">
                <Grid item xs={1}>
                  <HtmlTooltip title="Adjust to view a wider range of potential stock prices in the graph" placement="top-start">
                    <InfoOutlinedIcon />
                  </HtmlTooltip>
                </Grid>
                <Grid item xs>
                  <Typography id="range-slider" gutterBottom variant='h6'>
                    Stock Price Axis Range: ± {Math.floor(stockRange)}%
                  </Typography>
                </Grid>
              </Grid>
              <StyledSlider
                min={1}
                value={stockRange}
                onChange={(e, nV) => setStockRange(nV)}
              />
            </Grid>
            <Grid item style={{width: "95%"}}>
              <Grid container alignItems="stretch" justify="flex-start">
                <Grid item xs={1}>
                  <HtmlTooltip title="Adjust to see your option's value on different days until expiration" placement="top-start">
                    <InfoOutlinedIcon />
                  </HtmlTooltip>
                </Grid>
                <Grid item xs>
                  <Typography id="date-slider" gutterBottom variant='h6'>
                    Date: {daysInFuture < 1 ? "Today" : `+${Math.floor(daysInFuture)} days`} ({moment().add(Math.floor(daysInFuture), "days").format("MMM Do")})
                  </Typography>
                </Grid>
              </Grid>
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
        {clickEvent.data && (
        <Grid item xs={12} md={4}>
          <Card style={{paddingRight: 8}}>
            <CardHeader
              classes={{
                title: classes.CardHeader,
              }}
              titleTypographyProps={{ variant: "h5" }}
              title={clickEvent.data ? (`Exit on  ${moment()
                .add(daysInFuture, 'day').format('MMM D')} with ${symbol} at
                ${currencyFormat(clickEvent.data.x)}`) :
                    ('Interact with the graph to view your potential exits')}
              subheader="Chart Interaction - Expand To See Details"
            />
          <Collapse in={expanded && clickEvent.data} timeout="auto" unmountOnExit>
            <CardContent>
                <Typography variant='h5' style={{marginBottom: 10, fontWeight:'bold'}}>
                  Exercise Your Options
                </Typography>
                <Typography paragraph>
                  Cost: <span className={classes.underlinedLiability}>
                  {currencyFormat(config.quantity*(costPerContract*100 + 100*selectedOption.strike))}
                </span> ({currencyFormat(costPerContract*100)}/ea
                 for {config.quantity} contract{config.quantity>1&&'s'} + {currencyFormat(config.quantity*100*selectedOption.strike)} for {config.quantity*100} shares
                    @ ${selectedOption.strike}/ea)
                </Typography>
                <Typography paragraph>
                  Get: {config.quantity*100} {symbol} shares @ ${selectedOption.strike}/ea
                  (now worth ${clickEvent.data.x.toFixed(2)}/ea for a total
                  of <span className={classes.underlinedAsset}>
                  {currencyFormat(config.quantity*100*clickEvent.data.x)}</span>)
                </Typography>
                <Typography paragraph>
                  Return: <span className={clickEvent.data.x - costPerContract - selectedOption.strike > 0 ?
                                            classes.underlinedAsset : classes.underlinedLiability}>
                  {currencyFormat(100*config.quantity*(clickEvent.data.x -
                  costPerContract - selectedOption.strike))}
                  </span> (<span className={classes.underlinedAsset}>
                  {currencyFormat(config.quantity*100*clickEvent.data.x)}</span> - <span className={classes.underlinedLiability}>
                  {currencyFormat(config.quantity*(100*costPerContract + 100*selectedOption.strike))}</span>)
                </Typography>
                <Typography variant='h5' style={{marginBottom: 10, fontWeight:'bold'}}>
                  Sell Your Options
                </Typography>
                <Typography paragraph>
                  Cost: <span className={classes.underlinedLiability}>
                  {currencyFormat(config.quantity*costPerContract*100)}
                </span> ({currencyFormat(costPerContract*100)}/ea for {config.quantity} contract{config.quantity>1 && 's'})
                </Typography>
                <Typography paragraph>
                  Get: N/A, you are just selling the contract
                </Typography>
                <Typography paragraph>
                  Return: <span
                  className={clickEvent.data.d > 0 ?
                            classes.underlinedAsset : classes.underlinedLiability}>
                  {currencyFormat(clickEvent.data.d * config.quantity)}</span> (
                  {(clickEvent.data.d / costPerContract).toFixed(2)}%)
                </Typography>
            </CardContent>
            </Collapse>
            <CardActions>
              {expanded ?
              <ExpandLessIcon onClick={() => setExpanded(false)} />
              :
              <ExpandMoreIcon onClick={() => setExpanded(true)} />
              }
            </CardActions>
          </Card>
        </Grid>
        )}
      </Grid>
    </>
  );
}

export default OptionGraph;
