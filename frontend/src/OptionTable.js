/* DashboardView.tsx
 * This file renders the main dashboard for BomBuilder. When the website is
 * opened to the index endpoint (/), this is rendered. It shows a dashboard
 * of the latest 20 jobs, as well as the ability to search for a past job,
 * or create a new job.
 */

import React from "react";
import {
  Button,
  Dialog,
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
import moment from "moment";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: 600,
    margin: theme.spacing(1),
    marginTop: 50,
  },
  bold: {
    fontWeight: "bold",
  },
  tableRowLightMode: {
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: ({ gainOrLoss }) => gainOrLoss + "1A",
      color: "white",
    },
  },
  table: {
    width: "100%",
    maxHeight: 200,
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
}));

interface OptionTableProps {
  chosenOptionChain: any;
  gainOrLoss: string;
  selectedOption: number;
  isSelected: (selected) => void;
}

function OptionTable({
  chosenOptionChain,
  gainOrLoss,
  selectedOption,
  isSelected,
}: OptionTableProps) {
  const classes = useStyles({ gainOrLoss });
  const tableRef = React.createRef();
  const selectedRef = React.createRef();
  const [configDialogState, setConfigDialogState] = React.useState(false);
  const [selected, setSelected] = React.useState({});
  const [quantity, setQuantity] = React.useState(1);

  const displayCallOptions = () => {
    return chosenOptionChain
      .filter((call) => call)
      .map((call) => {
        let selected = call.strike === selectedOption;
        let sign = call.percentChange > 0 ? "+" : "-";
        return (
          <TableRow
            key={call.contractSymbol}
            selected={selected}
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
                  call.strike === selectedOption ? "contained" : "outlined"
                }
              >
                ${call.lastPrice.toFixed(2)}
              </Button>
            </TableCell>
            <TableCell>
              <CreateIcon
                onClick={()=>setConfigDialogState(true)}
              />
            </TableCell>
          </TableRow>
        );
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
    <TableContainer component={Paper} className={classes.table} ref={tableRef}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Strike Price</TableCell>
            <TableCell>Break Even</TableCell>
            <TableCell>% Change</TableCell>
            <TableCell>Change</TableCell>
            <TableCell>Price</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{displayCallOptions()}</TableBody>
      </Table>
    </TableContainer>
    <Dialog open={configDialogState} className={classes.spacing}>
      <DialogTitle onClose={()=>setConfigDialogState(false)}>
          {moment.unix(selected.expiration).format('M/D/YY')} ${selected.strike} Call
        </DialogTitle>
      <DialogContent>
        <Grid container >
          <Grid item xs={12}>
            <TextField
              label="Quantity"
              value={quantity}
              onChange={(e)=>setQuantity(e.target.value)}
              helperText="How many contracts do you own?"
              fullWidth
            />
          </Grid>
          <Grid item>
            <Typography>
              The Greeks
            </Typography>
            <Grid item>
              <Typography>
                Delta
              </Typography>
            </Grid>
          </Grid>

        </Grid>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default OptionTable;
