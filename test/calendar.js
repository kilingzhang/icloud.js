const authenticate = require("./authenticate");
const {iCloudCalendarCollection} = require("../build/services/calendar");

authenticate.then(async (icloud) => {
    const calendarService = icloud.getService("calendar");
    const calendars = await calendarService.calendars();
    const events = await calendarService.events();
    console.log(`You have ${calendars.length} calendars, and ${events.length} events`);

    for (const calendar of calendars) {
        console.log(`Calendar: ${JSON.stringify(calendar)}`);
    }

    if (events.length > 0) {
        const eventDetail = await calendarService.eventDetails(events[0].pGuid, events[0].guid);
        console.log(`Let's get first your event: ${events[0].title}`);
        console.log(JSON.stringify(events[0], null, 4));
        console.log(`Let's get first your event detail: ${eventDetail.title}`);
        console.log(JSON.stringify(eventDetail, null, 4));
    }

    const newCalendar = await calendarService.createCollection({
        title: "New Calendar",
    });
    console.log(`New calendar created: ${JSON.stringify(newCalendar)}`);
});
