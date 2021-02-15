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
  FormControl,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,

  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import CreateIconOutlined from "@material-ui/icons/CreateOutlined";
import { useSnackbar } from "notistack";
import moment from "moment";
import axios from "axios";
import OptionTable from "./OptionTable";
import OptionGraph from "./OptionGraph";

const GainColor = "#00C805";
const LossColor = "#FF5000";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    maxWidth: "90vw",
    margin: "auto",
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
  spacing: {
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

const STATUS_OK = 200;
const INFLATION_RATE = 0.014;

function DashboardView() {
  const { enqueueSnackbar } = useSnackbar();

  const [expiration, setExpiration] = React.useState("");
  const [expirationDates, setExpirationDates] = React.useState([0]);
  const [symbolSearch, setSymbolSearch] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [symbolPrice, setSymbolPrice] = React.useState(0);
  const [optionChain, setOptionChain] = React.useState({
    calls: [0], puts: [0],
  });
  const [chosenOptionChain, setChosenOptionChain] = React.useState([0]);
  const [callsOrPuts, setCallsOrPuts] = React.useState("call");
  const [selectedOption, setSelectedOption] = React.useState({});
  const [gainOrLoss, setGainOrLoss] = React.useState(GainColor);
  const [disableSearch, setDisableSearch] = React.useState(true);
  const [config, setConfig] = React.useState({quantity: 1});
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
          console.log(response.data);
          setSymbol(symbolSearch.toUpperCase());
          setSymbolSearch(symbolSearch.toUpperCase());
          setDisableSearch(true);
          let currPrice = response.data.chart.result[0].meta.regularMarketPrice;
          let prevPrice = response.data.chart.result[0].meta.chartPreviousClose;
          setSymbolPrice(currPrice);
          setGainOrLoss(currPrice - prevPrice > 0 ? GainColor : LossColor);
        }
      })
      .catch((error) => {
        console.log(error);
        enqueueSnackbar(`Error searching for ${symbolSearch.toUpperCase()} quote`, {
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
          console.log(response.data);
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
          `Error searching for ${symbolSearch.toUpperCase()}`,
          {
            variant: "error",
          }
        );
      });
    };

  return (
    <Grid className={classes.root}>
      <Grid container justify="center">
        <Grid item>
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
              <Grid item xs={12} >
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
              <OptionTable
                symbol={symbol}
                currPrice={symbolPrice}
                chosenOptionChain={chosenOptionChain}
                gainOrLoss={gainOrLoss}
                isSelected={(opt) => {
                  setSelectedOption(opt);
                }}
                overrideConfig={(newConfig) => {
                  setConfig(newConfig);
                }}
              />
            { selectedOption.strike && (
                <OptionGraph
                  symbol={symbol}
                  currPrice={symbolPrice}
                  selectedOption={selectedOption}
                  callsOrPuts={callsOrPuts}
                  expiration={expiration}
                  config={config}
                />
              )}
            </Grid>
          ) : (
            <Grid container justify="center">
              <Grid item>
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
        </Grid>
      </Grid>
    </Grid>
  );
}

export default DashboardView;
