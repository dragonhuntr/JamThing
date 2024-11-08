export function formatDate(isoTime: string, offset: number, format: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const date = new Date(isoTime);
    const userLocalTimeUTC = new Date(date.getTime() - offset);

    const replacements: { [key: string]: string | number } = {
        'dddd': days[userLocalTimeUTC.getUTCDay()],
        'D': userLocalTimeUTC.getUTCDate(),
        'MMMM': months[userLocalTimeUTC.getUTCMonth()],
        'h': userLocalTimeUTC.getUTCHours() % 12 || 12, // 12-hour format
        'mm': userLocalTimeUTC.getUTCMinutes().toString().padStart(2, '0'),
        'A': userLocalTimeUTC.getUTCHours() >= 12 ? 'PM' : 'AM',
        'a': userLocalTimeUTC.getUTCHours() >= 12 ? 'p' : 'a', // Lowercase 'a' for AM/PM
    };

    return format.replace(/dddd|D|MMMM|h|mm|A|a/g, match => replacements[match].toString());
}