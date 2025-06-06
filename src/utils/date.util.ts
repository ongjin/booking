import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class DateUtil {
    formatDate(dateString: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
        const date = moment(dateString);
        if (date.isValid()) {
            return date.format(format);
        } else {
            return '';
        }
    }

    escapeParseTimeString(timeString: string): number {
        const [hours, minutes] = timeString.trim().split(':').map(Number);
        return hours * 60 + (minutes ? minutes : 0);
    }

    zeroWorldParseTimeString(timeString: string): number {
        const [hours, minutes] = timeString
            .replace('시', '')
            .replace('분', '')
            .trim()
            .split(' ')
            .map(Number)
        return hours * 60 + (minutes ? minutes : 0);
    }

    // 시간 문자열을 "14시" 또는 "14:00" 형식으로 표준화
    normalizeTime(time: string): string {
        time = time.trim().replace('시', '').replace('분', '');
        if (time.includes(':')) {
            return time;
        } else {
            return `${time}:00`;
        }
    }

    // 날짜가 '2024-08-27' 또는 '20240827' 형식으로 주어질 수 있으므로 이를 파싱하여 Date 객체로 변환
    convertDateToTimestamp(dateStr: string): number {
        const [year, month, day] = this.formatDate(dateStr, 'YYYY-MM-DD').split('-').map(Number);

        // Date 객체를 생성하고 해당 객체를 타임스탬프로 변환
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getTime();
    }

    convertToKST(serverTime: string): string {
        // 서버 시간 문자열을 Date 객체로 변환
        const utcDate = new Date(serverTime);

        // UTC 시간을 KST로 변환 (+9시간)
        const kstOffset = 9 * 60; // 9시간 * 60분
        const kstDate = new Date(utcDate.getTime() + kstOffset * 60 * 1000);

        // 한국 시간 형식으로 반환
        return kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    }
}
