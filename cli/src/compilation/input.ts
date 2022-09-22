import moment from 'moment';

// This tracks the last time a type of file was changed, and when the
// appropriate compilation step was run. In general, we check to see
// if lastChange > lastCompile, and if so we re-run the compile.
export interface UpdateTime {
    lastChange: moment.Moment;
    lastCompile: moment.Moment;
}
