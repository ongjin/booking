import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class FormatDateUtil {
    formatDate(dateString: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
        const date = moment(dateString);
        if (date.isValid()) {
            return date.format(format);
        } else {
            return '';
        }
    }
}
