# Progress Data
Lightweight library to get data on the progress of something

## Features

* Percent Complete
* Completion time estimate
* Averaged completion time estimate
* Datetime of above calculations

## Usage
```typescript
import {GetProgressData, Progress, ProgressCount, ProgressData} from 'progress-data';

// Mock long running task
import * as util from 'util';
const setTimeoutPromise: <T>(a: number, b: T) => Promise<T> = util.promisify(setTimeout);
let count = 0;
const pollLongRunningTask = async() => setTimeoutPromise<number>(1000, count++);

(async function(){
    //
    // Init with total
    //
    const calcProg: GetProgressData<ProgressCount> = (new Progress()).getProgress(5);
    
    //
    // Poll long running task to calculate progress
    //
    let progressData: ProgressData = calcProg(await pollLongRunningTask());
    
    while (progressData.percentComplete < 100) {
        
        progressData = calcProg(await pollLongRunningTask());
        
        console.log(`${progressData.calcDate.toISOString()}: ${progressData.percentComplete}% finished,` +
            ` ~${progressData.timeToCompInSAvgd}s to complete.`);
    }
})();
```

## Contributing

### Build
`npm run build`

### Test
`npm test`
