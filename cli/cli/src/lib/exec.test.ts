import { execfg } from './exec';

describe('os/exec', () => {
    describe('execfg', () => {
        it('should return correct exit code', async () => {
            const result = await execfg('git status', { stdio: 'ignore' });
            expect(result.cmd).toBe('git status');
            expect(result.exitCode).toBe(0);
        });
    });
});
