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
    count: ProgressCount = 0;
    total: ProgressCount = 0;
    tPerC?: CountVelocity;
    prevCount?: ProgressCount;
    prevEpoch?: EpochTimeInMS;
    prevTPerC?: CountVelocity;

    /**
     * Returns progress calculation function for the total.
     * @param total
     */
    getProgress(total: ProgressCount): GetProgressData<ProgressCount> {
        this.total = total;
        return (progress: ProgressCount): ProgressData => {
            // Get datetime of calculation
            const currentDate: EpochTimeInMS = this.getCurrentDate();
            const calcDate: Date = new Date(currentDate);
            if (progress < 0) {
                // Can't have progress less than 0%
                this.count = 0;
            } else if (progress > this.total) {
                // Can't have progress greater than 100%
                this.count = this.total;
            } else {
                this.count = progress;
            }
            // Round progress down to give realistic percent
            // (e.g. 99.5%, 99.6%, 99.7% shouldn't all show 100%)
            // TODO: might be worthwhile to have some decimal points
            const percentComplete: PercentComplete = Math.floor((this.count / this.total) * 100);
            // Calculate time to complete
            if (this.prevCount !== undefined && this.prevEpoch) {
                this.tPerC = this.calcTPerC(currentDate, this.prevEpoch, this.count, this.prevCount);
                // Average with previous velocity if we have it
                this.prevTPerC = this.prevTPerC !== undefined ? (this.tPerC + this.prevTPerC) / 2 : this.tPerC;
            }
            const countLeft: ProgressCount = this.total - this.count;
            // Estimate time to complete based on current velocity
            const timeToCompInS: TimeToCompInS = this.tPerC !== undefined ?
                this.roundDecimal(countLeft * this.tPerC) : null;
            // Estimate time to complete based on average velocity
            const timeToCompInSAvgd: TimeToCompInS = this.prevTPerC !== undefined ?
                this.roundDecimal(countLeft * this.prevTPerC) : null;
            this.prevCount = this.count;
            this.prevEpoch = currentDate;
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
