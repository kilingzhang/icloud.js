import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import fetch from "node-fetch";
import iCloudService from "..";

dayjs.extend(utc);
dayjs.extend(timezone);

interface iCloudCalendarAlarm {
    messageType: string;
    pGuid: string;
    guid: string;
    isLocationBased: boolean;
    measurement: {
        hours: number;
        seconds: number;
        weeks: number;
        minutes: number;
        days: number;
        before: boolean;
    }
}

interface iCloudCalendarEvent {
    tz: string;
    icon: number;
    recurrenceException: boolean;
    title: string;
    tzname: string;
    duration: number;
    allDay: boolean;
    startDateTZOffset: string;
    pGuid: string;
    hasAttachments: boolean;
    birthdayIsYearlessBday: boolean;
    alarms: string[];
    lastModifiedDate: number[];
    readOnly: boolean;
    localEndDate: number[];
    recurrence: string;
    localStartDate: number[];
    createdDate: number[];
    extendedDetailsAreIncluded: boolean;
    guid: string;
    etag: string;
    startDate: number[];
    endDate: number[];
    birthdayShowAsCompany: boolean;
    recurrenceMaster: boolean;
    attachments: any[];
    shouldShowJunkUIWhenAppropriate: boolean;
    url: string;
}

interface iCloudCalendarRecurrence {
    guid: string;
    pGuid: string;
    freq: string;
    interval: number;
    recurrenceMasterStartDate: any[];
    weekStart: string;
    frequencyDays: string;
    weekDays: any[];
}

interface iCloudCalendarInvitee {
    commonName: string;
    isMe: boolean;
    isOrganizer: boolean;
    inviteeStatus: string;
    pGuid: string;
    guid: string;
    isSenderMe: boolean;
    email: string;
    cutype: string;
}

interface iCloudCalendarCollection {
    title: string;
    guid: string;
    ctag: string;
    order: number;
    color: string;
    symbolicColor: string;
    enabled: boolean;
    createdDate: number[];
    isFamily: boolean;
    lastModifiedDate: number[];
    shareTitle: string;
    prePublishedUrl: string;
    supportedType: string;
    etag: string;
    isDefault: boolean;
    objectType: string;
    readOnly: boolean;
    isPublished: boolean;
    isPrivatelyShared: boolean;
    extendedDetailsAreIncluded: boolean;
    shouldShowJunkUIWhenAppropriate: boolean;
    publishedUrl: string;
}

interface iCloudCalendarEventDetailResponse {
    Alarm: Array<iCloudCalendarAlarm>;
    Event: Array<iCloudCalendarEvent>;
    Invitee: Array<iCloudCalendarInvitee>;
    Recurrence: Array<iCloudCalendarRecurrence>;
}

interface iCloudCalendarStartupResponse {
    Alarm: Array<iCloudCalendarAlarm>,
    Event: Array<iCloudCalendarEvent>,
    Collection: Array<iCloudCalendarCollection>
}

interface iCloudCalendarEventsResponse {
    Alarm: Array<iCloudCalendarAlarm>;
    Event: Array<iCloudCalendarEvent>;
    Recurrence: Array<iCloudCalendarRecurrence>;
}

export class iCloudCalendarService {
    service: iCloudService;
    serviceUri: string;
    dsid: string;
    dateFormat = "YYYY-MM-DD";
    calendarServiceUri: string;
    tz = dayjs.tz.guess() || "UTC";

    constructor(service: iCloudService, serviceUri: string) {
        this.service = service;
        this.serviceUri = serviceUri;
        this.dsid = this.service.accountInfo.dsInfo.dsid;
        this.calendarServiceUri = `${service.accountInfo?.webservices?.calendar?.url}/ca`;
    }

