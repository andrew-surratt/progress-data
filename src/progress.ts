// Type to use for progress counter
export type ProgressCount = number;
export type EpochTimeInMS = number;
export type CountVelocity = number;

// Types for progress data
export type PercentComplete = number;
export type CalcDatetime = Date;
export type TimeToCompInS = number | null;

/**
 * Supported data for progress.
 */
export interface ProgressData {
    percentComplete: PercentComplete;
    calcDate: CalcDatetime
    timeToCompInS: TimeToCompInS
    timeToCompInSAvgd: TimeToCompInS
}

/**
 * Progress data calculation function.
 */
export type GetProgressData<T> = (progress: T) => ProgressData;

export class Progress {
    /**
     * Returns progress calculation function for the total.
     * @param total
     */
    getProgress(total: ProgressCount): GetProgressData<ProgressCount> {
        let count: ProgressCount = 0;
        let prevCount: ProgressCount;
        let tPerC: CountVelocity;
        let prevTPerC: CountVelocity;
        let prevEpoch: EpochTimeInMS;
        return (progress: ProgressCount): ProgressData => {
            // Get datetime of calculation
            const currentEpoch: EpochTimeInMS = this.getCurrentDate();
            const calcDate: Date = new Date(currentEpoch);
            if (progress < 0) {
                // Can't have progress less than 0%
                count = 0;
            } else if (progress > total) {
                // Can't have progress greater than 100%
                count = total;
            } else {
                count = progress;
            }
            // Round progress down to give realistic percent
            // (e.g. 99.5%, 99.6%, 99.7% shouldn't all show 100%)
            // TODO: might be worthwhile to have some decimal points
            const percentComplete: PercentComplete = Math.floor((count / total) * 100);

            // Calculate velocity
            if (prevCount !== undefined && prevEpoch) {
                tPerC = this.calcTPerC(currentEpoch, prevEpoch, count, prevCount);
                // Average with previous velocity if we have it
                prevTPerC = prevTPerC !== undefined ? (tPerC + prevTPerC) / 2 : tPerC;
            }

            // Estimate time to complete based on current velocity
            const countLeft: ProgressCount = total - count;
            const timeToCompInS: TimeToCompInS = tPerC !== undefined ?
                this.roundDecimal(countLeft * tPerC) : null;
            // Estimate time to complete based on average velocity
            const timeToCompInSAvgd: TimeToCompInS = prevTPerC !== undefined ?
                this.roundDecimal(countLeft * prevTPerC) : null;

            //
            prevCount = count;
            prevEpoch = currentEpoch;
            return {
                percentComplete,
                calcDate,
                timeToCompInS,
                timeToCompInSAvgd,
            };
        };
    }

    /**
     * Time per count over a period ("previous" to "current").
     * @param currEpoch Current epoch time in ms.
     * @param prevEpoch Previous epoch time in ms.
     * @param currCount Current count.
     * @param prevCount Previous count.
     */
    calcTPerC(currEpoch: EpochTimeInMS, prevEpoch: EpochTimeInMS, currCount: ProgressCount, prevCount: ProgressCount): CountVelocity {
        // Time since last check
        const msSinceLast: EpochTimeInMS = currEpoch - prevEpoch;
        // Count progressed since last check
        const progSinceLast: ProgressCount = currCount - prevCount;
        // Time progressed per count progressed
        return (msSinceLast / progSinceLast) / 1000;
    }

    /**
     * Current epoch time in ms.
     */
    getCurrentDate(): EpochTimeInMS {
        return Date.now();
    }

    /**
     * Rounds a number to `points` decimal points.
     * @param num decimal.
     * @param points integer digits after decimal to round.
     */
    roundDecimal(num: number, points = 2): number {
        return Number(num.toFixed(points));
    }
}
