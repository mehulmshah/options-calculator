/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  Grid,
  InputLabel,
  makeStyles,
  withStyles,
  MenuItem,
  Select,
  Slider,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import CreateIconOutlined from "@material-ui/icons/CreateOutlined";
import LibraryAddCheckRoundedIcon from "@material-ui/icons/LibraryAddCheckRounded";
import { useSnackbar } from "notistack";
import moment from "moment";
import axios from "axios";
import blackScholes from "black-scholes";
import greeks from "greeks";
import { ResponsiveLine } from '@nivo/line';
import { linearGradientDef } from '@nivo/core';
import OptionTable from "./OptionTable";

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
  close: {
    padding: theme.spacing(0.5),
  },
  card: {
    width: "90vw",
    cursor: "pointer",
    margin: theme.spacing(1),
  },
  dialog: {
    margin: theme.spacing(1),
  },
  icon: {
    color: theme.palette.primary.main,
    width: 40,
    height: 40,
  },
  leftSide: {
    marginLeft: "auto",
  },
  ticker: {
    color: ({ gainOrLoss }) => gainOrLoss,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 250,
  },
  selected: {
    backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    color: "white",
    width: "100%",
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss,
      color: "white",
    },
  },
  unSelected: {
    width: "100%",
    backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
    color: ({ gainOrLoss }) => gainOrLoss,
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "4D",
    },
  },
  subheader: {
    marginLeft: theme.spacing(1),
    fontSize: 28,
  },
  halfWidth: {
    marginLeft: theme.spacing(1),
    width: "50%",
  },
  centered: {
    textAlign: "center",
    margin: "auto",
  },
  testContainer: {
    width: 800,
    height: 600,
  },
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

const STATUS_OK = 200;
const INFLATION_RATE = 0.014;

