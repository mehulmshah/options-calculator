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
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Grid,
  makeStyles,
  Paper,
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
import greeks from "greeks";

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
  tableRowLightMode: {
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
      color: "white",
    },
  },
  table: {
    width: "100%",
    maxHeight: 230,
  },
  test: {
    backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    "&:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss,
    },
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
}));

interface OptionTableProps {
  symbol: string;
  currPrice: number;
  chosenOptionChain: any;
  gainOrLoss: string;
  isSelected: (selected) => void;
  overrideConfig: (config) => void;
}

function OptionTable({
  symbol,
  currPrice,
  chosenOptionChain,
  gainOrLoss,
  isSelected,
  overrideConfig,
}: OptionTableProps) {
  const classes = useStyles({ gainOrLoss });
  const tableRef = React.createRef();
  const selectedRef = React.createRef();
  const [configDialogState, setConfigDialogState] = React.useState(false);
  const [selected, setSelected] = React.useState({});
  const [quantity, setQuantity] = React.useState(1);
  const [price, setPrice] = React.useState(0);
  const [greekVals, setGreekVals] = React.useState({});

  const displayCallOptions = () => {
    return chosenOptionChain
      .filter((call) => call)
      .map((call) => {
        let currSelected = call.strike === selected.strike;
        let sign = call.percentChange > 0 ? "+" : "-";
        return (
          <TableRow
            key={call.contractSymbol}
            selected={currSelected}
            ref={selected ? selectedRef : undefined}
            onClick={() => {
              setSelected(call);
              isSelected(call);
            }}
            className={classes.tableRowLightMode}
          >
            <TableCell className={classes.bold}>${call.strike}</TableCell>
            <TableCell>${(call.strike + call.lastPrice).toFixed(2)}</TableCell>
            <TableCell>
              {sign + Math.abs(call.percentChange).toFixed(2)}%
            </TableCell>
            <TableCell>
              {sign}${Math.abs(call.change).toFixed(2)}
            </TableCell>
            <TableCell>
              <Button
                className={classes.test}
                variant={
                  call.strike === selected.strike ? "contained" : "outlined"
                }
              >
                ${call.lastPrice.toFixed(2)}
              </Button>
            </TableCell>
            <TableCell>
              <CreateIcon
                onClick={()=> {
                  calculateGreeks(call);
                  setPrice(call.lastPrice);
                  setConfigDialogState(true);
                }}
              />
            </TableCell>
          </TableRow>
        );
      });
  };

  const calculateGreeks = (option) => {
    let timeDiff =
    (Math.abs(moment().diff(moment.unix(option.expiration).utc(), "days")) + 1)
    / 365;
    let delta = greeks.getDelta(
      currPrice,
      option.strike,
      timeDiff,
      option.impliedVolatility,
      0.04,
      "call"
    );

    setGreekVals({
      delta: delta.toFixed(2),
      gamma: delta.toFixed(2),
      theta: delta.toFixed(2),
      vega: delta.toFixed(2),
      rho: delta.toFixed(2),
    });
  };

  React.useEffect(() => {
    if (tableRef.current && selectedRef.current) {
      if (tableRef.current.scrollTop !== selectedRef.current.offsetTop) {
        let containerHeight = tableRef.current.offsetHeight;
        let targetOffset = selectedRef.current.offsetTop;
        let targetHeight = selectedRef.current.offsetHeight;
        let top = targetOffset - targetHeight;

        tableRef.current.scroll({
          top,
          behavior: "smooth",
        });
      }
    }
  }, [selectedRef, tableRef]);

  return (
    <>
    <Grid item container spacing={2} justify="space-between">
      <Grid item xs={6}>
        <TableContainer component={Paper} className={classes.table} ref={tableRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Strike Price</TableCell>
                <TableCell>Break Even</TableCell>
                <TableCell>% Change</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{displayCallOptions()}</TableBody>
          </Table>
        </TableContainer>
      </Grid>
      {/* chosen option explanation */}
      <Grid item xs={6}>
        <Card className={classes.table}>
          {selected.strike && (
          <>
            <CardHeader
              className={classes.dialog}
              titleTypographyProps={{ variant: "h5", fontStyle: "bold" }}
              title={`${symbol}
                      ${moment.unix(selected.expiration).add(1, 'day').format('M/D')}
                      $${selected.strike}c`}
              subheader="What Does This Mean?"
            />
            <CardContent>
              <Typography className={classes.dialog}>
                You are buying {quantity} contract{quantity > 1 && 's'} giving you the right, <span className={classes.italics}>
                but not obligation</span>, to purchase <span className={classes.underlined}>
                {100*quantity}</span> shares of <span className={classes.underlined}>
                {symbol}</span> at a price of <span className={classes.underlined}>
                ${selected.strike}</span> per share, on or before <span className={classes.underlined}>
                {moment.unix(selected.expiration).add(1, 'day').format('M/D')}</span>.
              </Typography>
              <Typography className={classes.dialog}>
                This contract will cost you <span className={classes.underlined}>
                ${price > 0 ? price*100*quantity : selected.lastPrice*100*quantity}</span> total.
              </Typography>
            </CardContent>
          </>
          )}
        </Card>
      </Grid>
    </Grid>
    <Dialog open={configDialogState} className={classes.spacing}>
      <DialogTitle>
          {moment.unix(selected.expiration).format('M/D/YY')} ${selected.strike} Call
      </DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12}>
            <TextField
              label="Quantity"
              value={quantity}
              onChange={(e)=>setQuantity(e.target.value)}
              helperText="How many contracts do you own?"
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Price"
              value={price}
              onChange={(e)=>setPrice(e.target.value)}
              helperText="What was your average cost?"
              fullWidth
            />
          </Grid>
          <Grid item>
            <Typography>
            </Typography>
          </Grid>
        </Grid>
        <Grid container justify="center">
          <Grid item xs={12}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell align='right'>Delta</TableCell>
                  <TableCell align='right'>Gamma</TableCell>
                  <TableCell align='right'>Theta</TableCell>
                  <TableCell align='right'>Vega</TableCell>
                  <TableCell align='right'>Rho</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align='right'>{greekVals.delta}</TableCell>
                  <TableCell align='right'>{greekVals.gamma}</TableCell>
                  <TableCell align='right'>{greekVals.theta}</TableCell>
                  <TableCell align='right'>{greekVals.vega}</TableCell>
                  <TableCell align='right'>{greekVals.rho}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          color="secondary"
          onClick={()=>setConfigDialogState(false)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={()=> {
            overrideConfig({quantity: quantity, avgCost: price});
            setConfigDialogState(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

export default OptionTable;
