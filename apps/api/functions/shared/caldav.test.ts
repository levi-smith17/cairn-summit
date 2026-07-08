import { describe, it, expect } from 'vitest'
import { parseCalDavCalendarList } from './caldav'

const ICLOUD_MULTISTATUS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<multistatus xmlns="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <response>
    <href>/123456789/calendars/</href>
    <propstat>
      <prop>
        <displayname>Home</displayname>
        <resourcetype><collection/><calendar/></resourcetype>
        <cal:supported-calendar-component-set><cal:comp name="VEVENT"/></cal:supported-calendar-component-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <href>/123456789/calendars/work/</href>
    <propstat>
      <prop>
        <displayname>Work</displayname>
        <resourcetype><collection/><calendar/></resourcetype>
        <cal:supported-calendar-component-set><cal:comp name="VEVENT"/></cal:supported-calendar-component-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <href>/123456789/calendars/reminders/</href>
    <propstat>
      <prop>
        <displayname>Reminders</displayname>
        <resourcetype><collection/><calendar/></resourcetype>
        <cal:supported-calendar-component-set><cal:comp name="VTODO"/></cal:supported-calendar-component-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`

describe('parseCalDavCalendarList', () => {
    it('parses iCloud unprefixed DAV XML and ignores non-event calendars', () => {
        const calendars = parseCalDavCalendarList(
            ICLOUD_MULTISTATUS,
            'https://caldav.icloud.com/123456789/calendars/',
        )

        expect(calendars).toHaveLength(2)
        expect(calendars.map(c => c.displayName)).toEqual(['Home', 'Work'])
        expect(calendars[1]?.url).toBe('https://caldav.icloud.com/123456789/calendars/work/')
    })

    it('parses prefixed DAV XML from other servers', () => {
        const calendars = parseCalDavCalendarList(
            `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/calendars/personal/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Personal</d:displayname>
        <d:resourcetype><d:collection/><cal:calendar/></d:resourcetype>
        <cal:supported-calendar-component-set><cal:comp name="VEVENT"/></cal:supported-calendar-component-set>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`,
            'https://caldav.example.com/calendars/',
        )

        expect(calendars).toHaveLength(1)
        expect(calendars[0]?.displayName).toBe('Personal')
    })

    it('reads displayname from successful propstat blocks only', () => {
        const calendars = parseCalDavCalendarList(
            `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <response>
    <href>/123456789/calendars/home/</href>
    <propstat>
      <prop><displayname>Home</displayname></prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
    <propstat>
      <prop><getctag>ignored</getctag></prop>
      <status>HTTP/1.1 404 Not Found</status>
    </propstat>
    <propstat>
      <prop>
        <resourcetype><collection/><calendar/></resourcetype>
        <cal:supported-calendar-component-set><cal:comp name="VEVENT"/></cal:supported-calendar-component-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`,
            'https://caldav.icloud.com/123456789/calendars/',
        )

        expect(calendars).toHaveLength(1)
        expect(calendars[0]?.displayName).toBe('Home')
    })
})
