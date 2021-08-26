import {describe} from 'mocha';
import {expect} from 'chai';
import * as progress from '../src/progress';

/**
 * Returns mock of get date function
 * @param offsets
 */
function mockGetDate(offsets: number[]): () => number {
    const epochs: number[] = offsets.reduce((prev: number[], curr, i) => {
        if (i === 0) {
            return prev.concat([Date.now() + curr]);
        } else {
            return prev.concat([prev[i - 1] + curr]);
        }
    }, []);

    return () => epochs.shift() || epochs[epochs.length - 1];
}

describe('Progress Data', () => {
    let progressInst: progress.Progress;
    beforeEach('init', () => {
        progressInst = new progress.Progress();
    });
    it('Should return 50%', () => {
        expect(progressInst.getProgress(2)(1).percentComplete)
            .to.eq(50, '1 out of 2 total should be 50%');
    });
    it('Should update progress', () => {
        let progressFunc = progressInst.getProgress(4);
        expect(progressFunc(1).percentComplete)
            .to.eq(25, '1 out of 4 total should be 25%');
        expect(progressFunc(2).percentComplete)
            .to.eq(50, '2 out of 4 total should be 50%');
        expect(progressFunc(3).percentComplete)
            .to.eq(75, '3 out of 4 total should be 75%');
        expect(progressFunc(4).percentComplete)
            .to.eq(100, '4 out of 4 total should be 100%');
    });
    it('Should round repeating decimal', () => {
        expect(progressInst.getProgress(3)(2).percentComplete)
            .to.eq(66, '2 out of 3 total should be 66%');
    });
    it('Should return 0%', () => {
        expect(progressInst.getProgress(100)(0).percentComplete)
            .to.eq(0, '0 out of 100 total should be 0%');
    });
    it('Should return 100%', () => {
        expect(progressInst.getProgress(100)(100).percentComplete)
            .to.eq(100, '100 out of 100 total should be 100%');
    });
    it('Rounds <0% progress to 0', () => {
        expect(progressInst.getProgress(100)(-1).percentComplete)
            .to.eq(0, '-1 out of 100 total should be 0%');
    });
    it('Rounds >100% progress to 100', () => {
        expect(progressInst.getProgress(100)(101).percentComplete)
            .to.eq(100, '101 out of 100 total should be 100%');
    });
    it('Should return date of calculation', () => {
        const expectedEpoch = Date.now();
        const expectedDate = new Date(expectedEpoch);
        progressInst.getCurrentDate = () => expectedEpoch;
        expect(progressInst.getProgress(1)(0).calcDate.toISOString())
            .to.eq(expectedDate.toISOString());
    });
    it('Should return null time to complete first', () => {
        expect(progressInst.getProgress(1)(0).timeToCompInS)
            .to.be.null;
    });
    it('Should return time to complete', () => {
        progressInst.getCurrentDate = mockGetDate([0, 1000]);
        const progressFunc = progressInst.getProgress(10);
        progressFunc(0);

        const progressData2 = progressFunc(1);
        expect(progressData2.timeToCompInS)
            .to.eq(9, 'First 10% in 1s means 9s left.');
    });
    it('Should round time to complete', () => {
        progressInst.getCurrentDate = mockGetDate([0, 1000]);
        const progressFunc = progressInst.getProgress(10);
        progressFunc(0);

        const progressData2 = progressFunc(3);
        expect(progressData2.timeToCompInS)
            .to.eq(2.33, 'First 30% in 1s means 2.33s left.');
    });
    it('Should update time to complete', () => {
        progressInst.getCurrentDate = mockGetDate([0, 1000, 4000]);
        const progressFunc = progressInst.getProgress(10);
        progressFunc(0);
        progressFunc(1);
        const progressData3 = progressFunc(2);

        expect(progressData3.timeToCompInS)
            .to.eq(32, 'First 10%/1s, then 10%/4s means (4*8)=32s left.');
        expect(progressData3.timeToCompInSAvgd)
            .to.eq(20, 'First 10%/1s, then 10%/4s means Avg((1s/1count),(4s/1count))=2.5velocity so (2.5*8)=20s left.');
    });
    it('Should get progress of multiple counts', () => {
        progressInst.getCurrentDate = mockGetDate([0, 0, 1000, 0]);
        const progressFunc = progressInst.getProgress(10);
        const progressFunc2 = progressInst.getProgress(20);
        progressFunc(0);
        progressFunc2(0);
        const progressData1 = progressFunc(1);
        const progressData2 = progressFunc2(1);

        expect(progressData1.timeToCompInS)
            .to.eq(9, '10%/1s so 9s left');
        expect(progressData2.timeToCompInS)
            .to.eq(19, '5%/1s so 19s left');
    });
});
