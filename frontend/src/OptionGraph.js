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
} from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import moment from "moment";
import blackScholes from "black-scholes";
import { ResponsiveLine } from '@nivo/line';
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
    timeDiffInYears = timeDiffInYears < 0 ? 0 : timeDiffInYears;
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
      <div className={classes.graphContainer}>
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
          margin={{ top: 50, right: 20, bottom: 80, left: 80 }}
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

  return (
    <>
      <Grid container spacing={3} className={classes.spacing} justify="center">
        <Grid item xs={6}>
          <Grid container direction="column" spacing={3}>
            <Grid item>
              {generateChart()}
            </Grid>
            <Grid item style={{width: "95%"}}>
              <Grid container alignItems="stretch" justify="flex-start">
                <Grid item xs={1}>
                  <HtmlTooltip title="Adjust to view a wider range of potential stock prices in the graph" placement="top-start">
                    <InfoOutlinedIcon />
                  </HtmlTooltip>
                </Grid>
                <Grid item xs>
                  <Typography id="range-slider" gutterBottom>
                    Stock Price Axis Range: ± {stockRange}%
                  </Typography>
                </Grid>
              </Grid>
              <StyledSlider
                value={stockRange}
                min={1}
                step={0.5}
                max={50}
                onChange={(e, nV) => setStockRange(nV)}
                aria-labelledby="non-range-slider"
              />
            </Grid>
            <Grid item style={{width: "95%"}}>
              <Grid container alignItems="stretch" justify="flex-start">
                <Grid item xs={1}>
                  <HtmlTooltip title="Adjust to see your option's value on different days" placement="top-start">
                    <InfoOutlinedIcon />
                  </HtmlTooltip>
                </Grid>
                <Grid item xs>
                  <Typography id="date-slider" gutterBottom>
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
        <Grid item xs={6}>
          <Card>
            <CardHeader
              classes={{
                title: classes.CardHeader,
              }}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title={clickEvent.data ? (`The date is ${moment()
                .add(daysInFuture, 'day').format('MMM Do')} // ${symbol} is at
                $${selectedOption.strike}`) :
                    ('Interact with the graph to view your potential exits')}
              subheader="Expand To See Details"
            />
          <Collapse in={expanded && clickEvent.data} timeout="auto" unmountOnExit>
            <CardContent>
              <Typography variant='h4' style={{marginBottom: 10, textDecoration: 'underline'}}>
                Exercise Your Options
              </Typography>
              <Typography paragraph>
                Cost: <span className={classes.underlinedLiability}>
                {currencyFormat(exerciseQuantity*(costPerContract*100 + 100*selectedOption.strike))}
              </span> ({currencyFormat(costPerContract*100)}/ea
               for {exerciseQuantity} contract{exerciseQuantity>1&&'s'} + {currencyFormat(exerciseQuantity*100*selectedOption.strike)} for {exerciseQuantity*100} shares
                  @ ${selectedOption.strike}/ea)
              </Typography>
              <Typography paragraph>
                Get: {exerciseQuantity*100} {symbol} shares @ ${selectedOption.strike}/ea
                (now worth ${clickEvent.data.x.toFixed(2)}/ea for a total
                of <span className={classes.underlinedAsset}>
                {currencyFormat(exerciseQuantity*100*clickEvent.data.x)}</span>)
              </Typography>
              <Typography paragraph>
                Return: <span className={clickEvent.data.x - costPerContract - selectedOption.strike > 0 ?
                                          classes.underlinedAsset : classes.underlinedLiability}>
                {currencyFormat(100*exerciseQuantity*(clickEvent.data.x -
                costPerContract - selectedOption.strike))}
                </span> (<span className={classes.underlinedAsset}>
                {currencyFormat(exerciseQuantity*100*clickEvent.data.x)}</span> - <span className={classes.underlinedLiability}>
                {currencyFormat(exerciseQuantity*(100*costPerContract + 100*selectedOption.strike))}</span>)
              </Typography>

              <Typography variant='h4' style={{marginBottom: 10, textDecoration: 'underline'}}>
                Sell Your Options
              </Typography>
              <Typography paragraph>
                Cost: <span className={classes.underlinedLiability}>
                {currencyFormat(sellQuantity*costPerContract*100)}
              </span> ({currencyFormat(costPerContract*100)}/ea for {sellQuantity} contract{sellQuantity>1 && 's'})
              </Typography>
              <Typography paragraph>
                Get: N/A, you are just selling the contract
              </Typography>
              <Typography paragraph>
                Return: <span
                className={clickEvent.data.d > 0 ?
                          classes.underlinedAsset : classes.underlinedLiability}>
                {currencyFormat(clickEvent.data.d * sellQuantity)}</span> (
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
      </Grid>
    </>
  );
}

export default OptionGraph;