function DashboardView() {
  const { enqueueSnackbar } = useSnackbar();

  const [expiration, setExpiration] = React.useState("");
  const [expirationDates, setExpirationDates] = React.useState([0]);
  const [symbolSearch, setSymbolSearch] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [symbolPrice, setSymbolPrice] = React.useState(0);
  const [adjustableSymbolPrice, setAdjustableSymbolPrice] = React.useState(0);
  const [optionChain, setOptionChain] = React.useState({
    calls: [0], puts: [0],
  });
  const [chosenOptionChain, setChosenOptionChain] = React.useState([0]);
  const [callsOrPuts, setCallsOrPuts] = React.useState("call");
  const [selectedOption, setSelectedOption] = React.useState(0);
  const [gainOrLoss, setGainOrLoss] = React.useState(GainColor);
  const [disableSearch, setDisableSearch] = React.useState(true);
  const [stockRange, setStockRange] = React.useState(9);
  const classes = useStyles({ gainOrLoss });

  const handleChangeExpiration = (newExpiration) => {
    setExpiration(newExpiration);
    getStockData(newExpiration);
  }

  const handleSymbolLookup = () => {
    enqueueSnackbar(`Looking up ${symbolSearch.toUpperCase()}`, { variant: "info" });
    getStockData();
  };

  const getStockData = (exp = "") => {
    axios
      .get("/stock?ticker=" + symbolSearch.toLowerCase())
      .then((response) => {
        if (response.status === STATUS_OK) {
          setSymbol(symbolSearch.toUpperCase());
          setSymbolSearch(symbolSearch.toUpperCase());
          setDisableSearch(true);
          let currPrice = response.data.chart.result[0].meta.regularMarketPrice;
          let prevPrice = response.data.chart.result[0].meta.chartPreviousClose;
          setSymbolPrice(currPrice);
          setAdjustableSymbolPrice(currPrice);
          setGainOrLoss(currPrice - prevPrice > 0 ? GainColor : LossColor);
        }
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(`Error searching for ${symbolSearch.toUpperCase()} price`, {
          variant: "error",
        });
      });

    let endpoint = "/option?ticker=" + symbolSearch.toLowerCase();
    if (exp !== "") {
      endpoint += "&exp=" + exp;
    }
    axios
      .get(endpoint)
      .then((response) => {
        if (response.status === STATUS_OK) {
          let optionsJson = response.data.optionChain.result[0].options[0];
          let expDates = response.data.optionChain.result[0].expirationDates;
          setOptionChain({
            calls: optionsJson.calls,
            puts: optionsJson.puts,
          });
          setChosenOptionChain(optionsJson.calls);
          if (exp === "") {
            setExpiration(expDates[0]);
          }
          setExpirationDates(expDates);
        }
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(
          `Error searching for ${symbolSearch.toUpperCase()} options`,
          {
            variant: "error",
          }
        );
      });
    };

  const generateChart = () => {
    let timeDiffInYears = (
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1) /
      365;
    let option = chosenOptionChain.find((call) => call.strike === selectedOption);
    if (!option) {
      return;
    }
    let chartPosData = [];
    let chartNegData = [];
    for (let i = symbolPrice*(1-stockRange/100); i < symbolPrice*(1+stockRange/100); i+= 0.1) {
      let tempObj = {};
      let output = blackScholes.blackScholes(
        i,
        option.strike,
        timeDiffInYears,
        option.impliedVolatility,
        0.056,
        callsOrPuts
      );
      tempObj.x = i;
      tempObj.y = 100*(output - option.lastPrice);
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
        }
    };

    return (
      <div className={classes.testContainer}>
        <ResponsiveLine
          data={data}
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
          yScale={{ type: 'linear', min: 'auto', max: 'auto', reverse: false }}
          yFormat=" >-$.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
              orient: 'bottom',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
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
        />
      </div>
    );
  };

  return (
    <Grid className={classes.root}>
      <Grid container justify="center">
        <Grid item>
          <Card className={classes.card}>
            <CardHeader
              className={classes.cardHeader}
              avatar={<LibraryAddCheckRoundedIcon className={classes.icon} />}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title="Options Calculator"
              subheader="Democratize Earnings"
            />
            <CardContent>
              {symbol !== "" ? (
                <Grid container spacing={2} alignItems="center">
                  {/* input new ticker plus button */}
                  <Grid item xs={4}>
                    <TextField
                      className={classes.enterTicker}
                      label="Symbol Lookup"
                      placeholder="AAPL, GME, etc."
                      helperText="Enter a stock ticker and press Enter"
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSymbolLookup();
                        }
                      }}
                      fullWidth={true}
                      disabled={disableSearch}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    {disableSearch ?
                      <CreateIcon
                        onClick={() => setDisableSearch(false)}
                      /> :
                      <CreateIconOutlined
                        onClick={() => setDisableSearch(true)}
                      />
                    }
                  </Grid>
                  {/* ticker and current price */}
                  <Grid item xs={12}>
                    <Typography>
                      <span className={classes.ticker}>
                        {symbol.toUpperCase() + " "}
                      </span>
                      ${symbolPrice.toFixed(2)}
                    </Typography>
                  </Grid>
                  {/* call or put button group */}
                  <Grid item>
                    <ButtonGroup className={classes.buttonGroup}>
                      <Button
                        color="inherit"
                        onClick={(e) => {
                          setCallsOrPuts("call");
                          setChosenOptionChain(optionChain.calls);
                        }}
                        variant="none"
                        className={
                          callsOrPuts === "call"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Calls
                      </Button>
                      <Button
                        color="inherit"
                        onClick={(e) => {
                          setCallsOrPuts("put");
                          setChosenOptionChain(optionChain.puts);
                        }}
                        variant="none"
                        className={
                          callsOrPuts === "put"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Puts
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  {/* expiration select dropdown */}
                  <Grid item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                    >
                      <InputLabel shrink id="exp-label">
                        Expiration
                      </InputLabel>
                      <Select
                        labelId="exp-label"
                        value={expiration}
                        onChange={(e) => handleChangeExpiration(e.target.value)}
                        label="Expiration"
                      >
                        {expirationDates.map((exp) => {
                          let date = moment.unix(exp).utc();
                          let format =
                            date.year() === moment().year()
                              ? "MMMM Do"
                              : "MMMM Do, YYYY";
                          return (
                            <MenuItem value={exp}>
                              {date.format(format)}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* options list table */}
                  <Grid item container spacing={2} justify="space-between">
                    <Grid item xs={6}>
                      <OptionTable
                        chosenOptionChain={chosenOptionChain}
                        gainOrLoss={gainOrLoss}
                        selectedOption={selectedOption}
                        isSelected={(call) => {
                          setSelectedOption(call.strike);
                        }}
                      />
                    </Grid>
                    {/* chosen option explanation */}
                    <Grid item xs={6}>
                      <Card>
                        <CardHeader
                          className={classes.cardHeader}
                          titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
                          title={`$${symbol}
                                  ${moment.unix(expiration).add(1, 'day').format('M/D')}
                                  ${selectedOption}c`}
                          subheader="What Does This Mean?"
                        />
                        <CardContent>
                          <Typography>
                            You are buying an options contract to purchase 100 shares of {symbol}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  <Grid container direction="column">
                    <Grid item className={classes.dialog}>
                      Stock Price Range
                      <IOSSlider
                        step={0.5}
                        min={0}
                        max={50}
                        value={stockRange}
                        onChange={(e, nV) => setStockRange(nV)}
                        valueLabelDisplay="on"
                      />
                    </Grid>
                  </Grid>
                  <Grid container justify="center">
                    <Grid item>{generateChart()}</Grid>
                  </Grid>
                </Grid>
              ) : (
                <Grid container justify="center">
                  <Grid item xs={4}>
                    <TextField
                      autoFocus
                      className={classes.enterTicker}
                      label="Symbol Lookup"
                      placeholder="AAPL, GME, etc."
                      helperText="Enter a stock ticker and press Enter"
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSymbolLookup();
                        }
                      }}
                      fullWidth={true}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item>
          <Typography className={classes.card}>
            Chance of profit is an estimate based on the Black-Scholes Model, and is for informational purposes only. Numerous factors that are not reducible to a model determine the actual chance of profit for a particular option contract or strategy.
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default DashboardView;
