require('../../shared/extensions');
const { StringConstants} = require('../../shared/strings');
const config = require('config');
const {google, GoogleApis} = require('googleapis');
const calendar = google.calendar('v3');
const {generateJwtClient} = require('./general');
const {logError} = require('../../debug/logging');

// Initialize constants
const SCOPES = [StringConstants.Calendar.Scopes.EventsRW];


/**
 * Get all events on the calendar for the given date
 * @param {date} date : we will query all events on this date 
 */
async function getEventsForDate(date) {
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    let startDate = new Date(date);
    let endDate = new Date(startDate);

    startDate.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);
    endDate.setDate(endDate.getDate() + 1);

    try {
        const result = await calendar.events.list({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            timeMin: startDate,
            timeMax: endDate,
            maxResults: 1000
        });
        return result.data.items;
    } catch (err) {
        logError(err, `Failed to retrieve events for given date: ${date}`);
        return null;
    }
}


/**
 * 
 * @param {startDate} startDate 
 * @param {endDate} endDate :  
 */
async function getEventsForDateTime(startDate, endDate) {
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    try {
        const result = await calendar.events.list({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            timeMin: startDate,
            timeMax: endDate,
            maxResults: 1000
        });
    
        return result.data.items;
    } catch (err) {
        logError(err, 
            `Failed to retrieve events for given range:` +
            `\n\tstartDate : ${startDate}` +
            `\n\tendDate   : ${endDate}`);
        return null;
    }
}

/**
 * Gets events for a given range using numeric time values
 * @param {startDate} startDate : start date
 * @param {endDate} endDate : end date
 * @param {startTime} startTime : start time as a number (between 0 - 2359)
 * @param {endTime} endTime : end time as a number (between 0 - 2359) 
 */
async function getEventsForDateAndTime(
    startDate, 
    endDate,
    startTime,
    endTime) {
    let newStart = new Date(startDate);
    let newEnd = new Date(endDate);
    newStart.setHours(startTime / 100, startTime % 100, 0, 0);
    newEnd.setHours(endTime / 100, endTime % 100, 0, 0);

    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    try {
        const result = await calendar.events.list({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            timeMin: newStart,
            timeMax: newEnd,
            maxResults: 1000
        });
    
        return result.data.items;
    } catch (err) {
        logError(err, 
            `Failed to retrieve events for given range:` +
            `\n\tstartDate : ${newStart}` +
            `\n\tendDate   : ${newEnd}`);
        return null;
    }
}

/**
 * Gets events for a given range using numeric time values
 * @param {Id} : Certificate number of user
 */
async function getEventsForUserId(id){
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    let date = new Date();
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() - ((date.getDay() + 1) % 7));

    try {
        const result = await calendar.events.list({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            timeMin: date,
            maxResults: 1000
        });
    
        const events = result.data.items;
        const userEvents = [];
        events.forEach(event => {
            if (event.summary === id || event.summary === `#${id}`)
                userEvents.push(event);
        })
        return userEvents;
    } catch (err) {
        logError(err, 
            `Failed to retrieve events for given range:` +
            `\n\tstartDate : ${newStart}` +
            `\n\tendDate   : ${newEnd}`);
        return null;
    }
}

/**
 * Creates an event on the calendar
 * @param {event} event : event object to be posted to calendar 
 */
async function postEventToCalendar(event) {
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    try {
        const result = await calendar.events.insert({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            resource: event
        });
    
        return result;
    } catch (err) {
        logError(err, `Failed to post event to calendar:\nEvent: ${event}`);
        return null;
    }
}

/**
 * Creates multiple events on the calendar
 * @param {event} event : event object to be posted to calendar 
 */
async function postEventsToCalendar(events) {
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    const succeeded = [];
    try {
        for (let i=0; i<events.length; i++) {
            let res = await calendar.events.insert({
                auth: jwtClient,
                calendarId: config.get('calendarId'),
                resource: events[i]
            });

            succeeded.push(res);
        }
    
        return succeeded;
    } catch (err) {
        logError(err, `Failed to post event to calendar:\nEvent: ${event}`);

        for (let i=0; i<succeeded.length; i++) {
            await calendar.events.delete({
                auth: jwtClient,
                calendarId: config.get('calendarId'),
                eventId: succeeded[i].id
            });
        }

        return null;
    }
}


/**
 * Returns an event object used for creating calendar events
 * @param {summary} summary : short description of event 
 * @param {location} location : location of the event 
 * @param {description} description : description of the event
 * @param {start} start : start date of the event 
 * @param {end} end : end date of the event
 * @param {startTime} startTime : start time of the event (number from 0 - 2359)
 * @param {endTime} endTime : end time of the event (number from 0 - 2359)
 */
function generateEvent(
    summary,
    location,
    description,
    start,
    end,
    startTime,
    endTime,
    attendees) {
    let startDate = new Date(start);
    let endDate = new Date(end);


    startDate.setHours(startTime / 100, startTime % 100, 0, 0);
    endDate.setHours(endTime / 100, endTime % 100, 0, 0);

    attendees = Array.isArray(attendees) ? attendees : [attendees];

    return {
        summary: summary,
        location: location,
        description: description,
        start: {
            dateTime: startDate,
            timeZone: 'America/Los_Angeles'
        },
        end: {
            dateTime: endDate,
            timeZone: 'America/Los_Angeles'
        },
        attendees: attendees
    }
}

async function deleteEventById(id) {
    let jwtClient = await generateJwtClient(SCOPES);

    if (jwtClient === null) 
        throw "Failed to generate jwt client";

    try {
        const result = await calendar.events.delete({
            auth: jwtClient,
            calendarId: config.get('calendarId'),
            eventId: id
        });
    
        return result;
    } catch (err) {
        logError(err, `Failed to post event to calendar:\nEvent: ${event}`);
        return null;
    }
}


module.exports = {
    generateEvent,
    postEventToCalendar,
    getEventsForDate,
    getEventsForDateTime,
    getEventsForDateAndTime,
    getEventsForUserId,
    deleteEventById,
    postEventsToCalendar
}