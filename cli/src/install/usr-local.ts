import { File } from 'src/lib/fs';

export function usrLocalBinNeeva(): File {
    return File.fromPath('/usr/local/bin/nva');
}
