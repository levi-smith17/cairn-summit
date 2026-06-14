export interface ICalEvent {
    uid: string;
    url: string;
    title: string;
    startDate: Date;
    endDate: Date | null;
    allDay: boolean;
    notes: string | null;
    location: string | null;
    recurrenceRule: string | null;
}
export declare function parseICSEvents(icsString: string, url: string, from?: Date, to?: Date): ICalEvent[];
export declare function fetchSubscriptionEvents(feedUrl: string, from: Date, to: Date): Promise<ICalEvent[]>;
//# sourceMappingURL=ical.d.ts.map