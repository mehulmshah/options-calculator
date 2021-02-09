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
  CardActions,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import LibraryAddCheckRoundedIcon from "@material-ui/icons/LibraryAddCheckRounded";
import SendIcon from "@material-ui/icons/Send";
import { useSnackbar } from "notistack";
import moment from "moment";
import axios from "axios";
import blackScholes from "black-scholes";
import greeks from "greeks";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianAxis,
} from "recharts";
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

  const [contactUs, setContactUs] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [expiration, setExpiration] = React.useState("");
  const [expirationDates, setExpirationDates] = React.useState([0]);
  const [symbol, setSymbol] = React.useState("");
  const [symbolPrice, setSymbolPrice] = React.useState(0);
  const [adjustableSymbolPrice, setAdjustableSymbolPrice] = React.useState(0);
  const [optionChain, setOptionChain] = React.useState({
    calls: [0],
    puts: [0],
  });
  const [chosenOptionChain, setChosenOptionChain] = React.useState([0]);
  const [buyOrSell, setBuyOrSell] = React.useState("buy");
  const [callsOrPuts, setCallsOrPuts] = React.useState("call");
  const [selectedOption, setSelectedOption] = React.useState(0);
  const [gainOrLoss, setGainOrLoss] = React.useState(GainColor);
  const [chartOptionPrice, setChartOptionPrice] = React.useState(0);
  const chartRef = React.useRef();
  const classes = useStyles({ gainOrLoss });


  const handleSubmitContact = () => {
    enqueueSnackbar("Request successfully submitted", { variant: "success" });
    return;
  };

  const handleSymbolLookup = async () => {
    console.log(`User Looked up ${symbol}`);
    enqueueSnackbar(`Looking up ${symbol}`, { variant: "info" });
    await getStockData();
  };

  const getStockData = React.useCallback(
    async (exp = "") => {
    let currStockPrice = 0;
    await axios
      .get("/stock?ticker=" + symbol.toLowerCase())
      .then((response) => {
        if (response.status === STATUS_OK) {
          enqueueSnackbar("Successfully Loaded Stock Price", {
            variant: "success",
          });
          let currPrice = response.data.chart.result[0].meta.regularMarketPrice;
          let prevPrice = response.data.chart.result[0].meta.chartPreviousClose;
          setSymbolPrice(currPrice);
          currStockPrice = currPrice;
          setAdjustableSymbolPrice(currPrice);
          setGainOrLoss(currPrice - prevPrice > 0 ? GainColor : LossColor);
        }
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(`Error searching for ${symbol.toUpperCase()} price`, {
          variant: "error",
        });
      });

      let endpoint = "/option?ticker=" + symbol.toLowerCase();
      if (exp !== "") {
        endpoint += "&exp=" + exp;
      }
      axios
        .get(endpoint)
        .then((response) => {
          if (response.status === STATUS_OK) {
            enqueueSnackbar("Successfully Loaded Option Chain", {
              variant: "success",
            });
            let optionsJson = response.data.optionChain.result[0].options[0];
            let expirationDates =
              response.data.optionChain.result[0].expirationDates;
            setOptionChain({
              calls: optionsJson.calls,
              puts: optionsJson.puts,
            });
            setChosenOptionChain(optionsJson.calls);
            if (exp === "") {
              var closest = optionsJson.calls.reduce(function(prev, curr) {
                return (Math.abs(curr.strike - currStockPrice) <
                        Math.abs(prev.strike - currStockPrice) ? curr : prev);
              });
              setSelectedOption(closest.strike);
              setChartOptionPrice(closest.lastPrice.toFixed(2));
              setExpiration(expirationDates[0]);
            }
            setExpirationDates(expirationDates);
          }
        })
        .catch((error) => {
          console.log(error);
          enqueueSnackbar(
            `Error searching for ${symbol.toUpperCase()} options`,
            {
              variant: "error",
            }
          );
        });
    },[enqueueSnackbar, symbol]);

  React.useEffect(() => {
    if (expiration !== "") {
      getStockData(expiration);
    }
  }, [expiration, getStockData]);

  const testBS = () => {
    let option = chosenOptionChain.find(
      (call) => call.strike === selectedOption
    );
    let timeDiff =
      (moment().diff(moment.unix(option.expiration).utc(), "days") + 1) / 365;
    let output = blackScholes.blackScholes(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.056,
      callsOrPuts
    );

    let delta = greeks.getDelta(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08,
      callsOrPuts
    );
    let gamma = greeks.getGamma(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08
    );
    let theta = greeks.getTheta(
      symbolPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.08,
      callsOrPuts
    );
    return (
      <div>
        <div>Price: {output}</div>
        <div>Delta: {delta}</div>
        <div>Gamma: {gamma}</div>
        <div>Theta: {theta}</div>
      </div>
    );
  };

  const renderTooltip = (e) => {
    if (e.payload && e.payload.length > 0) {
      setChartOptionPrice(e.payload[0].payload.price.toFixed(2));
      return (
        <div className={classes.centered}>{e.payload[0].payload.date}</div>
      );
    }
    return <div></div>;
  };

  const generateChart = () => {
    let today = moment();
    let days = [];
    days.push(today.format());
    let timeDiff =
      Math.abs(moment().diff(moment.unix(expiration).utc(), "days")) + 1;
    for (let i = 1; i < timeDiff; i++) {
      let d = today.clone().add(i, "days");
      days.push(d.format());
    }
    let option = chosenOptionChain.find(
      (call) => call.strike === selectedOption
    );
    if (!option) {
      return;
    }
    let data = [];
    days.forEach((d) => {
      let tempObj = {};
      let timeDiffInYears =
        (Math.abs(moment(d).diff(moment.unix(expiration).utc(), "days")) + 1) /
        365;
      let output = blackScholes.blackScholes(
        adjustableSymbolPrice,
        option.strike,
        timeDiffInYears,
        option.impliedVolatility,
        0.08,
        callsOrPuts
      );
      tempObj.date = moment(d).format("MMM D, YY").toUpperCase();
      tempObj.price = output;
      data.push(tempObj);
    });

    return (
      <LineChart
        ref={chartRef}
        width={650}
        height={250}
        data={data}
        margin={{ top: 35, bottom: 35, left: 10, right: 20 }}
      >
        <Line
          type="linear"
          dataKey="price"
          stroke={gainOrLoss}
          dot={false}
          activeDot={{ strokeWidth: 1, stroke: "black", r: 4 }}
          strokeWidth={3}
        />
        <XAxis dataKey="date" domain={["auto", "auto"]} />
        <YAxis dataKey="price" hide={true} domain={["dataMin", "dataMax"]} />

        <Tooltip
          content={renderTooltip}
          position={{ y: 0 }}
          wrapperStyle={{ width: 100, margin: "auto" }}
        />
      </LineChart>
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
              {symbolPrice !== 0 && chosenOptionChain.length > 0 ? (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12}>
                    <Typography>
                      <span className={classes.ticker}>
                        {symbol.toUpperCase() + " "}
                      </span>
                      ${symbolPrice.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <ButtonGroup>
                      <Button
                        color="inherit"
                        onClick={(e) => setBuyOrSell("buy")}
                        variant="none"
                        className={
                          buyOrSell === "buy"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Buy
                      </Button>
                      <Button
                        color="inherit"
                        onClick={(e) => setBuyOrSell("sell")}
                        variant="none"
                        className={
                          buyOrSell === "sell"
                            ? classes.selected
                            : classes.unSelected
                        }
                      >
                        Sell
                      </Button>
                    </ButtonGroup>
                  </Grid>
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
                  <Grid item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                    >
                      <InputLabel id="demo-simple-select-outlined-label">
                        Expiration
                      </InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={expiration}
                        onChange={(e) => setExpiration(e.target.value)}
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
                  <Grid item xs={12}>
                    <OptionTable
                      chosenOptionChain={chosenOptionChain}
                      gainOrLoss={gainOrLoss}
                      selectedOption={selectedOption}
                      isSelected={(call) => {
                        setSelectedOption(call.strike);
                        setChartOptionPrice(call.lastPrice.toFixed(2));
                      }}
                    />
                  </Grid>
                  {selectedOption > 0 && (
                    <Grid container direction="column">
                      <Grid item>
                        <Typography className={classes.dialog}>
                          <span className={classes.ticker}>
                            {symbol.toUpperCase() + " "}
                          </span>
                          ${adjustableSymbolPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item className={classes.halfWidth}>
                        <IOSSlider
                          step={0.5}
                          min={0}
                          max={Math.round(symbolPrice*2)}
                          value={adjustableSymbolPrice}
                          onChange={(e, nV) => setAdjustableSymbolPrice(nV)}
                          valueLabelDisplay="on"
                        />
                      </Grid>
                      <Grid item>
                        <Typography className={classes.subheader}>
                          {symbol.toUpperCase() + " "} ${selectedOption}{" "}
                          {callsOrPuts.toUpperCase()}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography className={classes.subheader}>
                          ${chartOptionPrice}
                        </Typography>
                      </Grid>
                      <Grid item>{generateChart()}</Grid>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Grid container justify="center">
                  <Grid item xs={4}>
                    <TextField
                      className={classes.enterTicker}
                      label="Symbol Lookup"
                      placeholder="AAPL, GME, etc."
                      helperText="Enter a stock ticker"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
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
            <CardActions>
              {symbolPrice ? (
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.leftSide}
                  onClick={handleSymbolLookup}
                >
                  Choose New Ticker
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.leftSide}
                  onClick={handleSymbolLookup}
                  disabled={symbol === ""}
                >
                  Show Options
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        <Grid item>
          <Typography className={classes.card}>
            Chance of profit is an estimate based on the Black-Scholes Model, and is for informational purposes only. Numerous factors that are not reducible to a model determine the actual chance of profit for a particular option contract or strategy.
          </Typography>
        </Grid>
      </Grid>
      <Dialog
        open={contactUs}
        fullWidth
        maxWidth="sm"
        className={classes.dialog}
      >
        <DialogTitle>Need Help?</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            variant="outlined"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
            }}
            value={name}
          />
          <TextField
            label="Email"
            variant="outlined"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(event.target.value);
            }}
            value={email}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSubmitContact}
            endIcon={<SendIcon />}
          >
            Submit
          </Button>
          <Button variant="outlined" onClick={() => setContactUs(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default DashboardView;
