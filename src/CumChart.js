// @flow

import React, { PureComponent, Fragment } from "react";
import {
  addMonths,
  startOfMonth,
  addYears,
  differenceInCalendarMonths,
  format
} from "date-fns";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import range from "lodash/range";
import numeral from "numeral";

const rates = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07];

const rateColor = {
  0.01: "#5DA5DA",
  0.02: "#FAA43A",
  0.03: "#60BD68",
  0.04: "#F17CB0",
  0.05: "#B2912F",
  0.06: "#B276B2",
  0.07: "#DECF3F"
};
const rateAreaColor = {
  0.01: "#acacac",
  0.02: "#b9b9b9",
  0.03: "#c6c6c6",
  0.04: "#d3d3d3",
  0.05: "#dfdfdf",
  0.06: "#ececec",
  0.07: "#f9f9f9"
};

type Props = {
  amount: number,
  debt: number,
  age: number,
  downPayment: number,
  retirementAge: number
};

class CumChart extends PureComponent<Props> {
  buildData() {
    const { debt, age, downPayment } = this.props;

    const now = startOfMonth(new Date());
    const deathYear = addYears(now, 100 - age);
    const numBuckets =
      downPayment > 0
        ? Math.ceil(debt / downPayment)
        : differenceInCalendarMonths(deathYear, now);
    const series = new Array(numBuckets);

    for (let i = 0; i < series.length; i++) {
      if (i === 0) {
        // seed
        const bucket = {
          date: +now,
          debt,
          downPayment,
          cdp: downPayment
        };
        rates.forEach(rate => {
          const ip = debt * rate / 12;
          bucket[`ip${rate}`] = ip;
          bucket[`cip${rate}`] = ip;
          bucket[`cipndp${rate}`] = ip;
        });
        series[i] = bucket;
      } else {
        const prevBucket = series[i - 1];
        const firstBucket = series[0];
        const currentDebt = prevBucket.debt - downPayment;
        const bucket = {
          date: +addMonths(now, i),
          debt: currentDebt,
          downPayment
        };
        bucket.cdp = prevBucket.cdp + downPayment;
        rates.forEach(rate => {
          const ip = currentDebt * rate / 12;
          bucket[`ip${rate}`] = ip;
          bucket[`cip${rate}`] = prevBucket[`cip${rate}`] + ip;
          bucket[`cipndp${rate}`] =
            prevBucket[`cipndp${rate}`] + firstBucket[`ip${rate}`];
        });
        series[i] = bucket;
      }
    }
    return series.map(bucket => {
      rates.forEach((rate, idx) => {
        bucket[`cipd${rate}`] =
          bucket[`cip${rate}`] -
          (idx === 0 ? 0 : bucket[`cip${rates[idx - 1]}`]);
      });
      const sum = rates.reduce((acc, x) => acc + bucket[`cipd${x}`], 0);
      if (sum !== bucket[`cip${rates[rates.length - 1]}`]) {
        console.log("sum missmatch", sum, bucket[`cip0.07`]);
      }
      return bucket;
    });
    // .filter(bucket => bucket.debt > 0);
  }
  render() {
    console.log("render chart");
    const { amount, age, retirementAge } = this.props;
    const data = this.buildData();
    const { date, ...lastValues } = data[data.length - 1];
    const maxValue = Math.ceil(Math.max(...Object.values(lastValues)));
    const debtQuotesReferences = [0.9, 0.75, 0.5, 0.25].reduce(
      (acc, debtQuote) => {
        const debtQuoteIdx = data.findIndex(
          ({ debt }) => debt <= amount * debtQuote
        );
        if (debtQuoteIdx) {
          acc.push(
            <ReferenceLine
              key={`ref-${debtQuote}`}
              x={+data[debtQuoteIdx].date}
              stroke="black"
              strokeWidth={1}
              strokeDasharray="2 2"
              label={{
                offset: 60,
                value: `${numeral(debtQuote).format("0.0%")}`,
                angle: 90,
                position: "insideTop"
              }}
            />
          );
        }
        return acc;
      },
      []
    );
    return (
      <Fragment>
        <ResponsiveContainer width="100%" height={600}>
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis
              dataKey="date"
              tickFormatter={tick => format(new Date(tick), "YYYY")}
              minTickGap={50}
            />
            <YAxis
              ticks={range(0, maxValue, 250000)}
              tickFormatter={tick => numeral(tick).format("0,0")}
            />
            <Tooltip
              formatter={(value, name, props) => {
                const match = name.match(/Cum (\d)%/);
                if (match) {
                  const rate = parseInt(match[1], 10);
                  return numeral(value * rate).format("0,0");
                }
                return numeral(value).format("0,0");
              }}
              labelFormatter={label => format(label, "MMM YYYY")}
              itemSorter={(a, b) => a.name.localeCompare(b.name)}
            />
            <Legend />

            <Area
              stackId="cumInt"
              dataKey="cdp"
              name="Cum Down Payment"
              fill="#2a2a2a"
              stroke="#2a2a2a"
              fillOpacity={0.7}
              strokeOpacity={0}
            />
            {rates.map(rate => (
              <Area
                key={`cip${rate}`}
                stackId="cumInt"
                dataKey={`cipd${rate}`}
                fill={rateAreaColor[rate]}
                fillOpacity={0.7}
                stroke={rateAreaColor[rate]}
                strokeOpacity={0}
                name={`Cum ${numeral(rate).format("0%")}`}
              />
            ))}

            <Line
              type="monotone"
              dataKey="debt"
              stroke="#ff7300"
              strokeWidth={2}
              dot={false}
              name="Debt"
            />

            {rates.map(rate => (
              <Line
                key={`cipndp${rate}`}
                type="monotone"
                dataKey={`cipndp${rate}`}
                stroke={rateColor[rate]}
                strokeDasharray="5 2"
                strokeWidth={1}
                dot={false}
                name={`Proj ${numeral(rate).format("0%")}`}
              />
            ))}

            <ReferenceLine
              x={+startOfMonth(addYears(new Date(), retirementAge - age))}
              stroke="green"
              strokeWidth={2}
              label={{
                offset: 40,
                value: "Retirement",
                angle: 90,
                position: "insideTop"
              }}
            />

            <ReferenceLine
              x={+startOfMonth(addYears(new Date(), 82 - age))}
              stroke="red"
              strokeWidth={2}
              label={{
                offset: 60,
                value: "Life expectancy",
                angle: 90,
                position: "insideTop"
              }}
            />

            {debtQuotesReferences}
          </ComposedChart>
        </ResponsiveContainer>
      </Fragment>
    );
  }
}

export default CumChart;