    private async fetchEndpoint<T>(
        method: string,
        endpointUrl: string,
        params?: Record<string, string>,
        data?: Record<string, any>,
        headers?: Record<string, string>,
    ): Promise<T> {
        const url = new URL(`${this.calendarServiceUri}${endpointUrl}`);
        url.search = new URLSearchParams({...params}).toString();

        const response = await fetch(url, {
            method,
            headers: {
                ...this.service.authStore.getHeaders(),
                Referer: "https://www.icloud.com/",
                ...headers
            },
            body: data ? JSON.stringify(data) : undefined
        });

        return await response.json() as T;
    }

    async eventDetails(calendarGuid: string, eventGuid: string) {
        const params = {
            lang: "en-us",
            usertz: this.tz,
            dsid: this.dsid
        };
        const response = await this.fetchEndpoint<iCloudCalendarEventDetailResponse>(
            "GET",
            `/eventdetail/${calendarGuid}/${eventGuid}`,
            params,
        );

        return response.Event[0];
    }

    async events(from?: Date, to?: Date) {
        const params = {
            startDate: dayjs(from ?? dayjs().startOf("month")).format(this.dateFormat),
            endDate: dayjs(to ?? dayjs().endOf("month")).format(this.dateFormat),
            dsid: this.dsid,
            lang: "en-us",
            usertz: this.tz
        }
        const response = await this.fetchEndpoint<iCloudCalendarEventsResponse>("GET", "/events", params);

        return response.Event || [];
    }

    async calendars() {
        const params = {
            startDate: dayjs(dayjs().startOf("month")).format(this.dateFormat),
            endDate: dayjs(dayjs().endOf("month")).format(this.dateFormat),
            dsid: this.dsid,
            lang: "en-us",
            usertz: this.tz
        }
        const response = await this.fetchEndpoint<iCloudCalendarStartupResponse>("GET", "/startup", params);
        return response.Collection || [];
    }

    newId() {
        const structure = [8, 4, 4, 4, 12];
        const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
        const id = structure.map((part) => {
            let partStr = "";
            for (let i = 0; i < part; i++)
                partStr += chars[Math.trunc(Math.random() * chars.length)];

            return partStr;
        });
        return id.join("-");
    }

    async createCollection(collection: iCloudCalendarCollection) {
        const guid = this.newId();
        const data = {
            Collection: {
                supportedType: "Event",
                extendedDetailsAreIncluded: true,
                order: 3,
                symbolicColor: collection.color || "#ff2d55",
                color: collection.color || "#ff2d55",
                guid,
                title: collection.title,
                participants: null,
                meAsParticipant: null,
                deferLoading: null,
                shareType: null,
                shareTitle: "",
                etag: null,
                ctag: null,
                objectType: collection.objectType || "personal",
                readOnly: null,
                lastModifiedDate: null,
                description: null,
                sharedUrl: "",
                ignoreAlarms: null,
                enabled: true,
                ignoreEventUpdates: null,
                emailNotification: null,
                removeTodos: null,
                removeAlarms: null,
                isDefault: null,
                prePublishedUrl: null,
                publishedUrl: null,
                isFamily: null
            },
            ClientState: {
                Collection: [
                    {
                        guid
                    }
                ],
                fullState: false,
                userTIme: dayjs().unix(),
                alarmRange: 60
            }
        };

        const startDate = dayjs().format("YYYY-MM-DD");
        const endDate = startDate;

        const params = {
            clientBuildNumber: this.service.options.clientBuildNumber,
            clientId: this.service.options.clientId,
            clientMasteringNumber: this.service.options.clientMasteringNumber,
            lang: this.service.options.clientLanguage,
            clientVersion: this.service.options.clientVersion,
            usertz: this.service.options.tz ?? this.tz,
            requestID: this.service.options.requestID,
            dsid: this.dsid,
            startDate,
            endDate
        };

        return await this.fetchEndpoint<any>(
            "POST",
            `/collections/${guid}`,
            params,
            data
        );
    }
}

export type {
    iCloudCalendarAlarm,
    iCloudCalendarCollection,
    iCloudCalendarEvent,
    iCloudCalendarEventDetailResponse,
    iCloudCalendarEventsResponse,
    iCloudCalendarInvitee,
    iCloudCalendarRecurrence,
    iCloudCalendarStartupResponse
};
