export interface ExternalItineraryEvent {
    uid: string;
    title: string;
    startDate: string;
    endDate: string | null;
    allDay: boolean;
    location: string | null;
    notes: string | null;
    color: string;
    readonly: boolean;
    calendarId: string;
    url: string;
    recurrenceRule: string | null;
}
export declare function fetchUserItineraryEvents(pk: string, from?: Date, to?: Date): Promise<ExternalItineraryEvent[]>;
//# sourceMappingURL=itinerary-events.d.ts.map